const mongoose = require('mongoose');

const IntegrationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    serviceKey: {
      type: String,
      required: true, // 'vapi', 'twilio', 'openai', 'google_calendar', 'calendly', 'calcom', 'sms', 'whatsapp', 'email'
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['voice', 'ai', 'calendar', 'communication'],
      required: true,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    config: {
      type: Map,
      of: String,
      default: {},
    },
    maskedCredentials: {
      type: Map,
      of: String,
      default: {},
    },
    lastSyncedAt: Date,
  },
  { timestamps: true }
);

IntegrationSchema.index({ organizationId: 1, serviceKey: 1 }, { unique: true });

module.exports = mongoose.model('Integration', IntegrationSchema);
