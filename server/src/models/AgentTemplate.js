const mongoose = require('mongoose');

const AgentTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    industry: {
      type: String,
      required: true,
    },
    description: String,
    suggestedVoice: {
      gender: String,
      style: String,
    },
    sampleSystemInstructions: String,
    suggestedGreeting: String,
    defaultActions: {
      answerCalls: { type: Boolean, default: true },
      captureLeads: { type: Boolean, default: true },
      qualifyLeads: { type: Boolean, default: true },
      bookAppointments: { type: Boolean, default: true },
      transferCalls: { type: Boolean, default: true },
    },
    icon: String,
    isPopular: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AgentTemplate', AgentTemplateSchema);
