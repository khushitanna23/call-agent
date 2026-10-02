/**
 * Voice Provider Interface and concrete adapters for Vapi, Twilio, and Demo mode.
 */

class VoiceProvider {
  async createAssistant(agentConfig) {
    throw new Error('createAssistant must be implemented');
  }
  async updateAssistant(assistantId, agentConfig) {
    throw new Error('updateAssistant must be implemented');
  }
  async createPhoneNumber(config) {
    throw new Error('createPhoneNumber must be implemented');
  }
  async handleIncomingCall(payload) {
    throw new Error('handleIncomingCall must be implemented');
  }
  async startCall(config) {
    throw new Error('startCall must be implemented');
  }
  async endCall(callId) {
    throw new Error('endCall must be implemented');
  }
  async transferCall(callId, targetNumber) {
    throw new Error('transferCall must be implemented');
  }
}

class VapiVoiceProvider extends VoiceProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.vapi.ai';
  }

  async createAssistant(agentConfig) {
    if (!this.apiKey) return { isConfigured: false, mode: 'demo' };
    const response = await fetch(`${this.baseUrl}/assistant`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: agentConfig.name,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: agentConfig.systemInstructions }],
        },
        voice: {
          provider: '11labs',
          voiceId: agentConfig.voice?.voiceId || '21m00Tcm4TlvDq8ikWAM',
        },
        firstMessage: agentConfig.greetingMessage,
      }),
    });
    return await response.json();
  }

  async updateAssistant(assistantId, agentConfig) {
    if (!this.apiKey) return { isConfigured: false, mode: 'demo' };
    const response = await fetch(`${this.baseUrl}/assistant/${assistantId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: agentConfig.name,
        firstMessage: agentConfig.greetingMessage,
      }),
    });
    return await response.json();
  }

  async createPhoneNumber(config) {
    return {
      provider: 'vapi',
      phoneNumber: config.phoneNumber || '+1 (800) 555-VAPI',
      status: 'active',
      isDemo: !this.apiKey,
    };
  }

  async handleIncomingCall(payload) {
    // Vapi webhook event parser
    const { message } = payload;
    return {
      type: message?.type || 'assistant-request',
      callId: message?.call?.id,
      customerPhone: message?.call?.customer?.number,
      transcript: message?.transcript,
    };
  }

  async startCall(config) {
    return {
      provider: 'vapi',
      callId: 'vapi_' + Date.now(),
      status: 'initiated',
    };
  }

  async endCall(callId) {
    return { status: 'ended', callId };
  }

  async transferCall(callId, targetNumber) {
    return { status: 'transferred', callId, targetNumber };
  }
}

class TwilioVoiceProvider extends VoiceProvider {
  constructor(accountSid, authToken, phoneNumber) {
    super();
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.phoneNumber = phoneNumber;
  }

  async createPhoneNumber(config) {
    return {
      provider: 'twilio',
      phoneNumber: this.phoneNumber || '+1 (800) 555-TWLO',
      status: 'active',
      isDemo: !this.accountSid,
    };
  }

  async handleIncomingCall(payload) {
    // Generates TwiML for incoming voice call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thank you for calling. Connecting you with your AI Receptionist.</Say>
  <Connect>
    <Stream url="wss://${payload.host || 'api.vedanco.ai'}/media-stream" />
  </Connect>
</Response>`;
    return { twiml, callSid: payload.CallSid };
  }

  async transferCall(callId, targetNumber) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting your call now. Please hold.</Say>
  <Dial>${targetNumber}</Dial>
</Response>`;
    return { twiml, transferred: true };
  }
}

class DemoVoiceProvider extends VoiceProvider {
  constructor() {
    super();
    this.isDemo = true;
  }

  async createAssistant(agentConfig) {
    return {
      assistantId: 'demo_asst_' + Math.random().toString(36).substring(2, 8),
      name: agentConfig.name,
      status: 'active_in_demo_mode',
    };
  }

  async updateAssistant(assistantId, agentConfig) {
    return {
      assistantId,
      name: agentConfig.name,
      status: 'updated_in_demo_mode',
    };
  }

  async createPhoneNumber(config) {
    return {
      provider: 'demo',
      phoneNumber: '+1 (800) 555-0199',
      status: 'active',
      isDemo: true,
    };
  }

  async handleIncomingCall(payload) {
    return {
      status: 'connected',
      mode: 'demo_simulation',
      caller: payload.caller || '+1 (555) 019-8234',
    };
  }

  async startCall(config) {
    return {
      callId: 'DEMO-CALL-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      status: 'in_progress',
      isDemo: true,
    };
  }

  async endCall(callId) {
    return { callId, status: 'completed' };
  }

  async transferCall(callId, targetNumber) {
    return {
      callId,
      status: 'transferred',
      targetNumber: targetNumber || '+1 (555) 789-0123',
    };
  }
}

module.exports = {
  VoiceProvider,
  VapiVoiceProvider,
  TwilioVoiceProvider,
  DemoVoiceProvider,
};
