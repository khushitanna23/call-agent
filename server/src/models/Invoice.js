const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['paid', 'open', 'void', 'uncollectible'],
      default: 'paid',
    },
    billingPeriod: {
      start: Date,
      end: Date,
    },
    description: String,
    pdfUrl: String,
    paidAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', InvoiceSchema);
