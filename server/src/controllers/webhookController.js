const voiceService = require('../services/voiceService');
const { extractLeadAndAppointmentFromTranscript } = require('../services/openAiExtractionService');
const CallLog = require('../models/CallLog');
const Call = require('../models/Call');
const Lead = require('../models/Lead');
const Appointment = require('../models/Appointment');
const Organization = require('../models/Organization');

// @desc    Handle incoming telephony voice webhook (Twilio / Vapi / Custom)
// @route   POST /api/webhooks/voice/incoming
// @access  Public (Webhook verification in production)
exports.handleIncomingVoiceCall = async (req, res, next) => {
  try {
    const providerHeader = req.headers['x-voice-provider'] || (req.body.CallSid ? 'twilio' : 'vapi');
    const result = await voiceService.handleIncomingCallWebhook(req.body, providerHeader);

    // If Twilio requested TwiML, return XML
    if (result.providerResponse?.twiml) {
      res.type('text/xml');
      return res.send(result.providerResponse.twiml);
    }

    res.json(result);
  } catch (error) {
    console.error('[Voice Webhook Error]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Handle voice call events (status changes, transcript updates)
// @route   POST /api/webhooks/voice/events
// @access  Public
exports.handleVoiceCallEvents = async (req, res, next) => {
  try {
    console.log('[Webhook] Voice event received:', JSON.stringify(req.body).slice(0, 300));
    const result = await voiceService.handleVapiWebhookEvent(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Voice Events Webhook Error]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Dedicated Vapi Webhook Endpoint
// @route   POST /api/webhooks/vapi
// @access  Public
exports.handleVapiWebhook = async (req, res, next) => {
  try {
    const eventType = req.body?.message?.type || req.body?.type || 'unknown';
    console.log(`[Webhook] Vapi Webhook received: ${eventType}`);
    const result = await voiceService.handleVapiWebhookEvent(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Vapi Webhook Error]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Handle Completed Call Webhook with OpenAI Extraction
// @route   POST /api/webhook/call-completed
// @access  Public
exports.handleCallCompletedWebhook = async (req, res, next) => {
  try {
    const {
      transcript,
      callerPhone,
      phone,
      caller_number,
      From,
      recordingUrl,
      recording_url,
      durationSeconds,
      duration,
      orgId,
      organizationId,
    } = req.body;

    // Resolve caller phone
    const resolvedPhone = callerPhone || phone || caller_number || From || '+1 (555) 349-8800';

    // Resolve transcript string
    let transcriptText = '';
    if (typeof transcript === 'string') {
      transcriptText = transcript;
    } else if (Array.isArray(transcript)) {
      transcriptText = transcript.map((t) => `${t.speaker || t.role || 'SPEAKER'}: ${t.text || t.message || ''}`).join('\n');
    } else if (req.body.message?.transcript) {
      transcriptText = req.body.message.transcript;
    } else {
      transcriptText = req.body.text || req.body.summary || 'Customer called regarding consultation booking and pricing.';
    }

    // Resolve target Organization
    let targetOrgId = orgId || organizationId;
    if (!targetOrgId) {
      const defaultOrg = (await Organization.findOne({ status: 'active' })) || (await Organization.findOne());
      targetOrgId = defaultOrg?._id;
    }

    if (!targetOrgId) {
      return res.status(400).json({
        success: false,
        message: 'No organization found to attach call and lead data.',
      });
    }

    // 1. Send transcript to OpenAI (gpt-4o-mini) for extraction
    const extracted = await extractLeadAndAppointmentFromTranscript(transcriptText, resolvedPhone);

    // 2. Save into CallLog collection
    const callLog = await CallLog.create({
      orgId: targetOrgId,
      organizationId: targetOrgId,
      callerPhone: extracted.phone || resolvedPhone,
      durationSeconds: parseInt(durationSeconds || duration || 120, 10),
      transcript: transcriptText,
      recordingUrl: recordingUrl || recording_url || '',
      sentiment: extracted.lead_score >= 80 ? 'Positive' : extracted.lead_score >= 60 ? 'Neutral' : 'Negative',
      intent: extracted.intent,
      status: 'completed',
    });

    // Mirror to legacy Call collection for dashboard sync
    await Call.create({
      organizationId: targetOrgId,
      callerNumber: extracted.phone || resolvedPhone,
      callerName: extracted.caller_name || 'Inbound Caller',
      durationSeconds: parseInt(durationSeconds || duration || 120, 10),
      intent: extracted.intent,
      status: 'completed',
      sentiment: extracted.lead_score >= 80 ? 'Positive' : 'Neutral',
    }).catch(() => null);

    // 3. Create or update record in Lead collection for that orgId
    let lead = await Lead.findOne({
      $or: [{ orgId: targetOrgId }, { organizationId: targetOrgId }],
      phone: extracted.phone || resolvedPhone,
    });

    if (lead) {
      lead.name = extracted.caller_name || lead.name;
      lead.company = extracted.company || lead.company;
      lead.intent = extracted.intent || lead.intent;
      lead.score = extracted.lead_score;
      lead.aiScore = extracted.lead_score;
      lead.stage = extracted.is_appointment_booked ? 'appointment' : extracted.stage;
      lead.pipelineStage = extracted.is_appointment_booked ? 'APPOINTMENT' : extracted.stage.toUpperCase();
      lead.budget = extracted.budget || lead.budget;
      lead.summary = `Call completed. AI analysis: ${extracted.intent}. Qualification Score: ${extracted.lead_score}/100`;
      lead.lastCallId = callLog._id;
      await lead.save();
    } else {
      lead = await Lead.create({
        orgId: targetOrgId,
        organizationId: targetOrgId,
        name: extracted.caller_name || 'Inbound Caller',
        company: extracted.company || 'Individual',
        phone: extracted.phone || resolvedPhone,
        intent: extracted.intent,
        score: extracted.lead_score,
        aiScore: extracted.lead_score,
        stage: extracted.is_appointment_booked ? 'appointment' : extracted.stage,
        pipelineStage: extracted.is_appointment_booked ? 'APPOINTMENT' : extracted.stage.toUpperCase(),
        budget: extracted.budget || '$5,000 - $10,000',
        source: 'Inbound AI Call',
        summary: `Call completed. AI analysis: ${extracted.intent}. Qualification Score: ${extracted.lead_score}/100`,
        lastCallId: callLog._id,
      });
    }

    // 4. If is_appointment_booked is true, automatically create Appointment document
    let appointment = null;
    if (extracted.is_appointment_booked) {
      const today = new Date();
      today.setDate(today.getDate() + 1);
      const scheduledDate = extracted.appointment_date || today.toISOString().split('T')[0];
      const scheduledTime = extracted.appointment_time || '11:00';

      appointment = await Appointment.create({
        orgId: targetOrgId,
        organizationId: targetOrgId,
        leadId: lead._id,
        callerName: extracted.caller_name || lead.name,
        customerName: extracted.caller_name || lead.name,
        callerPhone: extracted.phone || lead.phone,
        customerPhone: extracted.phone || lead.phone,
        scheduledDate,
        date: scheduledDate,
        scheduledTime,
        timeSlot: scheduledTime,
        status: 'scheduled',
        notes: `AI Scheduled Appointment: ${extracted.intent}. Booked for ${scheduledDate} at ${scheduledTime}.`,
      });

      lead.appointmentId = appointment._id;
      await lead.save();
    }

    // Increment minutes consumed in organization
    const minutesDelta = Math.ceil((parseInt(durationSeconds || duration || 120, 10)) / 60);
    const org = await Organization.findByIdAndUpdate(
      targetOrgId,
      { $inc: { minutesUsed: minutesDelta } },
      { new: true }
    );

    // 5. Emit Socket.io real-time event for Client and Admin rooms
    const io = req.app.get('io');
    if (io) {
      const payload = {
        callLog,
        lead,
        appointment,
        organization: org ? { id: org._id, name: org.name } : null,
        timestamp: new Date(),
      };

      // Client workspace room
      io.to(`org_${targetOrgId}`).emit('call_completed', payload);
      io.to(`org_${targetOrgId}`).emit('lead_updated', lead);
      if (appointment) {
        io.to(`org_${targetOrgId}`).emit('appointment_booked', payload);
      }

      // Super Admin global room
      io.to('admin_global').emit('admin_call_completed', payload);
      io.to('admin_global').emit('admin_lead_updated', lead);
      if (appointment) {
        io.to('admin_global').emit('admin_appointment_booked', payload);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Call completed processed successfully',
      extracted,
      callLogId: callLog._id,
      leadId: lead._id,
      appointmentId: appointment?._id || null,
      is_appointment_booked: extracted.is_appointment_booked,
    });
  } catch (error) {
    console.error('[Call Completed Webhook Error]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process completed call webhook',
      error: error.message,
    });
  }
};

