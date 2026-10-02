const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide an agent name'],
      trim: true,
      default: 'Sarah',
    },
    type: {
      type: String,
      enum: ['receptionist', 'sales', 'support', 'appointment_setter'],
      default: 'receptionist',
    },
    industry: {
      type: String,
      default: 'Technology',
    },
    voice: {
      gender: { type: String, enum: ['Female', 'Male'], default: 'Female' },
      style: {
        type: String,
        enum: ['Friendly', 'Professional', 'Luxury', 'Energetic'],
        default: 'Friendly',
      },
      voiceId: { type: String, default: '21m00Tcm4TlvDq8ikWAM' }, // Rachel or standard
      speed: { type: Number, default: 1.0 },
      pitch: { type: Number, default: 1.0 },
    },
    personality: {
      type: String,
      default:
        'Warm, articulate, highly attentive, and proactive. Speaks with a professional cadence, acknowledges customer requests clearly, and guides them effortlessly toward scheduling, qualification, or human handoff.',
    },
    systemInstructions: {
      type: String,
      default:
        'You are the AI Receptionist for the business. Greet the caller warmly, identify their needs, answer their questions based on business knowledge, qualify them as a lead (name, company, email/phone, requirements, timeline, budget), offer to book an appointment if suitable, and gracefully transfer the call to a human specialist if requested or if complex troubleshooting is needed.',
    },
    greetingMessage: {
      type: String,
      default:
        'Hello! Thank you for calling. My name is Sarah, your AI Receptionist. How may I assist you today?',
    },
    websiteUrl: {
      type: String,
      default: '',
    },
    knowledgeBaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeBase',
    },
    actions: {
      answerCalls: { type: Boolean, default: true },
      captureLeads: { type: Boolean, default: true },
      qualifyLeads: { type: Boolean, default: true },
      bookAppointments: { type: Boolean, default: true },
      transferCalls: { type: Boolean, default: true },
      sendFollowup: { type: Boolean, default: true },
    },
    transferSettings: {
      targetPhoneNumber: { type: String, default: '+1 (555) 789-0123' },
      transferMessage: {
        type: String,
        default: 'Please hold while I connect you with our specialist team.',
      },
      failureMessage: {
        type: String,
        default: 'Our specialists are currently assisting others. I have saved your details for an immediate callback.',
      },
    },
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE'],
      default: 'ONLINE',
    },
    phoneNumber: {
      type: String,
      default: '+1 (800) 555-0199',
    },
    totalCallsCount: {
      type: Number,
      default: 0,
    },
    totalMinutesUsed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Agent', AgentSchema);
