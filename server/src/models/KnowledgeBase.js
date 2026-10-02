const mongoose = require('mongoose');

const KnowledgeBaseSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    name: {
      type: String,
      default: 'Default Knowledge Base',
    },
    description: String,
    totalDocuments: {
      type: Number,
      default: 0,
    },
    totalChunks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);
