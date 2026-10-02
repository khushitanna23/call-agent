const mongoose = require('mongoose');

const OrganizationMemberSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    invitedEmail: String,
    status: {
      type: String,
      enum: ['active', 'invited', 'suspended'],
      default: 'active',
    },
  },
  { timestamps: true }
);

OrganizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('OrganizationMember', OrganizationMemberSchema);
