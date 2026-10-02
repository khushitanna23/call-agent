const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
    },
    planId: {
      type: String,
      default: 'growth',
    },
    status: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'trialing'],
      default: 'active',
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', SubscriptionSchema);
