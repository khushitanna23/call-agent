const { OpenAIProvider, MockAIProvider } = require('../providers/AIProvider');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const Lead = require('../models/Lead');
const LeadActivity = require('../models/LeadActivity');
const Appointment = require('../models/Appointment');
const Call = require('../models/Call');
const UsageEvent = require('../models/UsageEvent');

class AIService {
  constructor() {
    this.openaiProvider = process.env.OPENAI_API_KEY
      ? new OpenAIProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL || 'gpt-4o-mini')
      : null;
    this.mockProvider = new MockAIProvider();
  }

  getProvider() {
    return this.openaiProvider || this.mockProvider;
  }

  /**
   * Search knowledge base chunks for relevant context
   */
  async retrieveKnowledge(organizationId, query, limit = 4) {
    try {
      if (!query || !organizationId) return [];
      const regex = new RegExp(query.split(' ').filter((w) => w.length > 2).join('|'), 'i');
      const chunks = await KnowledgeChunk.find({
        organizationId,
        $or: [{ content: { $regex: regex } }, { 'metadata.title': { $regex: regex } }],
      })
        .limit(limit)
        .lean();

      return chunks;
    } catch (err) {
      console.warn('[AIService retrieveKnowledge Error]', err.message);
      return [];
    }
  }

  /**
   * Builds prompt context for the AI Receptionist
   */
  buildAgentContext(agent, knowledgeChunks = []) {
    const knowledgeText =
      knowledgeChunks.length > 0
        ? `\n\nRELEVANT BUSINESS KNOWLEDGE:\n${knowledgeChunks
            .map((k, i) => `[${i + 1}] ${k.content}`)
            .join('\n')}`
        : '';

    return {
      role: 'system',
      content: `You are ${agent.name || 'Sarah'}, a highly polished, friendly, and efficient AI Receptionist for a ${
        agent.industry || 'Modern'
      } business.
PERSONALITY & TONE: ${agent.personality || 'Warm, professional, articulate, and attentive.'}
CORE INSTRUCTIONS: ${agent.systemInstructions || 'Answer customer inquiries, qualify leads, and book appointments.'}
ALLOWED ACTIONS:
- Answer Calls: ${agent.actions?.answerCalls ?? true}
- Capture Leads: ${agent.actions?.captureLeads ?? true}
- Qualify Leads: ${agent.actions?.qualifyLeads ?? true}
- Book Appointments: ${agent.actions?.bookAppointments ?? true}
- Transfer Calls to Human: ${agent.actions?.transferCalls ?? true}
- Send Follow-up: ${agent.actions?.sendFollowup ?? true}
${knowledgeText}

CRITICAL OPERATIONAL RULES:
1. Always be welcoming and concise. This is a real-time voice call.
2. If the user asks for a price or service not in your knowledge, offer to take their details for a personalized quote.
3. If they ask to speak to a person, execute a human call transfer.
4. Extract caller details (name, phone, requirements, timeframe) when appropriate.`,
    };
  }

  /**
   * AI Tools Execution Engine
   */
  async executeTool(toolName, params = {}, context = {}) {
    const { organizationId, agentId, callId, callerNumber, callerName } = context;

    switch (toolName) {
      case 'searchKnowledge': {
        const results = await this.retrieveKnowledge(organizationId, params.query);
        return {
          success: true,
          tool: 'searchKnowledge',
          data: results.map((r) => r.content),
        };
      }

      case 'getBusinessInfo': {
        return {
          success: true,
          tool: 'getBusinessInfo',
          data: {
            businessHours: 'Monday to Friday, 9:00 AM - 6:00 PM EST',
            location: 'Headquarters & Virtual Services',
            supportEmail: 'support@vedanco.ai',
          },
        };
      }

      case 'checkAvailability': {
        const slots = ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];
        return {
          success: true,
          tool: 'checkAvailability',
          date: params.requestedDate || new Date().toISOString().split('T')[0],
          availableSlots: slots,
        };
      }

      case 'bookAppointment': {
        if (!organizationId) return { success: false, message: 'Missing organization' };
        const appointment = await Appointment.create({
          organizationId,
          agentId,
          callId,
          customerName: params.customerName || callerName || 'Customer',
          customerPhone: params.customerPhone || callerNumber || '+1 (555) 012-3456',
          customerEmail: params.customerEmail || 'client@example.com',
          date: params.date || new Date(Date.now() + 86400000).toISOString().split('T')[0],
          timeSlot: params.timeSlot || '02:00 PM',
          durationMinutes: 30,
          type: params.type || 'Discovery Call',
          status: 'scheduled',
          notes: params.notes || 'Booked by AI Receptionist during call.',
        });

        // Link with call if callId present
        if (callId) {
          await Call.findByIdAndUpdate(callId, { appointmentId: appointment._id });
        }

        return {
          success: true,
          tool: 'bookAppointment',
          appointmentId: appointment._id,
          details: appointment,
        };
      }

      case 'cancelAppointment': {
        if (params.appointmentId) {
          await Appointment.findByIdAndUpdate(params.appointmentId, { status: 'cancelled' });
        }
        return { success: true, tool: 'cancelAppointment', message: 'Appointment cancelled successfully' };
      }

      case 'rescheduleAppointment': {
        if (params.appointmentId) {
          await Appointment.findByIdAndUpdate(params.appointmentId, {
            date: params.newDate,
            timeSlot: params.newTime,
            status: 'rescheduled',
          });
        }
        return { success: true, tool: 'rescheduleAppointment', message: 'Appointment rescheduled' };
      }

      case 'createLead': {
        if (!organizationId) return { success: false, message: 'Missing organization' };
        const lead = await Lead.create({
          organizationId,
          name: params.name || callerName || 'New Caller Lead',
          phone: params.phone || callerNumber || '+1 (555) 012-3456',
          email: params.email || '',
          company: params.company || 'Prospective Client',
          source: 'Inbound AI Call',
          pipelineStage: 'QUALIFIED',
          intent: params.intent || 'Service Inquiry',
          budget: params.budget || '$5,000 - $15,000',
          requirements: params.requirements || params.message || 'Expressed interest during AI receptionist call.',
          aiScore: params.aiScore || 88,
          summary: params.summary || 'Caller asked about services and pricing.',
          lastCallId: callId,
        });

        await LeadActivity.create({
          organizationId,
          leadId: lead._id,
          type: 'call',
          title: 'Lead Captured via AI Receptionist',
          description: `Identified intent: ${lead.intent}. AI qualification score: ${lead.aiScore}/100.`,
          performedBy: 'AI Receptionist',
        });

        if (callId) {
          await Call.findByIdAndUpdate(callId, { leadId: lead._id });
        }

        return { success: true, tool: 'createLead', leadId: lead._id, lead };
      }

      case 'updateLead': {
        if (params.leadId) {
          await Lead.findByIdAndUpdate(params.leadId, params.updates);
        }
        return { success: true, tool: 'updateLead' };
      }

      case 'sendSMS': {
        // Integration-ready SMS tool
        return {
          success: true,
          tool: 'sendSMS',
          message: `SMS scheduled to ${params.to || callerNumber}: "${params.body || 'Thank you for calling!'}"`,
          status: 'delivered_simulated',
        };
      }

      case 'sendWhatsApp': {
        return {
          success: true,
          tool: 'sendWhatsApp',
          message: `WhatsApp message dispatched to ${params.to}`,
          status: 'delivered_simulated',
        };
      }

      case 'sendEmail': {
        return {
          success: true,
          tool: 'sendEmail',
          recipient: params.to,
          subject: params.subject || 'Follow-up from your call',
          status: 'sent_simulated',
        };
      }

      case 'transferCall': {
        if (callId) {
          await Call.findByIdAndUpdate(callId, {
            status: 'transferred',
            wasTransferred: true,
            transferReason: params.reason || 'Customer requested human agent',
            transferredTo: params.targetNumber || '+1 (555) 789-0123',
          });
        }
        return {
          success: true,
          tool: 'transferCall',
          transferredTo: params.targetNumber || '+1 (555) 789-0123',
          reason: params.reason,
        };
      }

      case 'createCallback': {
        return {
          success: true,
          tool: 'createCallback',
          message: `Callback scheduled for ${params.phone || callerNumber} at ${params.time || 'earliest availability'}.`,
        };
      }

      case 'endCall': {
        if (callId) {
          await Call.findByIdAndUpdate(callId, {
            status: 'completed',
            endTime: new Date(),
          });
        }
        return { success: true, tool: 'endCall', message: 'Call ended gracefully.' };
      }

      default:
        return { success: false, message: `Tool '${toolName}' not recognized.` };
    }
  }

  /**
   * Main conversational generation pipeline
   */
  async generateAIResponse({ messages, agent, organizationId, context = {} }) {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const knowledgeChunks = await this.retrieveKnowledge(organizationId, lastUserMessage);
    const systemPrompt = this.buildAgentContext(agent, knowledgeChunks);

    const fullMessages = [systemPrompt, ...messages.filter((m) => m.role !== 'system')];

    let result;
    if (this.openaiProvider) {
      try {
        result = await this.openaiProvider.generateCompletion({
          messages: fullMessages,
          temperature: 0.7,
        });
      } catch (err) {
        console.warn('[OpenAI failed, falling back to Mock Provider]:', err.message);
        result = await this.mockProvider.generateCompletion({
          messages,
          agent,
          knowledgeChunks,
        });
      }
    } else {
      result = await this.mockProvider.generateCompletion({
        messages,
        agent,
        knowledgeChunks,
      });
    }

    // Execute tool if mock or function call triggered
    if (result.triggeredTool) {
      const toolRes = await this.executeTool(
        result.triggeredTool,
        result.toolPayload || {},
        { ...context, organizationId, agentId: agent?._id }
      );
      result.toolResult = toolRes;
    }

    // Record AI token usage event
    if (organizationId) {
      try {
        await UsageEvent.create({
          organizationId,
          agentId: agent?._id,
          callId: context.callId,
          eventType: 'ai_token',
          units: result.usage?.total_tokens || 80,
          providerCost: 0.002,
          customerCost: 0.005,
        });
      } catch (e) {
        // ignore telemetry errors
      }
    }

    return result;
  }
}

module.exports = new AIService();
