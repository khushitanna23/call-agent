const mongoose = require('mongoose');

const CampaignContactSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    name: String,
    phone: { type: String, required: true },
    email: String,
    status: {
      type: String,
      enum: ['pending', 'called', 'connected', 'failed', 'dnc'],
      default: 'pending',
    },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('CampaignContact', CampaignContactSchema);
