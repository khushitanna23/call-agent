const Appointment = require('../models/Appointment');
const Agent = require('../models/Agent');

// @desc    Get all appointments with filter
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
  try {
    const { status, filter, date } = req.query;
    const query = { organizationId: req.organizationId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (date) {
      query.date = date;
    }

    const appointments = await Appointment.find(query)
      .populate('agentId', 'name type')
      .populate('leadId', 'name company email phone')
      .sort({ date: 1, timeSlot: 1 });

    const todayStr = new Date().toISOString().split('T')[0];

    const upcoming = appointments.filter((a) => a.date >= todayStr && a.status === 'scheduled');
    const past = appointments.filter((a) => a.date < todayStr || a.status === 'completed');
    const cancelled = appointments.filter((a) => a.status === 'cancelled');

    res.json({
      success: true,
      count: appointments.length,
      counts: {
        total: appointments.length,
        upcoming: upcoming.length,
        past: past.length,
        cancelled: cancelled.length,
      },
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.create({
      ...req.body,
      organizationId: req.organizationId,
    });

    res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment (status, reschedule, notes)
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      req.body,
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({ success: true, message: 'Appointment updated', data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private
exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { status: 'cancelled' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({ success: true, message: 'Appointment cancelled', data: appointment });
  } catch (error) {
    next(error);
  }
};
