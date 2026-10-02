const Organization = require('../models/Organization');
const Invoice = require('../models/Invoice');
const UsageEvent = require('../models/UsageEvent');
const { PLANS } = require('../config/constants');

// @desc    Get current billing status, plan info, usage meters, and invoices
// @route   GET /api/billing
// @access  Private
exports.getBillingInfo = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.organizationId);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const invoices = await Invoice.find({ organizationId: req.organizationId }).sort({ createdAt: -1 });

    const currentPlanId = org.plan || 'growth';
    const planDetails = PLANS.find((p) => p.id === currentPlanId) || PLANS[1];

    const minutesUsed = org.minutesUsed || 142;
    const minutesAllowance = org.minutesAllowance || planDetails.minutes;
    const minutesRemaining = Math.max(0, minutesAllowance - minutesUsed);
    const usagePercent = Math.min(100, Math.round((minutesUsed / minutesAllowance) * 100));

    // Fallback demo invoices if none in DB
    const displayInvoices =
      invoices.length > 0
        ? invoices
        : [
            {
              invoiceNumber: 'INV-2026-003',
              amount: planDetails.price,
              currency: 'USD',
              status: 'paid',
              paidAt: new Date(Date.now() - 5 * 86400000),
              description: `${planDetails.name} Plan Monthly Subscription`,
              pdfUrl: '#',
            },
            {
              invoiceNumber: 'INV-2026-002',
              amount: planDetails.price,
              currency: 'USD',
              status: 'paid',
              paidAt: new Date(Date.now() - 35 * 86400000),
              description: `${planDetails.name} Plan Monthly Subscription`,
              pdfUrl: '#',
            },
          ];

    res.json({
      success: true,
      currentPlan: {
        id: planDetails.id,
        name: planDetails.name,
        price: planDetails.price,
        billingCycle: 'monthly',
        renewalDate: new Date(Date.now() + 25 * 86400000).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      },
      usageMeter: {
        minutesAllowance,
        minutesUsed,
        minutesRemaining,
        usagePercent,
        overageRate: '$0.15 / min',
      },
      availablePlans: PLANS,
      invoices: displayInvoices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change subscription plan
// @route   POST /api/billing/change-plan
// @access  Private
exports.changePlan = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const selectedPlan = PLANS.find((p) => p.id === planId);

    if (!selectedPlan) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    const org = await Organization.findByIdAndUpdate(
      req.organizationId,
      {
        plan: selectedPlan.id,
        minutesAllowance: selectedPlan.minutes,
      },
      { new: true }
    );

    // Create a new invoice record
    await Invoice.create({
      organizationId: req.organizationId,
      invoiceNumber: 'INV-2026-' + Math.floor(100 + Math.random() * 900),
      amount: selectedPlan.price,
      currency: 'USD',
      status: 'paid',
      paidAt: new Date(),
      description: `Upgrade to ${selectedPlan.name} Plan`,
    });

    res.json({
      success: true,
      message: `Plan changed to ${selectedPlan.name} successfully`,
      organization: org,
    });
  } catch (error) {
    next(error);
  }
};
