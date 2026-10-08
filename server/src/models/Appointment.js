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
      index: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
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
    callerName: {
      type: String,
      trim: true,
    },
    customerName: {
      type: String,
      trim: true,
    },
    callerPhone: {
      type: String,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    requirement: {
      type: String,
      trim: true,
      default: '',
    },
    scheduledDate: {
      type: String, // YYYY-MM-DD
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      index: true,
    },
    scheduledTime: {
      type: String, // HH:mm or 10:30 AM
    },
    timeSlot: {
      type: String, // e.g. "10:30 AM" or "02:00 PM"
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
      enum: ['scheduled', 'calling', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'failed', 'no_answer'],
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
      enum: ['pending', 'calling', 'in_progress', 'completed', 'failed', 'no_answer', 'cancelled'],
      default: 'pending',
    },
    autoCallInitiatedAt: {
      type: Date,
    },
    vapiCallId: {
      type: String,
      index: true,
    },
    callStartedAt: {
      type: Date,
    },
    callEndedAt: {
      type: Date,
    },
    callStatus: {
      type: String,
    },
    callTranscript: {
      type: String,
    },
    callSummary: {
      type: String,
    },
    callRecordingUrl: {
      type: String,
    },
    callDurationSeconds: {
      type: Number,
    },
    callEndedReason: {
      type: String,
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

// Pre-save hook to synchronize aliases and ensure clean bookingReference
AppointmentSchema.pre('save', function (next) {
  if (this.orgId && !this.organizationId) this.organizationId = this.orgId;
  if (this.organizationId && !this.orgId) this.orgId = this.organizationId;

  if (this.callerName && !this.customerName) this.customerName = this.callerName;
  if (this.customerName && !this.callerName) this.callerName = this.customerName;

  if (this.callerPhone && !this.customerPhone) this.customerPhone = this.callerPhone;
  if (this.customerPhone && !this.callerPhone) this.callerPhone = this.customerPhone;

  if (this.scheduledDate && !this.date) this.date = this.scheduledDate;
  if (this.date && !this.scheduledDate) this.scheduledDate = this.date;

  if (this.scheduledTime && !this.timeSlot) this.timeSlot = this.scheduledTime;
  if (this.timeSlot && !this.scheduledTime) this.scheduledTime = this.timeSlot;

  if (!this.bookingReference) {
    this.bookingReference = this.constructor.generateReference();
  }
  next();
});

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
