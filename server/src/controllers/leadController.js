const Lead = require('../models/Lead');
const LeadActivity = require('../models/LeadActivity');
const Call = require('../models/Call');
const Appointment = require('../models/Appointment');

// @desc    Get all leads with filtering & pipeline stage grouping
// @route   GET /api/leads
// @access  Private
exports.getLeads = async (req, res, next) => {
  try {
    const { stage, search, minScore } = req.query;

    const query = { organizationId: req.organizationId };

    if (stage && stage !== 'all') {
      query.pipelineStage = stage;
    }

    if (minScore) {
      query.aiScore = { $gte: Number(minScore) };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(query)
      .populate('lastCallId', 'callId durationSeconds status createdAt')
      .populate('appointmentId', 'date timeSlot status type')
      .sort({ createdAt: -1 });

    // Calculate pipeline stage metrics
    const stageCounts = {
      NEW: 0,
      CONTACTED: 0,
      QUALIFIED: 0,
      APPOINTMENT: 0,
      PROPOSAL: 0,
      WON: 0,
      LOST: 0,
    };

    leads.forEach((l) => {
      if (stageCounts[l.pipelineStage] !== undefined) {
        stageCounts[l.pipelineStage]++;
      }
    });

    res.json({
      success: true,
      count: leads.length,
      stageCounts,
      data: leads,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lead details with full activity timeline
// @route   GET /api/leads/:id
// @access  Private
exports.getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    })
      .populate('lastCallId')
      .populate('appointmentId');

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const activities = await LeadActivity.find({ leadId: lead._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        lead,
        activities,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create lead manually
// @route   POST /api/leads
// @access  Private
exports.createLead = async (req, res, next) => {
  try {
    const lead = await Lead.create({
      ...req.body,
      organizationId: req.organizationId,
    });

    await LeadActivity.create({
      organizationId: req.organizationId,
      leadId: lead._id,
      type: 'note',
      title: 'Lead Created',
      description: `Manual entry by ${req.user.name}`,
      performedBy: req.user.name,
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lead (stage, notes, details)
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res, next) => {
  try {
    const existing = await Lead.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const prevStage = existing.pipelineStage;
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // If stage changed, record activity
    if (req.body.pipelineStage && req.body.pipelineStage !== prevStage) {
      await LeadActivity.create({
        organizationId: req.organizationId,
        leadId: lead._id,
        type: 'stage_change',
        title: 'Stage Changed',
        description: `Stage moved from ${prevStage} to ${req.body.pipelineStage}`,
        performedBy: req.user.name || 'System',
      });
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Add activity note to lead
// @route   POST /api/leads/:id/activity
// @access  Private
exports.addLeadActivity = async (req, res, next) => {
  try {
    const { title, description, type = 'note' } = req.body;
    const activity = await LeadActivity.create({
      organizationId: req.organizationId,
      leadId: req.params.id,
      type,
      title: title || 'Note added',
      description,
      performedBy: req.user.name,
    });

    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
exports.deleteLead = async (req, res, next) => {
  try {
    await Lead.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId,
    });
    await LeadActivity.deleteMany({ leadId: req.params.id });

    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    next(error);
  }
};
