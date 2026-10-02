const mongoose = require('mongoose');
const crypto = require('crypto');

const ApiKeySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      unique: true,
      default: () => 'vdc_' + crypto.randomBytes(24).toString('hex'),
    },
    keyPrefix: {
      type: String,
    },
    lastUsedAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

ApiKeySchema.pre('save', function (next) {
  if (this.key && !this.keyPrefix) {
    this.keyPrefix = this.key.substring(0, 8) + '...';
  }
  next();
});

module.exports = mongoose.model('ApiKey', ApiKeySchema);
