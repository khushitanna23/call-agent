const mongoose = require('mongoose');

const LeadActivitySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['call', 'note', 'stage_change', 'appointment', 'status_update', 'email', 'sms'],
      default: 'note',
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    metadata: Object,
    performedBy: {
      type: String,
      default: 'AI Receptionist',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeadActivity', LeadActivitySchema);
