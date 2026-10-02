const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    priceMonthly: {
      type: Number,
      required: true,
    },
    priceAnnual: {
      type: Number,
      default: 0,
    },
    includedMinutes: {
      type: Number,
      required: true,
    },
    overageRatePerMinute: {
      type: Number,
      default: 0.15,
    },
    features: [String],
    isCustom: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', PlanSchema);
