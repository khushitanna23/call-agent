const mongoose = require('mongoose');

const KnowledgeDocumentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    knowledgeBaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeBase',
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    type: {
      type: String,
      enum: ['website', 'faq', 'service', 'pricing', 'policy', 'document'],
      default: 'document',
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      default: 'manual', // or URL, or uploaded filename
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'txt', 'html', 'text'],
      default: 'text',
    },
    fileUrl: String,
    fileSize: Number,
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'ready',
    },
    chunksCount: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('KnowledgeDocument', KnowledgeDocumentSchema);
