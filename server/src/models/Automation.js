const mongoose = require('mongoose');

const AutomationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    trigger: {
      type: String,
      enum: ['call_completed', 'lead_qualified', 'appointment_booked', 'call_missed', 'call_transferred'],
      required: true,
    },
    action: {
      type: String,
      enum: ['send_sms_confirmation', 'send_email_summary', 'sync_to_crm', 'notify_slack', 'webhook'],
      required: true,
    },
    config: {
      template: String,
      recipientType: { type: String, default: 'caller' }, // 'caller', 'team', 'webhook'
      webhookUrl: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    executionCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Automation', AutomationSchema);
