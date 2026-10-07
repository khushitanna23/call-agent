const {
  VapiVoiceProvider,
  TwilioVoiceProvider,
  DemoVoiceProvider,
} = require('../providers/VoiceProvider');
const Agent = require('../models/Agent');
const Call = require('../models/Call');
const CallTranscript = require('../models/CallTranscript');
const CallSummary = require('../models/CallSummary');
const UsageEvent = require('../models/UsageEvent');
const Organization = require('../models/Organization');
const Appointment = require('../models/Appointment');

class VoiceService {
  constructor() {
    this.vapiProvider = process.env.VAPI_API_KEY
      ? new VapiVoiceProvider(process.env.VAPI_API_KEY)
      : null;
    this.twilioProvider =
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
        ? new TwilioVoiceProvider(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN,
            process.env.TWILIO_PHONE_NUMBER
          )
        : null;
    this.demoProvider = new DemoVoiceProvider();
  }

  getProvider(providerName) {
    if (providerName === 'vapi' && this.vapiProvider) return this.vapiProvider;
    if (providerName === 'twilio' && this.twilioProvider) return this.twilioProvider;
    return this.demoProvider;
  }

  /**
   * Handle incoming call webhook from telephony provider
   */
  async handleIncomingCallWebhook(payload, providerName = 'demo') {
    const provider = this.getProvider(providerName);
    console.log(`[VoiceService] Incoming call event via ${providerName}:`, payload);

    // Look up agent by phone number or fallback to first online agent
    const incomingTo = payload.To || payload.to || payload.phone;
    let agent = await Agent.findOne({ phoneNumber: incomingTo, status: 'ONLINE' });
    if (!agent) {
      agent = await Agent.findOne({ status: 'ONLINE' });
    }

    if (!agent) {
      return {
        success: false,
        message: 'No active AI Receptionist found to answer this call.',
      };
    }

    // Create call record
    const call = await Call.create({
      organizationId: agent.organizationId,
      agentId: agent._id,
      callerNumber: payload.From || payload.from || '+1 (555) 019-4411',
      callerName: payload.callerName || 'Prospective Client',
      agentPhoneNumber: agent.phoneNumber,
      direction: 'inbound',
      status: 'answered',
      startTime: new Date(),
      provider: providerName,
      providerCallId: payload.CallSid || payload.callId || 'DEMO-' + Date.now(),
    });

    // Initialize transcript record
    await CallTranscript.create({
      organizationId: agent.organizationId,
      callId: call._id,
      turns: [
        {
          speaker: 'ai',
          text: agent.greetingMessage,
          timestamp: '00:01',
          timeOffsetSeconds: 1,
        },
      ],
      rawTranscript: `AI: ${agent.greetingMessage}`,
    });

    // Increment agent call counts
    await Agent.findByIdAndUpdate(agent._id, { $inc: { totalCallsCount: 1 } });

    // Track usage
    await UsageEvent.create({
      organizationId: agent.organizationId,
      agentId: agent._id,
      callId: call._id,
      eventType: 'call_inbound',
      units: 1,
    });

    return {
      success: true,
      callId: call._id,
      agentName: agent.name,
      greetingMessage: agent.greetingMessage,
      providerResponse: await provider.handleIncomingCall(payload),
    };
  }

  /**
   * Human handoff transfer execution
   */
  async transferCall(callId, targetPhoneNumber, reason = 'Customer requested human') {
    const call = await Call.findById(callId).populate('agentId');
    if (!call) throw new Error('Call not found');

    const agent = call.agentId;
    const targetNumber = targetPhoneNumber || agent?.transferSettings?.targetPhoneNumber || '+1 (555) 789-0123';

    call.status = 'transferred';
    call.wasTransferred = true;
    call.transferReason = reason;
    call.transferredTo = targetNumber;
    await call.save();

    // Append handoff turn to transcript
    await CallTranscript.findOneAndUpdate(
      { callId: call._id },
      {
        $push: {
          turns: {
            speaker: 'system',
            text: `[Call Transferred to Human Agent at ${targetNumber}. Reason: ${reason}]`,
            timestamp: '02:15',
          },
        },
      }
    );

    return {
      success: true,
      message: 'Call transferred to human agent',
      transferredTo: targetNumber,
      call,
    };
  }

