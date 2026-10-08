const mongoose = require('mongoose');

const CallLogSchema = new mongoose.Schema(
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
    callerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    transcript: {
      type: String,
      default: '',
    },
    recordingUrl: {
      type: String,
      default: '',
    },
    sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative'],
      default: 'Positive',
    },
    intent: {
      type: String,
      default: 'General Inquiry',
    },
    status: {
      type: String,
      enum: ['completed', 'failed', 'no_answer', 'missed', 'transferred', 'in-progress'],
      default: 'completed',
    },
    cost: {
      type: Number,
      default: 0.15,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook to mirror orgId and organizationId
CallLogSchema.pre('save', function (next) {
  if (this.orgId && !this.organizationId) {
    this.organizationId = this.orgId;
  } else if (this.organizationId && !this.orgId) {
    this.orgId = this.organizationId;
  }
  next();
});

module.exports = mongoose.model('CallLog', CallLogSchema);
