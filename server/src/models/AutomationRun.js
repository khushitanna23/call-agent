const mongoose = require('mongoose');

const AutomationRunSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    automationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Automation',
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'running'],
      default: 'success',
    },
    triggerEvent: String,
    payload: Object,
    resultMessage: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('AutomationRun', AutomationRunSchema);
