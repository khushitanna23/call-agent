const Agent = require('../models/Agent');
const AgentVersion = require('../models/AgentVersion');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const aiService = require('../services/aiService');
const scrapeService = require('../services/scrapeService');

// @desc    Get all agents for current organization
// @route   GET /api/agents
// @access  Private
exports.getAgents = async (req, res, next) => {
  try {
    const agents = await Agent.find({ organizationId: req.organizationId }).sort({ createdAt: -1 });
    res.json({ success: true, count: agents.length, data: agents });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single agent by ID
// @route   GET /api/agents/:id
// @access  Private
exports.getAgentById = async (req, res, next) => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    res.json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new AI Receptionist / Employee
// @route   POST /api/agents
// @access  Private
exports.createAgent = async (req, res, next) => {
  try {
    const {
      name,
      type = 'receptionist',
      industry,
      voice,
      personality,
      systemInstructions,
      greetingMessage,
      websiteUrl,
      actions,
      transferSettings,
      status = 'ONLINE',
      knowledgeItems = [],
    } = req.body;

    const agent = await Agent.create({
      organizationId: req.organizationId,
      name: name || 'Sarah',
      type,
      industry: industry || 'Technology',
      voice: voice || { gender: 'Female', style: 'Friendly', voiceId: '21m00Tcm4TlvDq8ikWAM' },
      personality:
        personality ||
        'Warm, articulate, highly attentive, and proactive. Guides customers effortlessly toward scheduling, qualification, or human handoff.',
      systemInstructions:
        systemInstructions ||
        'You are the AI Receptionist for the business. Greet callers warmly, answer questions based on business knowledge, qualify leads, and offer to book appointments.',
      greetingMessage:
        greetingMessage ||
        `Hello! Thank you for calling. My name is ${name || 'Sarah'}, your AI Receptionist. How may I assist you today?`,
      websiteUrl,
      actions: actions || {
        answerCalls: true,
        captureLeads: true,
        qualifyLeads: true,
        bookAppointments: true,
        transferCalls: true,
        sendFollowup: true,
      },
      transferSettings: transferSettings || {
        targetPhoneNumber: '+1 (555) 789-0123',
        transferMessage: 'Please hold while I connect you with our specialist team.',
      },
      status,
      phoneNumber: '+1 (800) 555-' + Math.floor(1000 + Math.random() * 9000),
    });

    // Save initial version snapshot
    await AgentVersion.create({
      agentId: agent._id,
      versionNumber: 1,
      snapshot: agent.toObject(),
      changedBy: req.user._id,
      changeNotes: 'Initial creation via AI Receptionist wizard',
    });

    // If initial knowledge items were provided in wizard, store them
    if (knowledgeItems && knowledgeItems.length > 0) {
      for (const item of knowledgeItems) {
        if (item.content && item.content.trim()) {
          const doc = await KnowledgeDocument.create({
            organizationId: req.organizationId,
            agentId: agent._id,
            type: item.type || 'faq',
            title: item.title || 'Initial Knowledge',
            content: item.content,
            source: 'wizard_setup',
            status: 'indexed',
            chunksCount: 1,
            indexedAt: new Date(),
          });

          await KnowledgeChunk.create({
            organizationId: req.organizationId,
            documentId: doc._id,
            agentId: agent._id,
            content: item.content,
            embedding: await aiService.generateEmbedding(item.content),
            metadata: { title: doc.title, type: doc.type },
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'AI Receptionist created successfully',
      data: agent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update agent
// @route   PUT /api/agents/:id
// @access  Private
exports.updateAgent = async (req, res, next) => {
  try {
    let agent = await Agent.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    agent = await Agent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Agent updated successfully', data: agent });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete agent
// @route   DELETE /api/agents/:id
// @access  Private
exports.deleteAgent = async (req, res, next) => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    await Agent.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Test agent in real-time sandbox
// @route   POST /api/agents/:id/test
// @access  Private
exports.testAgent = async (req, res, next) => {
  try {
    const { messages = [] } = req.body;
    let agent = null;
    const requestedAgentId = req.params.id !== 'sandbox' ? req.params.id : req.body.agentId;

    if (requestedAgentId) {
      agent = await Agent.findOne({
        _id: requestedAgentId,
        organizationId: req.organizationId,
      });
    }

    if (!agent) {
      // Use fallback agent config for sandbox testing
      agent = {
        name: req.body.agentName || 'Sarah',
        industry: req.body.industry || 'Technology',
        personality: req.body.personality,
        systemInstructions: req.body.systemInstructions,
        actions: req.body.actions || {
          answerCalls: true,
          captureLeads: true,
          qualifyLeads: true,
          bookAppointments: true,
          transferCalls: true,
        },
      };
    }

    const aiResponse = await aiService.generateAIResponse({
      messages,
      agent,
      organizationId: req.organizationId,
      context: { callerNumber: '+1 (555) 999-0011', callerName: req.user.name },
    });

    res.json({
      success: true,
      data: {
        role: 'assistant',
        content: aiResponse.content,
        triggeredTool: aiResponse.triggeredTool,
        toolResult: aiResponse.toolResult,
        provider: aiResponse.provider,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Extract business information from a website URL
// @route   POST /api/agents/scrape-website
// @access  Private
exports.scrapeWebsite = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'Please provide a valid website URL' });
    }

    const extracted = await scrapeService.extractBusinessInfo(url);
    res.json({ success: true, data: extracted });
  } catch (error) {
    next(error);
  }
};
