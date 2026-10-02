const Call = require('../models/Call');
const CallTranscript = require('../models/CallTranscript');
const CallRecording = require('../models/CallRecording');
const CallSummary = require('../models/CallSummary');
const Agent = require('../models/Agent');
const Lead = require('../models/Lead');
const Appointment = require('../models/Appointment');
const voiceService = require('../services/voiceService');

// @desc    Get all calls with filtering & pagination
// @route   GET /api/calls
// @access  Private
exports.getCalls = async (req, res, next) => {
  try {
    const { status, agentId, search, dateRange, limit = 50, page = 1 } = req.query;

    const query = { organizationId: req.organizationId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (agentId) {
      query.agentId = agentId;
    }

    if (search) {
      query.$or = [
        { callerNumber: { $regex: search, $options: 'i' } },
        { callerName: { $regex: search, $options: 'i' } },
        { intent: { $regex: search, $options: 'i' } },
        { callId: { $regex: search, $options: 'i' } },
      ];
    }

    const calls = await Call.find(query)
      .populate('agentId', 'name type voice')
      .populate('leadId', 'name email company aiScore pipelineStage')
      .populate('appointmentId', 'date timeSlot status type')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Call.countDocuments(query);

    res.json({
      success: true,
      count: calls.length,
      total,
      data: calls,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single call details (recording, transcript, summary)
// @route   GET /api/calls/:id
// @access  Private
exports.getCallById = async (req, res, next) => {
  try {
    const call = await Call.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    })
      .populate('agentId')
      .populate('leadId')
      .populate('appointmentId');

    if (!call) {
      return res.status(404).json({ success: false, message: 'Call record not found' });
    }

    const transcript = await CallTranscript.findOne({ callId: call._id });
    const recording = await CallRecording.findOne({ callId: call._id });
    const summary = await CallSummary.findOne({ callId: call._id });

    res.json({
      success: true,
      data: {
        call,
        transcript: transcript || {
          turns: [
            { speaker: 'ai', text: 'Hello, thank you for calling. How can I assist you?', timestamp: '00:00' },
            { speaker: 'caller', text: 'Hi, I would like to schedule a discovery call.', timestamp: '00:04' },
          ],
        },
        recording: recording || {
          recordingUrl: 'https://actions.google.com/sounds/v1/telephones/phone_ring.ogg',
          durationSeconds: call.durationSeconds,
          isDemoRecording: true,
        },
        summary: summary || {
          summary: call.intent ? `Customer called regarding ${call.intent}.` : 'General caller inquiry.',
          keyTakeaways: ['Customer contacted business line', 'AI assisted with information'],
          actionItems: ['Review call transcript'],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Transfer call to human operator
// @route   POST /api/calls/:id/transfer
// @access  Private
exports.transferCall = async (req, res, next) => {
  try {
    const { targetPhoneNumber, reason } = req.body;
    const result = await voiceService.transferCall(req.params.id, targetPhoneNumber, reason);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Simulate an inbound or test call with AI Receptionist
// @route   POST /api/calls/simulate
// @access  Private
exports.simulateCall = async (req, res, next) => {
  try {
    const { callerName, callerNumber, intent, messages } = req.body;

    let agent = await Agent.findOne({ organizationId: req.organizationId, status: 'ONLINE' });
    if (!agent) {
      agent = await Agent.findOne({ organizationId: req.organizationId });
    }

    if (!agent) {
      return res.status(400).json({ success: false, message: 'Please create an AI Agent first' });
    }

    const call = await Call.create({
      organizationId: req.organizationId,
      agentId: agent._id,
      callerName: callerName || 'Alex Mercer',
      callerNumber: callerNumber || '+1 (555) 749-3921',
      agentPhoneNumber: agent.phoneNumber,
      direction: 'inbound',
      status: 'completed',
      durationSeconds: 145,
      intent: intent || 'Consultation & Pricing Inquiry',
      outcome: 'Lead Captured & Appointment Scheduled',
      sentiment: 'Positive',
      cost: 0.36,
      provider: 'demo',
    });

    const turns = messages || [
      { speaker: 'ai', text: agent.greetingMessage, timestamp: '00:01' },
      { speaker: 'caller', text: 'Hi! I want to know about your automation services.', timestamp: '00:06' },
      { speaker: 'ai', text: 'Sure! I would be delighted to help. What specific tasks would you like to automate?', timestamp: '00:11' },
      { speaker: 'caller', text: 'We receive over 40 calls a day and want an AI receptionist to book appointments.', timestamp: '00:19' },
      { speaker: 'ai', text: 'That is exactly our specialty! Our AI receptionist handles 24/7 call answering and calendar bookings. Can I schedule a 15-minute demo with our team?', timestamp: '00:28' },
      { speaker: 'caller', text: 'Yes, that sounds great. Tomorrow afternoon works.', timestamp: '00:35' },
      { speaker: 'ai', text: 'Perfect! I have booked you for tomorrow at 2:00 PM. I look forward to speaking soon!', timestamp: '00:42' },
    ];

    await CallTranscript.create({
      organizationId: req.organizationId,
      callId: call._id,
      turns,
      rawTranscript: turns.map((t) => `${t.speaker.toUpperCase()}: ${t.text}`).join('\n'),
    });

    await CallRecording.create({
      organizationId: req.organizationId,
      callId: call._id,
      recordingUrl: 'https://actions.google.com/sounds/v1/telephones/phone_ring.ogg',
      durationSeconds: 145,
      isDemoRecording: true,
    });

    await CallSummary.create({
      organizationId: req.organizationId,
      callId: call._id,
      summary: 'Prospective client called with interest in deploying an AI receptionist for ~40 daily inbound calls.',
      keyTakeaways: [
        'Caller receives 40 calls/day',
        'Interested in appointment booking and 24/7 receptionist',
        'High purchase intent',
      ],
      actionItems: ['Follow up with calendar invitation', 'Prepare customized plan deck'],
      customerIntent: 'Consultation & Pricing Inquiry',
    });

    // Auto-create lead
    const lead = await Lead.create({
      organizationId: req.organizationId,
      name: callerName || 'Alex Mercer',
      phone: callerNumber || '+1 (555) 749-3921',
      email: 'alex.mercer@example.com',
      company: 'Mercer Real Estate Holdings',
      source: 'Inbound AI Call',
      pipelineStage: 'QUALIFIED',
      intent: 'Consultation & Pricing Inquiry',
      budget: '$5,000 - $10,000',
      aiScore: 92,
      summary: 'High-volume business seeking 24/7 receptionist. 40 calls/day.',
      lastCallId: call._id,
    });

    // Auto-create appointment
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const appointment = await Appointment.create({
      organizationId: req.organizationId,
      agentId: agent._id,
      leadId: lead._id,
      callId: call._id,
      customerName: callerName || 'Alex Mercer',
      customerPhone: callerNumber || '+1 (555) 749-3921',
      customerEmail: 'alex.mercer@example.com',
      date: tomorrow,
      timeSlot: '02:00 PM',
      durationMinutes: 30,
      type: 'Product Demo',
      status: 'scheduled',
      notes: 'Demo scheduled by Sarah (AI Receptionist) during inbound call simulation.',
    });

    call.leadId = lead._id;
    call.appointmentId = appointment._id;
    await call.save();

    res.status(201).json({
      success: true,
      message: 'Demo call simulated and synchronized with CRM',
      data: { call, lead, appointment },
    });
  } catch (error) {
    next(error);
  }
};
