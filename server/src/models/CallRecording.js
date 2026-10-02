const mongoose = require('mongoose');

const CallRecordingSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    callId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Call',
      required: true,
      unique: true,
    },
    recordingUrl: {
      type: String,
      default: '',
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    format: {
      type: String,
      default: 'mp3',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    isDemoRecording: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CallRecording', CallRecordingSchema);
