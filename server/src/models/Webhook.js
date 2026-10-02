const mongoose = require('mongoose');

const WebhookSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    secret: {
      type: String,
      default: () => 'whsec_' + Math.random().toString(36).substring(2, 15),
    },
    events: [
      {
        type: String,
        enum: [
          'call.started',
          'call.completed',
          'call.transferred',
          'lead.captured',
          'lead.qualified',
          'appointment.booked',
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    lastTriggeredAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Webhook', WebhookSchema);
