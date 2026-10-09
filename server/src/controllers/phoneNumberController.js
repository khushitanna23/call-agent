const PhoneNumber = require('../models/PhoneNumber');
const Organization = require('../models/Organization');
const Agent = require('../models/Agent');

// @desc    Get phone numbers (scoped for client, platform-wide or filtered for admin)
// @route   GET /api/phone-numbers
// @access  Private
exports.getPhoneNumbers = async (req, res, next) => {
  try {
    const isAgencyAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin' || req.user?.role === 'agency_admin';
    const { organizationId, status } = req.query;

    let query = {};
    if (!isAgencyAdmin) {
      query.organizationId = req.organizationId;
    } else if (organizationId && organizationId !== 'all') {
      query.organizationId = organizationId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    let phoneNumbers = await PhoneNumber.find(query)
      .populate('organizationId', 'name plan slug')
      .populate('agentId', 'name type status')
      .sort({ createdAt: -1 });

    // Fallback if collection is empty: populate from Organization.phoneNumbers
    if (phoneNumbers.length === 0) {
      const orgQuery = isAgencyAdmin ? {} : { _id: req.organizationId };
      const orgs = await Organization.find(orgQuery);
      
      const fallbackList = [];
      for (const org of orgs) {
        if (org.phoneNumbers && org.phoneNumbers.length > 0) {
          const agent = await Agent.findOne({ organizationId: org._id });
          org.phoneNumbers.forEach((pn, idx) => {
            fallbackList.push({
              _id: `pn_${org._id}_${idx}`,
              phoneNumber: pn.number,
              friendlyName: pn.label || 'Primary Inbound Line',
              provider: pn.provider || 'demo',
              status: pn.isActive ? 'active' : 'released',
              organizationId: {
                _id: org._id,
                name: org.name,
                plan: org.plan,
              },
              agentId: agent ? { _id: agent._id, name: agent.name, type: agent.type } : null,
              countryCode: 'US',
              createdAt: org.createdAt,
            });
          });
        }
      }
      return res.json({ success: true, count: fallbackList.length, data: fallbackList });
    }

    res.json({
      success: true,
      count: phoneNumbers.length,
      data: phoneNumbers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Purchase / provision a new phone number
// @route   POST /api/phone-numbers/purchase
// @access  Private
exports.purchasePhoneNumber = async (req, res, next) => {
  try {
    const { phoneNumber, friendlyName, organizationId, agentId, provider = 'demo' } = req.body;
    const isAgencyAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';

    const targetOrgId = isAgencyAdmin && organizationId ? organizationId : req.organizationId;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const org = await Organization.findById(targetOrgId);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const newNumber = await PhoneNumber.create({
      organizationId: targetOrgId,
      agentId: agentId || null,
      phoneNumber,
      friendlyName: friendlyName || `${org.name} Line`,
      provider,
      status: 'active',
      countryCode: 'US',
    });

    // Also push to organization phoneNumbers array
    org.phoneNumbers.push({
      number: phoneNumber,
      label: friendlyName || `${org.name} Line`,
      provider,
      isActive: true,
    });
    await org.save();

    res.status(201).json({
      success: true,
      message: 'Phone number provisioned successfully',
      data: newNumber,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update phone number (assign agent, label, forwarding)
// @route   PUT /api/phone-numbers/:id
// @access  Private
exports.updatePhoneNumber = async (req, res, next) => {
  try {
    const { friendlyName, agentId, forwardToNumber, status } = req.body;
    const isAgencyAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';

    const query = isAgencyAdmin ? { _id: req.params.id } : { _id: req.params.id, organizationId: req.organizationId };
    const pn = await PhoneNumber.findOne(query);

    if (!pn) {
      return res.status(404).json({ success: false, message: 'Phone number record not found' });
    }

    if (friendlyName) pn.friendlyName = friendlyName;
    if (agentId !== undefined) pn.agentId = agentId || null;
    if (forwardToNumber !== undefined) pn.forwardToNumber = forwardToNumber;
    if (status) pn.status = status;

    await pn.save();

    res.json({
      success: true,
      message: 'Phone number updated successfully',
      data: pn,
    });
  } catch (error) {
    next(error);
  }
};
