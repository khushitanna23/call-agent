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
