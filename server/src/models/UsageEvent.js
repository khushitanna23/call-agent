const mongoose = require('mongoose');

const UsageEventSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    callId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Call',
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    eventType: {
      type: String,
      enum: ['voice_minute', 'ai_token', 'call_inbound', 'call_outbound', 'sms', 'whatsapp', 'storage'],
      required: true,
    },
    units: {
      type: Number,
      required: true,
      default: 1,
    },
    providerCost: {
      type: Number,
      default: 0.05,
    },
    customerCost: {
      type: Number,
      default: 0.15,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UsageEvent', UsageEventSchema);
