const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
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
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    callId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Call',
    },
    serviceType: {
      type: String,
      default: 'Discovery Consultation',
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone number is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
    },
    requirement: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    timeSlot: {
      type: String, // e.g. "10:30 AM" or "02:00 PM"
      required: true,
    },
    scheduledDateTime: {
      type: Date,
      index: true,
    },
    customerTimezone: {
      type: String,
      default: 'America/New_York',
    },
    durationMinutes: {
      type: Number,
      default: 30,
    },
    type: {
      type: String,
      default: 'Discovery Call',
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
      index: true,
    },
    notes: {
      type: String,
      default: 'Booked via Vedanco Online Scheduling System',
    },
    meetingLink: {
      type: String,
      default: 'https://meet.google.com/ved-anco-call',
    },
    calendarEventId: {
      type: String,
    },
    calendarProvider: {
      type: String,
      enum: ['internal', 'google', 'microsoft', 'calendly', 'calcom'],
      default: 'google',
    },
    googleCalendarEventId: {
      type: String,
    },
    googleCalendarStatus: {
      type: String,
      enum: ['synced', 'pending', 'simulated', 'failed'],
      default: 'synced',
    },
    googleCalendarHtmlLink: {
      type: String,
    },
    autoCallTriggered: {
      type: Boolean,
      default: false,
      index: true,
    },
    autoCallStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    autoCallInitiatedAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
    cancelledAt: {
      type: Date,
    },
    rescheduleHistory: [
      {
        previousDate: String,
        previousTimeSlot: String,
        rescheduledAt: { type: Date, default: Date.now },
        reason: String,
      },
    ],
  },
  { timestamps: true }
);

// Compound index for slot uniqueness checks
AppointmentSchema.index({ agentId: 1, date: 1, timeSlot: 1, status: 1 });

// Helper function to generate clean booking reference
AppointmentSchema.statics.generateReference = function () {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let ref = 'VED-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};

module.exports = mongoose.model('Appointment', AppointmentSchema);
