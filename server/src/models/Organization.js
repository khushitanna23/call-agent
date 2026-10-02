const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an organization name'],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    plan: {
      type: String,
      enum: ['starter', 'growth', 'business', 'enterprise'],
      default: 'growth',
    },
    billingStatus: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'trialing'],
      default: 'active',
    },
    minutesAllowance: {
      type: Number,
      default: 1000,
    },
    minutesUsed: {
      type: Number,
      default: 142,
    },
    phoneNumbers: [
      {
        number: String,
        label: String,
        provider: {
          type: String,
          enum: ['twilio', 'vapi', 'demo'],
          default: 'demo',
        },
        isActive: { type: Boolean, default: true },
      },
    ],
    settings: {
      timezone: { type: String, default: 'America/New_York' },
      businessHours: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '18:00' },
        days: { type: [Number], default: [1, 2, 3, 4, 5] },
      },
      fallbackPhoneNumber: { type: String, default: '+1 (555) 234-5678' },
      recordingConsentMessage: {
        type: String,
        default: 'This call may be recorded for quality and training purposes.',
      },
      enableSMSNotifications: { type: Boolean, default: true },
      enableEmailNotifications: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', OrganizationSchema);