  /**
   * Complete call and generate summaries
   */
  async completeCall(callId, durationSeconds = 120) {
    const call = await Call.findById(callId);
    if (!call) return;

    call.status = call.wasTransferred ? 'transferred' : 'completed';
    call.endTime = new Date();
    call.durationSeconds = durationSeconds;
    call.cost = Number(((durationSeconds / 60) * 0.15).toFixed(2));
    await call.save();

    // Deduct minutes from organization
    const minutes = Math.ceil(durationSeconds / 60);
    await Organization.findByIdAndUpdate(call.organizationId, {
      $inc: { minutesUsed: minutes },
    });

    // Create summary if not exists
    await CallSummary.findOneAndUpdate(
      { callId: call._id },
      {
        $setOnInsert: {
          organizationId: call.organizationId,
          callId: call._id,
          summary:
            'Customer called to inquire about service offerings, discussed scope and pricing options, and scheduled a follow-up appointment.',
          keyTakeaways: [
            'Customer interested in AI automation services',
            'Budget indicated in the $5,000-$10,000 range',
            'Scheduled consultation slot',
          ],
          actionItems: ['Prepare presentation deck', 'Send calendar reminder link'],
          customerIntent: call.intent || 'Service Inquiry',
        },
      },
    );
  }

  /**
   * Normalize customer phone number to strict E.164 format (e.g. +919876543210 or +15551234567)
   */
  normalizePhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = String(phone).replace(/[\s\-\(\)\.]/g, '').trim();
    if (cleaned.startsWith('+')) {
      return '+' + cleaned.replace(/[^\d]/g, '');
    }
    cleaned = cleaned.replace(/[^\d]/g, '');
    if (cleaned.length === 10) {
      // 10 digits starting with 6,7,8,9 is Indian mobile number
      if (/^[6-9]/.test(cleaned)) {
        return '+91' + cleaned;
      }
      return '+1' + cleaned;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return '+' + cleaned;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return '+' + cleaned;
    }
    return '+' + cleaned;
  }

  /**
   * Initiate real Vapi outbound call for scheduled appointment
   */
  async startOutboundCall({ appointment, agent }) {
    const vapiApiKey = process.env.VAPI_API_KEY;
    if (!vapiApiKey) {
      throw new Error('VAPI_API_KEY is not configured in server/.env');
    }

    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    const assistantId = process.env.VAPI_ASSISTANT_ID;

    if (!phoneNumberId) {
      throw new Error('VAPI_PHONE_NUMBER_ID is not configured in server/.env');
    }

    const customerNumber = this.normalizePhoneNumber(appointment.customerPhone);
    console.log(`[Vapi] Normalizing customer phone ${appointment.customerPhone} -> ${customerNumber}`);

    const provider = this.vapiProvider || new VapiVoiceProvider(vapiApiKey);

    const callResult = await provider.startOutboundCall({
      phoneNumberId,
      assistantId,
      customerNumber,
      customerName: appointment.customerName,
      agentConfig: agent,
      appointment,
    });

    return callResult;
  }

  /**
   * Process webhook status and end-of-call events from Vapi
   */
  async handleVapiWebhookEvent(payload) {
    const message = payload?.message || payload;
    const type = message?.type || payload?.type;
    const callId = message?.call?.id || message?.callId || payload?.callId || payload?.id;

    console.log(`[Webhook] Processing Vapi event: type=${type}, callId=${callId}`);

    if (!callId) {
      return { success: true, message: 'No callId in webhook event, skipped' };
    }

    // 1. Locate appointment by vapiCallId
    let appointment = await Appointment.findOne({ vapiCallId: callId });
    if (!appointment && message?.call?.customer?.number) {
      const normalizedNum = this.normalizePhoneNumber(message.call.customer.number);
      appointment = await Appointment.findOne({
        status: { $in: ['calling', 'in_progress'] },
        $or: [
          { customerPhone: message.call.customer.number },
          { customerPhone: normalizedNum },
        ],
      }).sort({ createdAt: -1 });
    }

    const callStatus = message?.status || message?.call?.status;
    const endedReason = message?.endedReason || message?.call?.endedReason || '';

    // Handle in-flight status updates
    if (type === 'status-update') {
      console.log(`[Webhook] Vapi call ${callId} status: ${callStatus}`);
      if (appointment) {
        if (callStatus === 'ringing' || callStatus === 'in-progress') {
          appointment.status = 'calling';
          appointment.autoCallStatus = 'in_progress';
          appointment.callStatus = callStatus;
          await appointment.save();
        }
      }
    }

    // Handle end-of-call-report or ended status
    if (type === 'end-of-call-report' || callStatus === 'ended') {
      const transcript = message?.transcript || message?.call?.transcript || '';
      const summary = message?.summary || message?.analysis?.summary || message?.call?.summary || '';
      const recordingUrl = message?.recordingUrl || message?.call?.recordingUrl || '';
      const durationSeconds = message?.durationSeconds || message?.call?.duration || 0;

      let finalApptStatus = 'completed';
      let finalAutoCallStatus = 'completed';

      if (
        endedReason.includes('did-not-answer') ||
        endedReason.includes('busy') ||
        endedReason.includes('no-answer')
      ) {
        finalApptStatus = 'no_answer';
        finalAutoCallStatus = 'no_answer';
      } else if (
        endedReason.includes('failed') ||
        endedReason.includes('error') ||
        endedReason.includes('rejected')
      ) {
        finalApptStatus = 'failed';
        finalAutoCallStatus = 'failed';
      }

      console.log(`[Webhook] Call completed: callId=${callId}, endedReason=${endedReason}, appointmentStatus=${finalApptStatus}`);

      if (appointment) {
        appointment.status = finalApptStatus;
        appointment.autoCallStatus = finalAutoCallStatus;
        appointment.callStatus = 'ended';
        appointment.callEndedAt = new Date();
        appointment.callEndedReason = endedReason;
        if (transcript) appointment.callTranscript = transcript;
        if (summary) appointment.callSummary = summary;
        if (recordingUrl) appointment.callRecordingUrl = recordingUrl;
        if (durationSeconds) appointment.callDurationSeconds = durationSeconds;
        await appointment.save();
        console.log(`[Webhook] Updated Appointment ${appointment.bookingReference} status to ${finalApptStatus}`);
      }

      // Upsert Call in DB
      let callDoc = await Call.findOne({ providerCallId: callId });
      if (!callDoc && appointment) {
        callDoc = await Call.create({
          organizationId: appointment.organizationId,
          agentId: appointment.agentId,
          callId: 'CALL-VAPI-' + String(callId).slice(-6).toUpperCase(),
          providerCallId: callId,
          callerNumber: appointment.customerPhone,
          callerName: appointment.customerName,
          agentPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '+1 (800) 555-0199',
          direction: 'outbound',
          status: finalApptStatus === 'completed' ? 'completed' : 'failed',
          startTime: appointment.callStartedAt || new Date(),
          endTime: new Date(),
          durationSeconds: durationSeconds,
          provider: 'vapi',
          appointmentId: appointment._id,
        });
      } else if (callDoc) {
        callDoc.status = finalApptStatus === 'completed' ? 'completed' : 'failed';
        callDoc.endTime = new Date();
        callDoc.durationSeconds = durationSeconds;
        await callDoc.save();
      }

      // Save transcript turns if available
      if (callDoc && transcript) {
        await CallTranscript.findOneAndUpdate(
          { callId: callDoc._id },
          {
            $set: {
              organizationId: callDoc.organizationId,
              callId: callDoc._id,
              rawTranscript: transcript,
              turns: [
                {
                  speaker: 'ai',
                  text: transcript.slice(0, 500),
                  timestamp: '00:01',
                },
              ],
            },
          },
          { upsert: true }
        );
      }

      // Save summary if available
      if (callDoc && summary) {
        await CallSummary.findOneAndUpdate(
          { callId: callDoc._id },
          {
            $set: {
              organizationId: callDoc.organizationId,
              callId: callDoc._id,
              summary: summary,
              customerIntent: appointment?.serviceType || 'Scheduled Consultation',
            },
          },
          { upsert: true }
        );
      }
    }

    return { success: true, processed: true, callId };
  }
}

module.exports = new VoiceService();
