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
      { upsert: true }
    );
  }
}

module.exports = new VoiceService();
