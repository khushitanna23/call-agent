const mongoose = require('mongoose');

const KnowledgeChunkSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeDocument',
      required: true,
      index: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    chunkIndex: {
      type: Number,
      default: 0,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    embedding: {
      type: [Number], // Ready for vector embeddings (e.g., text-embedding-3-small)
      select: false,
    },
  },
  { timestamps: true }
);

KnowledgeChunkSchema.index({ organizationId: 1, content: 'text' });

module.exports = mongoose.model('KnowledgeChunk', KnowledgeChunkSchema);
