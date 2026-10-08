const Campaign = require('../models/Campaign');

// @desc    Get all campaigns for current organization
// @route   GET /api/campaigns or GET /api/app/campaigns
// @access  Private
exports.getCampaigns = async (req, res) => {
  try {
    const orgId = req.organizationId || req.user?.organizationId || req.user?.orgId;
    const query = orgId ? { $or: [{ orgId }, { organizationId: orgId }] } : {};
    const campaigns = await Campaign.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new campaign
// @route   POST /api/campaigns or POST /api/app/campaigns
// @access  Private
exports.createCampaign = async (req, res) => {
  try {
    const orgId = req.organizationId || req.user?.organizationId || req.user?.orgId;
    const { name, type, targetAudience, totalContacts } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Campaign name is required' });
    }

    const campaign = await Campaign.create({
      orgId,
      organizationId: orgId,
      name,
      type: type || 'inbound_reception',
      targetAudience: targetAudience || '',
      status: 'active',
      totalContacts: totalContacts ? parseInt(totalContacts, 10) : 0,
      callsHandled: 0,
      completed: 0,
      successfulCalls: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle campaign status (active <-> paused)
// @route   PUT /api/campaigns/:id/toggle or PUT /api/app/campaigns/:id/toggle
// @access  Private
exports.toggleCampaignStatus = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    campaign.status = campaign.status === 'active' ? 'paused' : 'active';
    await campaign.save();

    res.json({
      success: true,
      message: `Campaign status updated to ${campaign.status}`,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({
      success: true,
      message: 'Campaign removed',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
