const mongoose = require('mongoose');

const AgentVersionSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    snapshot: {
      type: Object,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    changeNotes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('AgentVersion', AgentVersionSchema);
