const Integration = require('../models/Integration');

const DEFAULT_INTEGRATIONS = [
  { serviceKey: 'vapi', name: 'Vapi Voice AI', category: 'voice', description: 'Ultra-low latency conversational voice agent runtime.' },
  { serviceKey: 'twilio', name: 'Twilio Telephony', category: 'voice', description: 'Carrier phone numbers, SIP trunking, and call forwarding.' },
  { serviceKey: 'openai', name: 'OpenAI GPT-4o', category: 'ai', description: 'Advanced reasoning, function calling, and conversation synthesis.' },
  { serviceKey: 'google_calendar', name: 'Google Calendar', category: 'calendar', description: 'Real-time two-way calendar sync for appointments.' },
  { serviceKey: 'microsoft_calendar', name: 'Microsoft 365 / Outlook', category: 'calendar', description: 'Sync meetings directly into Outlook calendar.' },
  { serviceKey: 'calendly', name: 'Calendly', category: 'calendar', description: 'Automate scheduling through Calendly meeting links.' },
  { serviceKey: 'calcom', name: 'Cal.com', category: 'calendar', description: 'Open source scheduling infrastructure.' },
  { serviceKey: 'sms', name: 'SMS Notifications', category: 'communication', description: 'Instant text alerts and booking confirmations.' },
  { serviceKey: 'whatsapp', name: 'WhatsApp Business', category: 'communication', description: 'Send automated summaries via WhatsApp.' },
  { serviceKey: 'email', name: 'Email Gateway (SMTP/SES)', category: 'communication', description: 'Instant post-call lead transcripts & alerts.' },
];

// @desc    Get all integrations and their connection status
// @route   GET /api/integrations
// @access  Private
exports.getIntegrations = async (req, res, next) => {
  try {
    const existing = await Integration.find({ organizationId: req.organizationId });
    const existingMap = {};
    existing.forEach((i) => {
      existingMap[i.serviceKey] = i;
    });

    const result = DEFAULT_INTEGRATIONS.map((def) => {
      const match = existingMap[def.serviceKey];
      return {
        serviceKey: def.serviceKey,
        name: def.name,
        category: def.category,
        description: def.description,
        isConnected: match ? match.isConnected : false,
        lastSyncedAt: match?.lastSyncedAt || null,
        maskedCredentials: match?.maskedCredentials ? Object.fromEntries(match.maskedCredentials) : {},
      };
    });

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Connect or update an integration credentials
// @route   POST /api/integrations/:serviceKey
// @access  Private
exports.saveIntegration = async (req, res, next) => {
  try {
    const { serviceKey } = req.params;
    const { credentials = {}, isConnected = true } = req.body;

    const def = DEFAULT_INTEGRATIONS.find((d) => d.serviceKey === serviceKey);
    if (!def) {
      return res.status(404).json({ success: false, message: 'Integration not supported' });
    }

    // Mask secrets for safe storage and return
    const masked = {};
    Object.keys(credentials).forEach((key) => {
      const val = String(credentials[key] || '');
      masked[key] = val.length > 6 ? val.substring(0, 3) + '••••••••' + val.slice(-3) : '••••••';
    });

    const integration = await Integration.findOneAndUpdate(
      { organizationId: req.organizationId, serviceKey },
      {
        name: def.name,
        category: def.category,
        isConnected: isConnected,
        maskedCredentials: masked,
        lastSyncedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: `${def.name} ${isConnected ? 'connected' : 'updated'} successfully`,
      data: integration,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Disconnect an integration
// @route   DELETE /api/integrations/:serviceKey
// @access  Private
exports.disconnectIntegration = async (req, res, next) => {
  try {
    const { serviceKey } = req.params;
    await Integration.findOneAndUpdate(
      { organizationId: req.organizationId, serviceKey },
      { isConnected: false, maskedCredentials: {} }
    );

    res.json({ success: true, message: 'Integration disconnected' });
  } catch (error) {
    next(error);
  }
};
