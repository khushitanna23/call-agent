const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema(
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
      required: true,
    },
    callId: {
      type: String,
      unique: true,
      default: () => 'CALL-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    },
    callerNumber: {
      type: String,
      required: true,
      default: '+1 (555) 012-3456',
    },
    callerName: {
      type: String,
      default: 'Unknown Caller',
    },
    agentPhoneNumber: {
      type: String,
      default: '+1 (800) 555-0199',
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      default: 'inbound',
    },
    status: {
      type: String,
      enum: ['answered', 'missed', 'completed', 'transferred', 'failed'],
      default: 'completed',
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    intent: {
      type: String,
      default: 'General Inquiry',
    },
    outcome: {
      type: String,
      default: 'Resolved by AI',
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    cost: {
      type: Number,
      default: 0.15, // estimated cost in USD
    },
    sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative'],
      default: 'Positive',
    },
    provider: {
      type: String,
      enum: ['vapi', 'twilio', 'demo', 'browser'],
      default: 'demo',
    },
    providerCallId: String,
    wasTransferred: {
      type: Boolean,
      default: false,
    },
    transferReason: String,
    transferredTo: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Call', CallSchema);
