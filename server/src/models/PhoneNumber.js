const mongoose = require('mongoose');

const PhoneNumberSchema = new mongoose.Schema(
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
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    friendlyName: String,
    provider: {
      type: String,
      enum: ['twilio', 'vapi', 'demo'],
      default: 'demo',
    },
    providerSid: String,
    countryCode: {
      type: String,
      default: 'US',
    },
    status: {
      type: String,
      enum: ['active', 'released', 'pending'],
      default: 'active',
    },
    forwardToNumber: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('PhoneNumber', PhoneNumberSchema);
