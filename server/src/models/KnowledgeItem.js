const mongoose = require('mongoose');

const KnowledgeItemSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    type: {
      type: String,
      enum: ['faq', 'service', 'pricing', 'custom_text'],
      default: 'faq',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a knowledge title'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide knowledge content'],
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

KnowledgeItemSchema.pre('save', function (next) {
  if (this.orgId && !this.organizationId) {
    this.organizationId = this.orgId;
  } else if (this.organizationId && !this.orgId) {
    this.orgId = this.organizationId;
  }
  next();
});

module.exports = mongoose.model('KnowledgeItem', KnowledgeItemSchema);
