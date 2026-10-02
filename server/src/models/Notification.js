const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
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
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['call', 'lead', 'appointment', 'system', 'billing'],
      default: 'system',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
