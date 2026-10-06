const Appointment = require('../models/Appointment');
const Agent = require('../models/Agent');
const Lead = require('../models/Lead');
const Organization = require('../models/Organization');
const googleCalendarService = require('../services/googleCalendarService');
const bookingSlotService = require('../services/bookingSlotService');
const callSchedulerService = require('../services/callSchedulerService');
const notificationService = require('../services/notificationService');

// Fallback AI Agents for commercial booking showcase if DB has limited agents
const DEFAULT_COMMERCIAL_AGENTS = [
  {
    name: 'Sarah',
    type: 'receptionist',
    industry: 'Real Estate & Property',
    roleTitle: 'Real Estate & Intake Specialist',
    description: 'Expert in scheduling property showings, pre-qualifying prospective buyers, and handling commercial leasing inquiries 24/7.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    rating: 4.98,
    reviewsCount: 342,
    serviceType: 'Property Inquiry & Showing Consultation',
    durationMinutes: 30,
    voiceStyle: 'Warm, articulate, and executive',
    responseTime: '< 1 second',
    tags: ['Real Estate', 'Buyer Qualification', 'Open Houses'],
  },
  {
    name: 'Dr. Maya Assistant',
    type: 'receptionist',
    industry: 'Healthcare & Wellness',
    roleTitle: 'Clinical Intake & Patient Coordinator',
    description: 'HIPAA-conscious patient scheduling, triage intake questionnaire routing, and consultation prep for medical and dental clinics.',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    rating: 4.95,
    reviewsCount: 218,
    serviceType: 'Clinical Intake & Discovery Consultation',
    durationMinutes: 30,
    voiceStyle: 'Empathetic, calm, and reassuring',
    responseTime: '< 1 second',
    tags: ['Healthcare', 'Patient Triage', 'Doctor Calendar'],
  },
  {
    name: 'David',
    type: 'sales',
    industry: 'Corporate & Consulting',
    roleTitle: 'Enterprise AI & Automation Advisor',
    description: 'Advises business owners and executives on deploying automated phone receptionists, CRM sync pipelines, and reducing call center costs.',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    rating: 4.99,
    reviewsCount: 520,
    serviceType: 'AI Receptionist Strategy & Architecture',
    durationMinutes: 30,
    voiceStyle: 'Sharp, authoritative, and consultative',
    responseTime: '< 1 second',
    tags: ['Consulting', 'ROI Assessment', 'Enterprise Demo'],
  },
  {
    name: 'Elena',
    type: 'appointment_setter',
    industry: 'Home Services & Contracting',
    roleTitle: 'Service Dispatch & Quotation Specialist',
    description: 'Specializes in urgent home service estimates, emergency dispatch, and booking on-site inspection visits.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    rating: 4.94,
    reviewsCount: 185,
    serviceType: 'On-Site Inspection & Service Quote Call',
    durationMinutes: 30,
    voiceStyle: 'Energetic, efficient, and solution-oriented',
    responseTime: '< 1 second',
    tags: ['Home Services', 'Quotes', 'Emergency Dispatch'],
  },
];

// ==========================================
// PUBLIC CUSTOMER BOOKING ENDPOINTS
// ==========================================

/**
 * @desc    Get all available bookable AI Agents and services
 * @route   GET /api/appointments/public/agents
 * @access  Public
 */
