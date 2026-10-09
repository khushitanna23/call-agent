const Lead = require('../models/Lead');
const Appointment = require('../models/Appointment');
const Organization = require('../models/Organization');
const aiService = require('../services/aiService');

// In-memory demo requests store if DB not ready, or persist to Lead/Appointment
const demoBookings = [];

// @desc    Save public "Book a Demo" request
// @route   POST /api/demo/book
// @access  Public
exports.bookDemo = async (req, res, next) => {
  try {
    const { name, email, company, phone, message, preferredDateTime } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name, email, and phone number',
      });
    }

    const demoRecord = {
      id: 'DEMO-' + Date.now(),
      name,
      email,
      company: company || 'Enterprise Prospect',
      phone,
      message: message || 'Interested in AI Receptionist platform demo',
      preferredDateTime: preferredDateTime || 'Next available business day',
      createdAt: new Date(),
    };

    demoBookings.push(demoRecord);

    // Also persist as lead in the primary demo organization if available
    try {
      const demoOrg = await Organization.findOne({ name: /vedanco/i });
      if (demoOrg) {
        await Lead.create({
          organizationId: demoOrg._id,
          name,
          email,
          phone,
          company: company || 'Prospective Client',
          source: 'Demo Request',
          pipelineStage: 'QUALIFIED',
          intent: 'Product Demo & Strategy',
          requirements: message,
          aiScore: 95,
          summary: `Booked demo via public landing page for ${preferredDateTime}`,
        });
      }
    } catch (e) {
      // safe fallback
    }

    res.status(201).json({
      success: true,
      message: 'Thank you! Your demo request has been received. Our team will reach out shortly.',
      data: demoRecord,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Live browser AI Voice Demo conversation turn
// @route   POST /api/demo/voice-turn
// @access  Public
exports.voiceTurn = async (req, res, next) => {
  try {
    const { messages = [], language = 'english', agentName = 'Sarah' } = req.body;

    const isGu = language === 'gujarati';
    const demoAgent = {
      name: agentName,
      language,
      industry: 'Technology & Business Services',
      personality: isGu
        ? 'નમ્ર, સ્પષ્ટ, સન્માનજનક અને મદદગાર. કુદરતી ગુજરાતી ભાષામાં વાતચીત કરે છે.'
        : 'Warm, articulate, welcoming, and sharp. She speaks with a crisp natural cadence.',
      systemInstructions: isGu
        ? 'તમે VEDANCO AI ના મુખ્ય AI રિસેપ્શનિસ્ટ છો. તમે મુલાકાતીઓના પ્રશ્નોના જવાબો આપો છો, VEDANCO AI ની સેવાઓ સમજાવો છો, લીડ મેળવો છો અને એપોઇન્ટમેન્ટ બુક કરો છો. કુદરતી ગુજરાતીમાં જવાબ આપો.'
        : 'You are Sarah, the flagship AI Receptionist for VEDANCO AI. You answer visitor inquiries, explain how VEDANCO AI Receptionists answer calls 24/7, qualify leads, and book appointments. Answer directly, naturally, and warmly.',
      actions: {
        answerCalls: true,
        captureLeads: true,
        qualifyLeads: true,
        bookAppointments: true,
        transferCalls: true,
      },
    };

    const aiRes = await aiService.generateAIResponse({
      messages,
      agent: demoAgent,
      organizationId: null,
      context: { callerName: 'Public Demo Visitor', language },
    });

    res.json({
      success: true,
      role: 'assistant',
      content: aiRes.content,
      triggeredTool: aiRes.triggeredTool,
      isDemo: true,
    });
  } catch (error) {
    next(error);
  }
};
