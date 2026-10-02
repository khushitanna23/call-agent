const mongoose = require('mongoose');

const TranscriptTurnSchema = new mongoose.Schema({
  speaker: {
    type: String,
    enum: ['ai', 'caller', 'system', 'agent'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: String,
    default: '00:00',
  },
  timeOffsetSeconds: {
    type: Number,
    default: 0,
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral',
  },
});

const CallTranscriptSchema = new mongoose.Schema(
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
    turns: [TranscriptTurnSchema],
    rawTranscript: {
      type: String,
      default: '',
    },
    wordCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CallTranscript', CallTranscriptSchema);
