const Appointment = require('../models/Appointment');
const Agent = require('../models/Agent');
const Lead = require('../models/Lead');
const Organization = require('../models/Organization');
const googleCalendarService = require('../services/googleCalendarService');
const bookingSlotService = require('../services/bookingSlotService');
const callSchedulerService = require('../services/callSchedulerService');
const notificationService = require('../services/notificationService');
const geminiService = require('../services/geminiService');
const nodemailer = require('nodemailer');

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

// Helper: Safe Agent Lookup
const findOrCreateValidAgent = async (agentId, organizationId) => {
  let agent = null;
  const isValidObjectId = agentId && /^[0-9a-fA-F]{24}$/.test(agentId);

  if (isValidObjectId) {
    if (organizationId) {
      agent = await Agent.findOne({ _id: agentId, organizationId });
    }
    if (!agent) {
      agent = await Agent.findById(agentId);
    }
  }

  if (!agent && organizationId) {
    agent = (await Agent.findOne({ organizationId, status: 'ONLINE' })) ||
            (await Agent.findOne({ organizationId }));
  }

  if (!agent) {
    agent = (await Agent.findOne({ status: 'ONLINE' })) ||
            (await Agent.findOne());
  }

  if (!agent) {
    agent = await Agent.create({
      organizationId: organizationId || null,
      name: 'Sarah',
      type: 'receptionist',
      industry: 'Technology',
      phoneNumber: '+1 (800) 555-0199',
      status: 'ONLINE',
    });
  }

  return agent;
};

