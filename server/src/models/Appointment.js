const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
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
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    callId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Call',
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    timeSlot: {
      type: String, // e.g. "10:30 AM" or "14:30"
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 30,
    },
    type: {
      type: String,
      enum: ['Consultation', 'Discovery Call', 'Product Demo', 'Site Visit', 'Follow-up'],
      default: 'Discovery Call',
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
    },
    notes: {
      type: String,
      default: 'Booked via AI Receptionist during call.',
    },
    meetingLink: {
      type: String,
      default: 'https://meet.google.com/ved-anco-call',
    },
    calendarEventId: String,
    calendarProvider: {
      type: String,
      enum: ['internal', 'google', 'microsoft', 'calendly', 'calcom'],
      default: 'internal',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', AppointmentSchema);
