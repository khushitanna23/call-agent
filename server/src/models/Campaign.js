const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['inbound_reception', 'outbound_qualification', 'appointment_reminder', 'reactivation'],
      default: 'inbound_reception',
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed'],
      default: 'active',
    },
    targetAudience: String,
    totalContacts: {
      type: Number,
      default: 0,
    },
    successfulCalls: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campaign', CampaignSchema);
