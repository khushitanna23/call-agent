const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentMethod: {
      type: String,
      default: 'card', // card, wire, demo
    },
    last4: {
      type: String,
      default: '4242',
    },
    status: {
      type: String,
      enum: ['succeeded', 'pending', 'failed'],
      default: 'succeeded',
    },
    transactionId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);
