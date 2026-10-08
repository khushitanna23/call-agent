const Call = require('../models/Call');
const Lead = require('../models/Lead');
const Appointment = require('../models/Appointment');
const Agent = require('../models/Agent');
const UsageEvent = require('../models/UsageEvent');

// @desc    Get comprehensive call, lead, and receptionist analytics
// @route   GET /api/analytics
// @access  Private
exports.getAnalytics = async (req, res, next) => {
  try {
    const { timeRange = '30d' } = req.query;

    const organizationId = req.organizationId;
    const now = new Date();
    let startDate = new Date();

    if (timeRange === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else {
      // 30d default
      startDate.setDate(now.getDate() - 30);
    }

    const query = {
      organizationId,
      createdAt: { $gte: startDate },
    };

    // Parallel fetch for speed
    const [calls, leads, appointments, agents] = await Promise.all([
      Call.find(query),
      Lead.find(query),
      Appointment.find(query),
      Agent.find({ organizationId }),
    ]);

    const totalCalls = calls.length;
    const answeredCalls = calls.filter((c) => ['answered', 'completed', 'transferred'].includes(c.status)).length;
    const missedCalls = calls.filter((c) => c.status === 'missed' || c.status === 'failed').length;
    const transferredCalls = calls.filter((c) => c.status === 'transferred' || c.wasTransferred).length;

    const totalDurationSeconds = calls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
    const avgDuration = totalCalls > 0 ? Math.round(totalDurationSeconds / totalCalls) : 0;

    const qualifiedLeads = leads.filter((l) => ['QUALIFIED', 'APPOINTMENT', 'PROPOSAL', 'WON'].includes(l.pipelineStage)).length;
    const totalAppointments = appointments.length;

    const totalCost = calls.reduce((acc, c) => acc + (c.cost || 0), 0);
    const avgCostPerCall = totalCalls > 0 ? Number((totalCost / totalCalls).toFixed(2)) : 0;

    // Rates
    const aiResolutionRate = totalCalls > 0 ? Math.round(((totalCalls - transferredCalls - missedCalls) / totalCalls) * 100) : 0;
    const bookingRate = totalCalls > 0 ? Math.round((totalAppointments / totalCalls) * 100) : 0;
    const leadRate = totalCalls > 0 ? Math.round((leads.length / totalCalls) * 100) : 0;
    const transferRate = totalCalls > 0 ? Math.round((transferredCalls / totalCalls) * 100) : 0;

    // Time-series graph data calculated from actual MongoDB documents
    const daysCount = timeRange === 'today' ? 8 : timeRange === '7d' ? 7 : 14;
    const activityChart = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const bucketStart = new Date();
      const bucketEnd = new Date();

      if (timeRange === 'today') {
        bucketStart.setHours(bucketStart.getHours() - (i + 1) * 3, 0, 0, 0);
        bucketEnd.setHours(bucketEnd.getHours() - i * 3, 0, 0, 0);
        const label = `${bucketStart.getHours()}:00`;

        const bucketCalls = calls.filter((c) => c.createdAt >= bucketStart && c.createdAt < bucketEnd);
        const bucketLeads = leads.filter((l) => l.createdAt >= bucketStart && l.createdAt < bucketEnd);
        const ans = bucketCalls.filter((c) => ['answered', 'completed', 'transferred'].includes(c.status)).length;

        activityChart.push({ time: label, calls: bucketCalls.length, answered: ans, leads: bucketLeads.length });
      } else {
        bucketStart.setDate(bucketStart.getDate() - i);
        bucketStart.setHours(0, 0, 0, 0);
        bucketEnd.setDate(bucketEnd.getDate() - i);
        bucketEnd.setHours(23, 59, 59, 999);
        const label = bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const bucketCalls = calls.filter((c) => c.createdAt >= bucketStart && c.createdAt <= bucketEnd);
        const bucketLeads = leads.filter((l) => l.createdAt >= bucketStart && l.createdAt <= bucketEnd);
        const ans = bucketCalls.filter((c) => ['answered', 'completed', 'transferred'].includes(c.status)).length;

        activityChart.push({ time: label, calls: bucketCalls.length, answered: ans, leads: bucketLeads.length });
      }
    }

    // Intent distribution from real calls
    const intentMap = {};
    calls.forEach((c) => {
      const intent = c.intent || 'General Inquiry';
      intentMap[intent] = (intentMap[intent] || 0) + 1;
    });

    const intentData = Object.keys(intentMap).length > 0
      ? Object.keys(intentMap).map((k) => ({ name: k, value: intentMap[k] }))
      : [];

    res.json({
      success: true,
      metrics: {
        totalCalls,
        answeredCalls,
        missedCalls,
        averageDurationSeconds: avgDuration,
        leadsCount: leads.length,
        qualifiedLeads,
        appointmentsBooked: totalAppointments,
        transfersCount: transferredCalls,
        aiResolutionRate,
        bookingRate,
        leadRate,
        transferRate,
        averageCallCost: avgCostPerCall,
        totalCost: Number(totalCost.toFixed(2)),
      },
      charts: {
        activityChart,
        intentData,
      },
    });
  } catch (error) {
    next(error);
  }
};
