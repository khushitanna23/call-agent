const mongoose = require('mongoose');

const CallSummarySchema = new mongoose.Schema(
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
      required: true,
      unique: true,
    },
    summary: {
      type: String,
      required: true,
    },
    keyTakeaways: [String],
    actionItems: [String],
    customerIntent: String,
    customerBudget: String,
    leadQualificationResult: {
      isQualified: Boolean,
      reason: String,
      score: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CallSummary', CallSummarySchema);
