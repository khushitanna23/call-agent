const voiceService = require('../services/voiceService');

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
    const { callId, status, durationSeconds } = req.body;
    if (callId && (status === 'completed' || status === 'ended')) {
      await voiceService.completeCall(callId, durationSeconds || 90);
    }
    res.json({ success: true, received: true });
  } catch (error) {
    next(error);
  }
};
