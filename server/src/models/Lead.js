const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
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
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    company: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      default: 'Inbound AI Call',
    },
    stage: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'appointment', 'proposal', 'won', 'lost', 'NEW', 'CONTACTED', 'QUALIFIED', 'APPOINTMENT', 'PROPOSAL', 'WON', 'LOST'],
      default: 'new',
    },
    pipelineStage: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'APPOINTMENT', 'PROPOSAL', 'WON', 'LOST', 'new', 'contacted', 'qualified', 'appointment', 'proposal', 'won', 'lost'],
      default: 'NEW',
    },
    intent: {
      type: String,
      default: 'Service Inquiry',
    },
    budget: {
      type: String,
      default: '',
    },
    requirements: {
      type: String,
      default: '',
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 85,
    },
    aiScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 85,
    },
    summary: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    lastCallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Call',
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Pre-save hook to mirror orgId, score, and stage
LeadSchema.pre('save', function (next) {
  if (this.orgId && !this.organizationId) this.organizationId = this.orgId;
  if (this.organizationId && !this.orgId) this.orgId = this.organizationId;

  if (this.score !== undefined && this.aiScore === undefined) this.aiScore = this.score;
  if (this.aiScore !== undefined && this.score === undefined) this.score = this.aiScore;

  if (this.stage && !this.pipelineStage) this.pipelineStage = this.stage.toUpperCase();
  if (this.pipelineStage && !this.stage) this.stage = this.pipelineStage.toLowerCase();

  next();
});

module.exports = mongoose.model('Lead', LeadSchema);