// Helper: Nodemailer mail sender
const sendMeetingEmail = async ({ customerEmail, customerName, date, timeSlot, meetingLink }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Email Warning] EMAIL_USER or EMAIL_PASS not configured in .env. Skipping mail.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Vedanco AI" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: 'Appointment Confirmed - AI Consultation Meeting Link',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1f2937; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #2563eb; margin-top: 0;">Vedanco AI Consultation</h2>
          <p>Namaste <b>${customerName || 'Customer'}</b>,</p>
          <p>Tamari appointment successfully schedule thai gai chhe.</p>
          
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 4px 0;"><b>Date:</b> ${date}</p>
            <p style="margin: 4px 0;"><b>Time:</b> ${timeSlot}</p>
          </div>

          <p>AI Agent sathe direct vat karva mate nirdharit samaye aa link par click karo:</p>
          
          <p style="margin: 24px 0;">
            <a href="${meetingLink}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Join AI Voice Meeting
            </a>
          </p>

          <p style="font-size: 13px; color: #6b7280;">Direct meeting link:<br/>
            <a href="${meetingLink}" style="color: #2563eb;">${meetingLink}</a>
          </p>
        </div>
      `,
    });
    console.log(`[Meeting Email Sent] Successfully dispatched to ${customerEmail}`);
  } catch (emailErr) {
    console.error('[Meeting Email Error] Email sending failed:', emailErr.message);
  }
};

// ==========================================
// GEMINI NATURAL LANGUAGE BOOKING CONTROLLER
// ==========================================

exports.bookAppointmentWithGemini = async (req, res, next) => {
  try {
    const { message, userInput, agentId, customerTimezone } = req.body;
    const inputContent = message || userInput;

    if (!inputContent) {
      return res.status(400).json({
        success: false,
        message: 'Input message is required for Gemini processing.',
      });
    }

    const parsed = await geminiService.parseAppointmentWithGemini(inputContent, { agentId });

    if (!parsed.isAppointmentIntent) {
      return res.json({
        success: false,
        message: parsed.replyMessage || 'Could not detect an appointment booking intent.',
        parsedData: parsed,
      });
    }

    const missing = [];
    if (!parsed.customerName) missing.push('name');
    if (!parsed.customerPhone) missing.push('phone number');
    if (!parsed.date) missing.push('date');
    if (!parsed.timeSlot) missing.push('time slot');

    if (missing.length > 0) {
      return res.json({
        success: false,
        incomplete: true,
        missingFields: missing,
        replyMessage: parsed.replyMessage || `Please provide your ${missing.join(', ')} to finish scheduling.`,
        parsedData: parsed,
      });
    }

    req.body.customerName = parsed.customerName;
    req.body.customerPhone = parsed.customerPhone;
    req.body.customerEmail = parsed.customerEmail || `${parsed.customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
    req.body.date = parsed.date;
    req.body.timeSlot = parsed.timeSlot;
    req.body.serviceType = parsed.serviceType || 'AI Discovery Consultation';
    req.body.requirement = parsed.requirement || inputContent;
    req.body.customerTimezone = customerTimezone || 'America/New_York';

    return exports.bookPublicAppointment(req, res, next);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PUBLIC CUSTOMER BOOKING ENDPOINTS
// ==========================================

exports.getPublicAgents = async (req, res, next) => {
  try {
    const dbAgents = await Agent.find().select('name type industry voice status phoneNumber description');
    
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

exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { agentId, date, timezone } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required (format: YYYY-MM-DD)',
      });
    }

    let validAgentId = null;
    if (agentId && /^[0-9a-fA-F]{24}$/.test(agentId)) {
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

exports.getMonthAvailability = async (req, res, next) => {
  try {
    const { agentId, year, month, timezone } = req.query;

    let validAgentId = null;
    if (agentId && /^[0-9a-fA-F]{24}$/.test(agentId)) {
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

    if (!customerName || !customerPhone || !customerEmail || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, phone number, email, appointment date, and time slot.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule an appointment in the past. Please select an upcoming date.',
      });
    }

    let targetOrgId = req.organizationId;
    if (!targetOrgId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vedanco_super_secret_jwt_key_2026_prod_grade_token');
        const User = require('../models/User');
        const user = await User.findById(decoded.id);
        if (user && user.organizationId) {
          targetOrgId = user.organizationId;
        }
      } catch (err) {}
    }

    const agent = await findOrCreateValidAgent(agentId, targetOrgId);

    let organization = null;
    if (targetOrgId) {
      organization = await Organization.findById(targetOrgId);
    }
    if (!organization && agent && agent.organizationId) {
      organization = await Organization.findById(agent.organizationId);
    }
    if (!organization) {
      organization = await Organization.findOne();
    }

    if (!organization) {
      organization = await Organization.create({
        name: 'Vedanco Workspace',
        slug: 'vedanco-workspace',
      });
    }

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

    const scheduledDateTime = bookingSlotService.parseSlotDateTime(
      date,
      timeSlot,
      customerTimezone || 'America/New_York'
    );

    let bookingReference = Appointment.generateReference();
    while (await Appointment.findOne({ bookingReference })) {
      bookingReference = Appointment.generateReference();
    }

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

    const dynamicRoomId = `vedanco-agent-${bookingReference.toLowerCase()}`;
    const generatedMeetingLink = `https://meet.jit.si/${dynamicRoomId}`;

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
      meetingLink: generatedMeetingLink,
      calendarProvider: 'google',
      autoCallTriggered: false,
      autoCallStatus: 'pending',
    });

    // Nodemailer notification
    await sendMeetingEmail({
      customerEmail: appointment.customerEmail,
      customerName: appointment.customerName,
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      meetingLink: generatedMeetingLink,
    });

    // Calendar sync (Optional)
    let calendarResult = { eventId: null, htmlLink: null, status: 'skipped' };
    try {
      calendarResult = await googleCalendarService.createEvent({
        appointment,
        agent,
        organization,
      });
      appointment.googleCalendarEventId = calendarResult.eventId;
      appointment.googleCalendarHtmlLink = calendarResult.htmlLink;
      appointment.googleCalendarStatus = calendarResult.status;
      await appointment.save();
    } catch (gcalErr) {
      console.warn('[Calendar Sync Note] Skipped or failed:', gcalErr.message);
    }

    let notificationResult = { emailSent: true, smsSent: false };
    try {
      notificationResult = await notificationService.sendBookingConfirmation({
        appointment,
        agent,
        calendarResult,
      });
    } catch (notifErr) {
      console.warn('[Notification Service Note]', notifErr.message);
    }

    console.log(
      `[Appointment Created] Reference: ${bookingReference} | Date: ${date} ${timeSlot} | Customer: ${customerName} | Meeting: ${generatedMeetingLink}`
    );

    try {
      const io = req.app.get('io');
      if (io) {
        const payload = {
          appointment: {
            ...appointment.toObject(),
            organizationId: {
              _id: organization._id,
              name: organization.name,
              ownerId: organization.ownerId,
            },
            agentId: {
              _id: agent._id,
              name: agent.name,
            },
          },
          organization: {
            _id: organization._id,
            name: organization.name,
          },
        };
        io.to('admin_global').emit('admin_appointment_booked', payload);
        io.emit('appointment_booked', payload);
        if (organization._id) {
          io.to(`org_${organization._id}`).emit('new_appointment', payload.appointment);
        }
      }
    } catch (socketErr) {
      console.warn('[Socket Notification Note]', socketErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Appointment successfully scheduled and meeting link sent to email!',
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
        meetingLink: appointment.meetingLink,
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
          emailSent: notificationResult?.emailSent ?? true,
          smsSent: notificationResult?.smsSent ?? false,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

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

    appointment.rescheduleHistory.push({
      previousDate: appointment.date,
      previousTimeSlot: appointment.timeSlot,
      rescheduledAt: new Date(),
      reason: reason || 'Customer requested reschedule',
    });

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

    try {
      const updateResult = await googleCalendarService.updateEvent({
        eventId: appointment.googleCalendarEventId,
        appointment,
        agent: appointment.agentId,
      });

      if (updateResult.htmlLink) {
        appointment.googleCalendarHtmlLink = updateResult.htmlLink;
      }
    } catch (gcalErr) {
      console.warn('[Calendar Reschedule Note] Google Calendar update skipped:', gcalErr.message);
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

    if (appointment.googleCalendarEventId) {
      try {
        await googleCalendarService.deleteEvent({ eventId: appointment.googleCalendarEventId });
      } catch (gcalErr) {
        console.warn('[Calendar Delete Note]', gcalErr.message);
      }
    }

    try {
      await notificationService.sendCancellationNotification({
        appointment,
        reason: appointment.cancellationReason,
      });
    } catch (e) {}

    res.json({
      success: true,
      message: 'Appointment has been cancelled successfully.',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

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

exports.getAppointments = async (req, res, next) => {
  try {
    const isAgencyAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin' || req.user?.role === 'agency_admin';
    const { status, date, search, organizationId } = req.query;
    const query = {};
    if (!isAgencyAdmin) {
      query.organizationId = req.organizationId;
    } else if (organizationId && organizationId !== 'all') {
      query.organizationId = organizationId;
    }

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

    const upcoming = appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'calling');
    const completed = appointments.filter((a) => a.status === 'completed');
    const cancelled = appointments.filter((a) => a.status === 'cancelled');
    const failed = appointments.filter((a) => a.status === 'failed' || a.status === 'no_answer');

    res.json({
      success: true,
      count: appointments.length,
      counts: {
        total: appointments.length,
        upcoming: upcoming.length,
        completed: completed.length,
        past: completed.length,
        cancelled: cancelled.length,
        failed: failed.length,
      },
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

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

    // Safe Agent Resolution (Handles mock agent_sarah_1 or real ObjectId)
    const agent = await findOrCreateValidAgent(agentId, req.organizationId);

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

    let bookingReference = req.body.bookingReference || Appointment.generateReference();
    const scheduledDateTime = bookingSlotService.parseSlotDateTime(
      date,
      timeSlot,
      customerTimezone || 'America/New_York'
    );

    // Instant meeting room generation
    const dynamicRoomId = `vedanco-agent-${bookingReference.toLowerCase()}`;
    const generatedMeetingLink = `https://meet.jit.si/${dynamicRoomId}`;

    const appointment = await Appointment.create({
      bookingReference,
      organizationId: req.organizationId || agent.organizationId,
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
      meetingLink: generatedMeetingLink,
      calendarProvider: 'google',
      autoCallTriggered: false,
      autoCallStatus: 'pending',
      customerTimezone: customerTimezone || 'America/New_York',
      durationMinutes: req.body.durationMinutes || 30,
    });

    // Send email with the Jitsi meeting link
    await sendMeetingEmail({
      customerEmail: appointment.customerEmail,
      customerName: appointment.customerName,
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      meetingLink: generatedMeetingLink,
    });

    // Google Calendar Sync (Non-blocking)
    try {
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
    } catch (gcalErr) {
      console.warn('[Calendar Sync Note] Skipped or failed:', gcalErr.message);
    }

    try {
      await Lead.findOneAndUpdate(
        { organizationId: req.organizationId || agent.organizationId, phone: cPhone },
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

    try {
      const io = req.app.get('io');
      if (io) {
        const Organization = require('../models/Organization');
        const currentOrgId = req.organizationId || agent.organizationId;
        const org = currentOrgId ? await Organization.findById(currentOrgId) : null;
        const payload = {
          appointment: {
            ...appointment.toObject(),
            organizationId: org ? {
              _id: org._id,
              name: org.name,
              ownerId: org.ownerId,
            } : null,
            agentId: {
              _id: agent._id,
              name: agent.name,
            },
          },
          organization: org ? {
            _id: org._id,
            name: org.name,
          } : { name: 'Client Workspace' },
        };
        io.to('admin_global').emit('admin_appointment_booked', payload);
        io.emit('appointment_booked', payload);
        if (currentOrgId) {
          io.to(`org_${currentOrgId}`).emit('new_appointment', payload.appointment);
        }
      }
    } catch (socketErr) {
      console.warn('[Socket Notification Note]', socketErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Appointment scheduled and meeting link sent to email!',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAppointment = async (req, res, next) => {
  try {
    const query = req.user?.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, organizationId: req.organizationId };
    const appointment = await Appointment.findOneAndUpdate(
      query,
      req.body,
      { new: true }
    )
      .populate('organizationId', 'name slug ownerId')
      .populate('agentId', 'name type voice');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin_global').emit('admin_appointment_updated', { appointment });
        io.emit('appointment_updated', { appointment });
        const orgId = appointment.organizationId?._id || appointment.organizationId;
        if (orgId) {
          io.to(`org_${orgId}`).emit('appointment_updated', appointment);
        }
      }
    } catch (e) {}

    res.json({ success: true, message: 'Appointment updated', data: appointment });
  } catch (error) {
    next(error);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const query = req.user?.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, organizationId: req.organizationId };
    const appointment = await Appointment.findOneAndUpdate(
      query,
      { status: 'cancelled', cancelledAt: new Date() },
      { new: true }
    )
      .populate('organizationId', 'name slug ownerId')
      .populate('agentId', 'name type voice');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin_global').emit('admin_appointment_updated', { appointment });
        io.emit('appointment_updated', { appointment });
        const orgId = appointment.organizationId?._id || appointment.organizationId;
        if (orgId) {
          io.to(`org_${orgId}`).emit('appointment_updated', appointment);
        }
      }
    } catch (e) {}

    res.json({ success: true, message: 'Appointment cancelled', data: appointment });
  } catch (error) {
    next(error);
  }
};