const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: 'inbound_reception',
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    status: {
      type: String,
      default: 'active',
    },
    targetAudience: String,
    totalContacts: {
      type: Number,
      default: 0,
    },
    callsHandled: {
      type: Number,
      default: 0,
    },
    completed: {
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

CampaignSchema.pre('save', function (next) {
  if (this.orgId && !this.organizationId) this.organizationId = this.orgId;
  if (this.organizationId && !this.orgId) this.orgId = this.organizationId;
  if (this.callsHandled && !this.successfulCalls) this.successfulCalls = this.callsHandled;
  if (this.successfulCalls && !this.callsHandled) this.callsHandled = this.successfulCalls;
  next();
});

module.exports = mongoose.model('Campaign', CampaignSchema);