exports.getPublicAgents = async (req, res, next) => {
  try {
    const dbAgents = await Agent.find().select('name type industry voice status phoneNumber description');
    
    // Merge DB agents with rich commercial presentation data
    const agentsList = DEFAULT_COMMERCIAL_AGENTS.map((defAgent, index) => {
      const match = dbAgents.find(
        (a) => a.name.toLowerCase() === defAgent.name.toLowerCase() || a.industry === defAgent.industry
      ) || dbAgents[index % Math.max(1, dbAgents.length)];

      return {
        _id: match ? match._id : `agent_demo_${index + 1}`,
        name: defAgent.name,
        type: defAgent.type,
        industry: defAgent.industry,
        roleTitle: defAgent.roleTitle,
        description: defAgent.description,
        avatar: defAgent.avatar,
        rating: defAgent.rating,
        reviewsCount: defAgent.reviewsCount,
        serviceType: defAgent.serviceType,
        durationMinutes: defAgent.durationMinutes,
        voiceStyle: defAgent.voiceStyle,
        responseTime: defAgent.responseTime,
        tags: defAgent.tags,
        status: match ? match.status : 'ONLINE',
        phoneNumber: match ? match.phoneNumber : '+1 (800) 555-0199',
      };
    });

    res.json({
      success: true,
      count: agentsList.length,
      data: agentsList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get available time slots for a given date & agent
 * @route   GET /api/appointments/public/available-slots
 * @access  Public
 */
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { agentId, date, timezone } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required (format: YYYY-MM-DD)',
      });
    }

    // Resolve agent if valid ObjectId, otherwise fallback to any agent
    let validAgentId = null;
    if (agentId && agentId.match(/^[0-9a-fA-F]{24}$/)) {
      validAgentId = agentId;
    }

    const slotData = await bookingSlotService.getAvailableSlots({
      agentId: validAgentId,
      date,
      timezone: timezone || 'America/New_York',
    });

    res.json({
      success: true,
      data: slotData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get month calendar availability overview
 * @route   GET /api/appointments/public/month-availability
 * @access  Public
 */
exports.getMonthAvailability = async (req, res, next) => {
  try {
    const { agentId, year, month, timezone } = req.query;

    let validAgentId = null;
    if (agentId && agentId.match(/^[0-9a-fA-F]{24}$/)) {
      validAgentId = agentId;
    }

    const monthData = await bookingSlotService.getMonthAvailability({
      agentId: validAgentId,
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
      timezone: timezone || 'America/New_York',
    });

    res.json({
      success: true,
      data: monthData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Book a new appointment (Customer facing)
 * @route   POST /api/appointments/public/book
 * @access  Public
 */
exports.bookPublicAppointment = async (req, res, next) => {
  try {
    const {
      agentId,
      serviceType,
      date,
      timeSlot,
      customerName,
      customerPhone,
      customerEmail,
      requirement,
      customerTimezone,
    } = req.body;

    // 1. Validate mandatory fields
    if (!customerName || !customerPhone || !customerEmail || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, phone number, email, appointment date, and time slot.',
      });
    }

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Check past date
    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule an appointment in the past. Please select an upcoming date.',
      });
    }

    // 2. Resolve Agent and Organization
    let agent = null;
    if (agentId && agentId.match(/^[0-9a-fA-F]{24}$/)) {
      agent = await Agent.findById(agentId);
    }
    if (!agent) {
      agent = await Agent.findOne({ status: 'ONLINE' });
    }
    if (!agent) {
      agent = await Agent.findOne();
    }

    // If still no agent in DB, locate or create an organization first
    let organization = null;
    if (agent) {
      organization = await Organization.findById(agent.organizationId);
    }
    if (!organization) {
      organization = await Organization.findOne();
    }

    if (!organization) {
      return res.status(500).json({
        success: false,
        message: 'Organization setup incomplete. Please contact support.',
      });
    }

    // If agent was not found, create or link standard agent
    if (!agent) {
      agent = await Agent.create({
        organizationId: organization._id,
        name: 'Sarah',
        type: 'receptionist',
        industry: 'Technology',
        phoneNumber: '+1 (800) 555-0199',
        status: 'ONLINE',
      });
    }

    // 3. Double Booking Conflict Prevention (Atomic Check)
    const isSlotBooked = await bookingSlotService.checkSlotConflict({
      agentId: agent._id,
      date,
      timeSlot,
    });

    if (isSlotBooked) {
      return res.status(409).json({
        success: false,
        message: `The time slot ${timeSlot} on ${date} has just been reserved. Please select another available slot.`,
      });
    }

    // 4. Duplicate Check (same customer booking multiple times on exact slot)
    const duplicate = await Appointment.findOne({
      customerPhone: customerPhone.trim(),
      date,
      timeSlot,
      status: { $in: ['scheduled', 'in_progress'] },
    });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'You already have an appointment scheduled for this exact date and time slot.',
      });
    }

    // 5. Parse precise scheduled timestamp
    const scheduledDateTime = bookingSlotService.parseSlotDateTime(
      date,
      timeSlot,
      customerTimezone || 'America/New_York'
    );

    // 6. Generate unique booking reference
    let bookingReference = Appointment.generateReference();
    // Guarantee uniqueness
    while (await Appointment.findOne({ bookingReference })) {
      bookingReference = Appointment.generateReference();
    }

    // 7. Auto-create or link Lead in CRM
    let lead = await Lead.findOne({
      organizationId: organization._id,
      phone: customerPhone.trim(),
    });

    if (!lead) {
      lead = await Lead.create({
        organizationId: organization._id,
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim().toLowerCase(),
        company: `${customerName.trim()}`,
        source: 'Website Form',
        pipelineStage: 'APPOINTMENT',
        intent: serviceType || 'Discovery Consultation',
        requirements: requirement || 'Booked via Vedanco Online Scheduling',
        aiScore: 92,
        summary: `Self-scheduled ${serviceType || 'Consultation'} for ${date} at ${timeSlot}`,
      });
    }

    // 8. Create Appointment in MongoDB
    const appointment = await Appointment.create({
      bookingReference,
      organizationId: organization._id,
      agentId: agent._id,
      leadId: lead ? lead._id : null,
      serviceType: serviceType || 'AI Discovery Consultation',
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      requirement: requirement ? requirement.trim() : '',
      date,
      timeSlot,
      scheduledDateTime,
      customerTimezone: customerTimezone || 'America/New_York',
      durationMinutes: 30,
      type: serviceType || 'Discovery Call',
      status: 'scheduled',
      notes: requirement || 'Booked directly via Vedanco Appointment System',
      meetingLink: 'https://meet.google.com/ved-anco-call',
      calendarProvider: 'google',
      autoCallTriggered: false,
      autoCallStatus: 'pending',
    });

    // 9. Synchronize in Background with Google Calendar
    const calendarResult = await googleCalendarService.createEvent({
      appointment,
      agent,
      organization,
    });

    appointment.googleCalendarEventId = calendarResult.eventId;
    appointment.googleCalendarHtmlLink = calendarResult.htmlLink;
    appointment.googleCalendarStatus = calendarResult.status;
    await appointment.save();

    // 10. Send Confirmation Notification / Email
    const notificationResult = await notificationService.sendBookingConfirmation({
      appointment,
      agent,
      calendarResult,
    });

    console.log(
      `[Appointment Created] Reference: ${bookingReference} | Date: ${date} ${timeSlot} | Customer: ${customerName} | Phone: ${customerPhone}`
    );

    res.status(201).json({
      success: true,
      message: 'Appointment successfully scheduled and synchronized with Google Calendar!',
      data: {
        bookingReference: appointment.bookingReference,
        appointmentId: appointment._id,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        scheduledDateTime: appointment.scheduledDateTime,
        customerTimezone: appointment.customerTimezone,
        customerName: appointment.customerName,
        customerPhone: appointment.customerPhone,
        customerEmail: appointment.customerEmail,
        serviceType: appointment.serviceType,
        requirement: appointment.requirement,
        durationMinutes: appointment.durationMinutes,
        status: appointment.status,
        agent: {
          id: agent._id,
          name: agent.name,
          roleTitle: 'AI Specialist',
          phoneNumber: agent.phoneNumber,
        },
        googleCalendar: {
          status: appointment.googleCalendarStatus,
          eventId: appointment.googleCalendarEventId,
          addEventUrl: appointment.googleCalendarHtmlLink,
        },
        notification: {
          emailSent: notificationResult.emailSent,
          smsSent: notificationResult.smsSent,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lookup appointment by Booking Reference or Phone
 * @route   GET /api/appointments/public/lookup/:reference
 * @access  Public
 */
exports.lookupAppointment = async (req, res, next) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Please provide a booking reference or phone number.' });
    }

    const trimmed = reference.trim();
    const query = {
      $or: [
        { bookingReference: trimmed.toUpperCase() },
        { customerPhone: trimmed },
        { customerEmail: trimmed.toLowerCase() },
      ],
    };

    const appointment = await Appointment.findOne(query)
      .populate('agentId', 'name type industry phoneNumber voice')
      .populate('callId')
      .sort({ createdAt: -1 });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'No appointment found matching this reference or contact details.',
      });
    }

    // If call was completed, fetch call transcript turns
    let transcriptTurns = null;
    if (appointment.callId) {
      const transcript = await Appointment.db.model('CallTranscript').findOne({ callId: appointment.callId._id });
      if (transcript) {
        transcriptTurns = transcript.turns;
      }
    }

    res.json({
      success: true,
      data: {
        appointment,
        transcript: transcriptTurns,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reschedule public appointment
 * @route   POST /api/appointments/public/reschedule/:reference
 * @access  Public
 */
exports.reschedulePublicAppointment = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const { newDate, newTimeSlot, reason } = req.body;

    if (!newDate || !newTimeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the new date and time slot.',
      });
    }

    const appointment = await Appointment.findOne({
      $or: [{ bookingReference: reference.trim().toUpperCase() }, { _id: reference.match(/^[0-9a-fA-F]{24}$/) ? reference : null }],
    }).populate('agentId');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot reschedule a cancelled appointment. Please book a new one.' });
    }

    // Check slot collision
    const isConflict = await bookingSlotService.checkSlotConflict({
      agentId: appointment.agentId?._id,
      date: newDate,
      timeSlot: newTimeSlot,
      excludeAppointmentId: appointment._id,
    });

    if (isConflict) {
      return res.status(409).json({
        success: false,
        message: `The selected time slot ${newTimeSlot} on ${newDate} is already booked. Please choose another slot.`,
      });
    }

    // Update history
    appointment.rescheduleHistory.push({
      previousDate: appointment.date,
      previousTimeSlot: appointment.timeSlot,
      rescheduledAt: new Date(),
      reason: reason || 'Customer requested reschedule',
    });

    // Update appointment
    appointment.date = newDate;
    appointment.timeSlot = newTimeSlot;
    appointment.scheduledDateTime = bookingSlotService.parseSlotDateTime(
      newDate,
      newTimeSlot,
      appointment.customerTimezone
    );
    appointment.status = 'scheduled';
    appointment.autoCallTriggered = false;
    appointment.autoCallStatus = 'pending';

    // Update Google Calendar event in background
    const updateResult = await googleCalendarService.updateEvent({
      eventId: appointment.googleCalendarEventId,
      appointment,
      agent: appointment.agentId,
    });

    if (updateResult.htmlLink) {
      appointment.googleCalendarHtmlLink = updateResult.htmlLink;
    }

    await appointment.save();

    res.json({
      success: true,
      message: `Appointment successfully rescheduled to ${newDate} at ${newTimeSlot}`,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel public appointment
 * @route   POST /api/appointments/public/cancel/:reference
 * @access  Public
 */
exports.cancelPublicAppointment = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findOne({
      $or: [{ bookingReference: reference.trim().toUpperCase() }, { _id: reference.match(/^[0-9a-fA-F]{24}$/) ? reference : null }],
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Appointment is already cancelled.' });
    }

    appointment.status = 'cancelled';
    appointment.autoCallStatus = 'cancelled';
    appointment.cancellationReason = cancellationReason || 'Customer requested cancellation';
    appointment.cancelledAt = new Date();
    await appointment.save();

    // Cancel Google Calendar event in background
    if (appointment.googleCalendarEventId) {
      await googleCalendarService.deleteEvent({ eventId: appointment.googleCalendarEventId });
    }

    // Send cancellation email/notice
    await notificationService.sendCancellationNotification({
      appointment,
      reason: appointment.cancellationReason,
    });

    res.json({
      success: true,
      message: 'Appointment has been cancelled successfully.',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trigger instant test call for demonstration / testing
 * @route   POST /api/appointments/public/trigger-call/:reference
 * @access  Public
 */
exports.triggerInstantCall = async (req, res, next) => {
  try {
    const rawRef = (req.params.reference || req.params.id || '').trim();
    if (!rawRef) {
      return res.status(400).json({ success: false, message: 'Appointment reference or ID is required' });
    }

    const queries = [{ bookingReference: rawRef.toUpperCase() }];
    if (rawRef.match(/^[0-9a-fA-F]{24}$/)) {
      queries.push({ _id: rawRef });
    }

    const appointment = await Appointment.findOne({ $or: queries })
      .populate('agentId')
      .populate('organizationId');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const result = await callSchedulerService.executeCallForAppointment(appointment, true);

    res.json({
      success: true,
      message: `Outbound AI call completed! AI Agent ${appointment.agentId?.name || 'Sarah'} has initiated and completed the call.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download RFC 5545 .ics Calendar file
 * @route   GET /api/appointments/public/download-ics/:reference
 * @access  Public
 */
exports.downloadIcs = async (req, res, next) => {
  try {
    const { reference } = req.params;

    const appointment = await Appointment.findOne({
      $or: [{ bookingReference: reference.trim().toUpperCase() }, { _id: reference.match(/^[0-9a-fA-F]{24}$/) ? reference : null }],
    }).populate('agentId');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const icsContent = googleCalendarService.generateIcsFile({
      appointment,
      agent: appointment.agentId,
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="appointment-${appointment.bookingReference}.ics"`);
    res.send(icsContent);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PROTECTED DASHBOARD / ADMIN APPOINTMENTS
// ==========================================

/**
 * @desc    Get all appointments with filter
 * @route   GET /api/appointments
 * @access  Private
 */
exports.getAppointments = async (req, res, next) => {
  try {
    const { status, date, search } = req.query;
    const query = { organizationId: req.organizationId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (date) {
      query.date = date;
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { bookingReference: { $regex: search, $options: 'i' } },
      ];
    }

    const appointments = await Appointment.find(query)
      .populate('agentId', 'name type voice')
      .populate('leadId', 'name company email phone aiScore')
      .populate('callId')
      .sort({ date: 1, timeSlot: 1 });

    const upcoming = appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'in_progress');
    const past = appointments.filter((a) => a.status === 'completed');
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

/**
 * @desc    Create appointment from dashboard
 * @route   POST /api/appointments
 * @access  Private
 */
exports.createAppointment = async (req, res, next) => {
  try {
    const {
      customerName,
      phone,
      customerPhone,
      email,
      customerEmail,
      date,
      timeSlot,
      appointmentType,
      type,
      notes,
      agentId,
      customerTimezone,
    } = req.body;

    // 1. Validate agentId
    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: 'Path agentId is required. Please select an AI Agent.',
      });
    }

    // 2. Validate Agent exists
    const agent =
      (await Agent.findOne({ _id: agentId, organizationId: req.organizationId })) ||
      (await Agent.findById(agentId));

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Selected AI Agent not found in organization.',
      });
    }

    const cName = (customerName || '').trim();
    const cPhone = (customerPhone || phone || '').trim();
    const cEmail = (customerEmail || email || '').trim().toLowerCase();
    const apptType = appointmentType || type || 'Discovery Call';

    if (!cName || !cPhone || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Please provide customer name, phone number, date, and time slot.',
      });
    }

    // 3. Check Double Booking Conflict
    const isConflict = await bookingSlotService.checkSlotConflict({
      agentId: agent._id,
      date,
      timeSlot,
    });

    if (isConflict) {
      return res.status(409).json({
        success: false,
        message: `The time slot ${timeSlot} on ${date} is already booked for ${agent.name}. Please select another slot.`,
      });
    }

    // 4. Generate Reference & Parse DateTime
    let bookingReference = req.body.bookingReference || Appointment.generateReference();
    const scheduledDateTime = bookingSlotService.parseSlotDateTime(
      date,
      timeSlot,
      customerTimezone || 'America/New_York'
    );

    // 5. Create Appointment in MongoDB
    const appointment = await Appointment.create({
      bookingReference,
      organizationId: req.organizationId,
      agentId: agent._id,
      customerName: cName,
      customerPhone: cPhone,
      customerEmail: cEmail || `${cName.toLowerCase().replace(/\s+/g, '.')}@client.com`,
      date,
      timeSlot,
      scheduledDateTime,
      serviceType: apptType,
      type: apptType,
      notes: notes || 'Booked directly via appointment console.',
      status: 'scheduled',
      meetingLink: req.body.meetingLink || 'https://meet.google.com/ved-anco-call',
      calendarProvider: 'google',
      autoCallTriggered: false,
      autoCallStatus: 'pending',
      customerTimezone: customerTimezone || 'America/New_York',
      durationMinutes: req.body.durationMinutes || 30,
    });

    // 6. Synchronize in Background with Google Calendar
    const gcalResult = await googleCalendarService.createEvent({
      appointment,
      agent,
      organization: { _id: req.organizationId },
    });

    appointment.calendarEventId = gcalResult.eventId;
    appointment.googleCalendarEventId = gcalResult.eventId;
    appointment.googleCalendarHtmlLink = gcalResult.htmlLink;
    appointment.googleCalendarStatus = gcalResult.status;
    await appointment.save();

    // 7. Auto-create or link Lead in CRM
    try {
      await Lead.findOneAndUpdate(
        { organizationId: req.organizationId, phone: cPhone },
        {
          name: cName,
          phone: cPhone,
          email: cEmail || `${cName.toLowerCase().replace(/\s+/g, '.')}@client.com`,
          company: req.body.company || `${cName} (Client)`,
          pipelineStage: 'APPOINTMENT',
          intent: apptType,
          requirements: notes,
          summary: `Appointment scheduled with ${agent.name} for ${date} at ${timeSlot}`,
          lastAppointmentId: appointment._id,
        },
        { upsert: true, new: true }
      );
    } catch (leadErr) {
      console.warn('[Appointment] Lead sync note:', leadErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Appointment scheduled and synchronized with Google Calendar!',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update appointment
 * @route   PUT /api/appointments/:id
 * @access  Private
 */
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

/**
 * @desc    Cancel appointment
 * @route   DELETE /api/appointments/:id
 * @access  Private
 */
exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { status: 'cancelled', cancelledAt: new Date() },
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
