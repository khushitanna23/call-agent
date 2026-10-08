const Organization = require('../models/Organization');
const User = require('../models/User');
const Agent = require('../models/Agent');
const Call = require('../models/Call');
const Invoice = require('../models/Invoice');
const { PLANS } = require('../config/constants');

// @desc    Get Super Admin platform KPI metrics
// @route   GET /api/admin/metrics
// @access  Private (Admin role)
exports.getAdminMetrics = async (req, res, next) => {
  try {
    const [organizationsCount, usersCount, agentsCount, callsCount, totalInvoices] = await Promise.all([
      Organization.countDocuments(),
      User.countDocuments(),
      Agent.countDocuments(),
      Call.countDocuments(),
      Invoice.find({ status: 'paid' }),
    ]);

    const organizations = await Organization.find();
    let totalMinutes = 0;
    let totalMRR = 0;

    organizations.forEach((org) => {
      totalMinutes += org.minutesUsed || 0;
      const plan = PLANS.find((p) => p.id === org.plan);
      if (plan) totalMRR += plan.price;
    });

    const revenue = totalMRR;
    const aiCost = Number((totalMinutes * 0.04).toFixed(2));
    const grossMargin = revenue > 0 ? Number((((revenue - aiCost) / revenue) * 100).toFixed(1)) : 100;
    const churn = '0.0%';

    res.json({
      success: true,
      data: {
        mrr: totalMRR,
        customers: organizationsCount,
        activeSubscriptions: organizations.filter((o) => o.status !== 'suspended').length,
        calls: callsCount,
        minutes: totalMinutes,
        aiCost,
        revenue,
        grossMargin,
        churn,
        systemHealth: {
          uptime: '99.98%',
          latencyMs: 38,
          apiStatus: 'healthy',
          voicePipeline: 'operational',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const Lead = require('../models/Lead');
const Appointment = require('../models/Appointment');
const OrganizationMember = require('../models/OrganizationMember');

// @desc    Get all tenant customer organizations / clients
// @route   GET /api/admin/customers or /api/admin/clients
// @access  Private (Admin role)
exports.getCustomers = async (req, res, next) => {
  try {
    const orgs = await Organization.find()
      .populate('ownerId', 'name email role avatar isActive createdAt')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(
      orgs.map(async (org) => {
        const [agentCount, callCount, leadCount, appointmentCount] = await Promise.all([
          Agent.countDocuments({ organizationId: org._id }),
          Call.countDocuments({ organizationId: org._id }),
          Lead.countDocuments({ organizationId: org._id }),
          Appointment.countDocuments({ organizationId: org._id }),
        ]);

        return {
          id: org._id,
          _id: org._id,
          name: org.name,
          slug: org.slug,
          owner: org.ownerId,
          plan: org.plan,
          status: org.status || 'active',
          minutesUsed: org.minutesUsed || 0,
          minutesAllowance: org.minutesAllowance || 1000,
          agentCount,
          callCount,
          leadCount,
          appointmentCount,
          createdAt: org.createdAt,
          phoneNumbers: org.phoneNumbers || [],
        };
      })
    );

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    next(error);
  }
};

exports.getClients = exports.getCustomers;

// @desc    Get single client organization details
// @route   GET /api/admin/clients/:id
// @access  Private (Admin role)
exports.getClientDetails = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id).populate('ownerId', 'name email role avatar isActive createdAt');
    if (!org) {
      return res.status(404).json({ success: false, message: 'Client organization not found' });
    }

    const [agents, recentCalls, recentLeads, appointmentsCount] = await Promise.all([
      Agent.find({ organizationId: org._id }).sort({ createdAt: -1 }),
      Call.find({ organizationId: org._id }).populate('agentId', 'name').sort({ createdAt: -1 }).limit(10),
      Lead.find({ organizationId: org._id }).sort({ createdAt: -1 }).limit(10),
      Appointment.countDocuments({ organizationId: org._id }),
    ]);

    res.json({
      success: true,
      data: {
        organization: org,
        owner: org.ownerId,
        agents,
        recentCalls,
        recentLeads,
        stats: {
          agentCount: agents.length,
          callCount: await Call.countDocuments({ organizationId: org._id }),
          leadCount: await Lead.countDocuments({ organizationId: org._id }),
          appointmentCount: appointmentsCount,
          minutesUsed: org.minutesUsed || 0,
          minutesAllowance: org.minutesAllowance || 1000,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new client organization & owner account
// @route   POST /api/admin/clients
// @access  Private (Admin role)
exports.createClient = async (req, res, next) => {
  try {
    const { name, ownerName, ownerEmail, password, plan = 'growth', minutesAllowance = 1000 } = req.body;

    if (!name || !ownerEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide client company name, owner email, and temporary password',
      });
    }

    const cleanEmail = ownerEmail.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

    const organization = await Organization.create({
      name,
      slug,
      plan,
      minutesAllowance: Number(minutesAllowance) || 1000,
      minutesUsed: 0,
      phoneNumbers: [
        {
          number: '+1 (800) 555-' + Math.floor(1000 + Math.random() * 9000),
          label: 'Primary Inbound Line',
          provider: 'demo',
          isActive: true,
        },
      ],
    });

    const user = await User.create({
      name: ownerName || cleanEmail.split('@')[0],
      email: cleanEmail,
      password,
      organizationId: organization._id,
      role: 'client',
      lastLoginAt: new Date(),
    });

    organization.ownerId = user._id;
    await organization.save();

    await OrganizationMember.create({
      organizationId: organization._id,
      userId: user._id,
      role: 'owner',
      status: 'active',
    });

    // Create default Sarah agent for the client
    await Agent.create({
      organizationId: organization._id,
      name: 'Sarah',
      type: 'receptionist',
      industry: 'Business Services',
      voice: { gender: 'Female', style: 'Friendly', voiceId: '21m00Tcm4TlvDq8ikWAM' },
      phoneNumber: organization.phoneNumbers[0]?.number || '+1 (800) 555-0199',
      status: 'ONLINE',
      greetingMessage: `Hello! Thank you for calling ${name}. My name is Sarah, your AI Voice Receptionist. How can I assist you?`,
    });

    res.status(201).json({
      success: true,
      message: 'Client organization and owner created successfully',
      data: {
        organization,
        owner: user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update client organization
// @route   PUT /api/admin/clients/:id
// @access  Private (Admin role)
exports.updateClient = async (req, res, next) => {
  try {
    const { name, plan, minutesAllowance, status } = req.body;
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Client organization not found' });
    }

    if (name) org.name = name;
    if (plan) org.plan = plan;
    if (minutesAllowance !== undefined) org.minutesAllowance = Number(minutesAllowance);
    if (status) org.status = status;

    await org.save();

    res.json({ success: true, message: 'Client updated successfully', data: org });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle customer organization suspension
// @route   PUT /api/admin/customers/:id/toggle-status or /api/admin/clients/:id/toggle-status
// @access  Private (Admin role)
exports.toggleCustomerStatus = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    org.status = org.status === 'suspended' ? 'active' : 'suspended';
    await org.save();

    // Also update owner isActive
    if (org.ownerId) {
      await User.findByIdAndUpdate(org.ownerId, { isActive: org.status === 'active' });
    }

    res.json({
      success: true,
      message: `Organization status changed to ${org.status}`,
      status: org.status,
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleClientStatus = exports.toggleCustomerStatus;

// @desc    Get all platform-wide agents (cross-client view for admin)
// @route   GET /api/admin/agents
// @access  Private (Admin role)
exports.getPlatformAgents = async (req, res, next) => {
  try {
    const agents = await Agent.find().populate('organizationId', 'name plan').sort({ createdAt: -1 });
    res.json({ success: true, count: agents.length, data: agents });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all platform-wide calls (cross-client view for admin)
// @route   GET /api/admin/calls
// @access  Private (Admin role)
exports.getPlatformCalls = async (req, res, next) => {
  try {
    const calls = await Call.find()
      .populate('organizationId', 'name')
      .populate('agentId', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, count: calls.length, data: calls });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all platform-wide leads (cross-client view for admin)
// @route   GET /api/admin/leads
// @access  Private (Admin role)
exports.getPlatformLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find()
      .populate('organizationId', 'name')
      .populate('agentId', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, count: leads.length, data: leads });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all platform-wide appointments (cross-client view for admin)
// @route   GET /api/admin/appointments
// @access  Private (Admin role)
exports.getPlatformAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find()
      .populate({
        path: 'organizationId',
        select: 'name slug ownerId',
        populate: { path: 'ownerId', select: 'name email' },
      })
      .populate('agentId', 'name')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    next(error);
  }
};

// @desc    Inspect platform error logs
// @route   GET /api/admin/error-logs
// @access  Private (Admin role)
exports.getErrorLogs = async (req, res, next) => {
  try {
    const sampleLogs = [
      { id: 'ERR-01', service: 'VoicePipeline', message: 'Carrier trunk latency nominal (28ms)', timestamp: new Date(Date.now() - 1000 * 60 * 15), severity: 'low' },
      { id: 'ERR-02', service: 'SpeechTTS', message: 'TTS playback stream buffer verified', timestamp: new Date(Date.now() - 1000 * 60 * 45), severity: 'info' },
      { id: 'ERR-03', service: 'WebhookDispatch', message: 'Vapi telephony webhook gateway online 200 OK', timestamp: new Date(Date.now() - 1000 * 60 * 120), severity: 'info' },
    ];
    res.json({ success: true, count: sampleLogs.length, data: sampleLogs });
  } catch (error) {
    next(error);
  }
};
