const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
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
      enum: ['Inbound AI Call', 'Website Form', 'Direct Call', 'Demo Request', 'Outbound', 'Manual'],
      default: 'Inbound AI Call',
    },
    pipelineStage: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'APPOINTMENT', 'PROPOSAL', 'WON', 'LOST'],
      default: 'NEW',
    },
    intent: {
      type: String,
      default: 'Service Inquiry',
    },
    budget: {
      type: String,
      default: '$5,000 - $10,000',
    },
    requirements: {
      type: String,
      default: '',
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

module.exports = mongoose.model('Lead', LeadSchema);
