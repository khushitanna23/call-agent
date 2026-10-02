const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Organization = require('../models/Organization');
const OrganizationMember = require('../models/OrganizationMember');
const Agent = require('../models/Agent');
const Call = require('../models/Call');
const CallRecording = require('../models/CallRecording');
const CallTranscript = require('../models/CallTranscript');
const CallSummary = require('../models/CallSummary');
const Lead = require('../models/Lead');
const LeadActivity = require('../models/LeadActivity');
const Appointment = require('../models/Appointment');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const Invoice = require('../models/Invoice');
const UsageEvent = require('../models/UsageEvent');
const Integration = require('../models/Integration');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vedanco_ai';

async function seedDatabase() {
  try {
    console.log('[Seed] Connecting to MongoDB at', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected. Clearing previous demo data...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      OrganizationMember.deleteMany({}),
      Agent.deleteMany({}),
      Call.deleteMany({}),
      CallRecording.deleteMany({}),
      CallTranscript.deleteMany({}),
      CallSummary.deleteMany({}),
      Lead.deleteMany({}),
      LeadActivity.deleteMany({}),
      Appointment.deleteMany({}),
      KnowledgeDocument.deleteMany({}),
      KnowledgeChunk.deleteMany({}),
      Invoice.deleteMany({}),
      UsageEvent.deleteMany({}),
      Integration.deleteMany({}),
    ]);

    console.log('[Seed] Creating Demo Organization...');
    const demoOrg = await Organization.create({
      name: 'Vedanco Demo',
      slug: 'vedanco-demo',
      plan: 'growth',
      billingStatus: 'active',
      minutesAllowance: 1000,
      minutesUsed: 142,
      phoneNumbers: [
        {
          number: '+1 (800) 555-0199',
          label: 'Primary Line',
          provider: 'demo',
          isActive: true,
        },
      ],
      settings: {
        timezone: 'America/New_York',
        businessHours: { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
        fallbackPhoneNumber: '+1 (555) 789-0123',
        recordingConsentMessage: 'This call may be recorded for quality and training purposes.',
        enableSMSNotifications: true,
        enableEmailNotifications: true,
      },
    });

    console.log('[Seed] Creating Demo Users...');
    // Demo user
    const demoUser = await User.create({
      name: 'Alex Johnson',
      email: 'demo@vedanco.ai',
      password: 'password123', // pre-save hook will hash this
      role: 'user',
      organizationId: demoOrg._id,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    });

    // Admin user
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@vedanco.ai',
      password: 'adminpassword123',
      role: 'admin',
      organizationId: demoOrg._id,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    });

    demoOrg.ownerId = demoUser._id;
    await demoOrg.save();

    await OrganizationMember.create({
      organizationId: demoOrg._id,
      userId: demoUser._id,
      role: 'owner',
      status: 'active',
    });

    console.log('[Seed] Creating Demo AI Receptionist "Sarah"...');
    const sarahAgent = await Agent.create({
      organizationId: demoOrg._id,
      name: 'Sarah',
      type: 'receptionist',
      industry: 'Technology',
      voice: {
        gender: 'Female',
        style: 'Friendly',
        voiceId: '21m00Tcm4TlvDq8ikWAM',
        speed: 1.0,
        pitch: 1.0,
      },
      personality:
        'Warm, articulate, highly attentive, and proactive. Speaks with a professional cadence, acknowledges customer requests clearly, and guides them effortlessly toward scheduling, qualification, or human handoff.',
      systemInstructions:
        'You are Sarah, the AI Receptionist for Vedanco Demo. Greet callers warmly, answer questions based on business knowledge, qualify them as leads (name, company, email/phone, requirements, timeline, budget), offer to book appointments, and gracefully transfer the call to a human specialist if requested.',
      greetingMessage:
        'Hello! Thank you for calling Vedanco Demo. My name is Sarah, your AI Receptionist. How may I assist you today?',
      websiteUrl: 'https://vedanco.ai',
      actions: {
        answerCalls: true,
        captureLeads: true,
        qualifyLeads: true,
        bookAppointments: true,
        transferCalls: true,
        sendFollowup: true,
      },
      transferSettings: {
        targetPhoneNumber: '+1 (555) 789-0123',
        transferMessage: 'Please hold while I connect you with our specialist team.',
        failureMessage: 'Our specialists are currently assisting others. I have saved your details for an immediate callback.',
      },
      status: 'ONLINE',
      phoneNumber: '+1 (800) 555-0199',
      totalCallsCount: 24,
      totalMinutesUsed: 142,
    });

    console.log('[Seed] Creating Knowledge Base documents and chunks...');
    const knowledgeItems = [
      {
        type: 'faq',
        title: 'Company Core Offerings & Solutions',
        content:
          'Vedanco AI specializes in production-ready AI Employees. Our flagship AI Receptionist handles 100% of incoming business phone calls, answers questions using proprietary company knowledge, qualifies prospective leads, and books appointments into calendars 24 hours a day, 7 days a week.',
      },
      {
        type: 'pricing',
        title: 'Service Plans & Minute Packages',
        content:
          'Starter Plan is $99 per month for 300 minutes. Growth Plan is $249 per month for 1,000 minutes and CRM integrations. Business Plan is $599 per month for 3,000 minutes and custom voice cloning. Enterprise custom tiers available upon review.',
      },
      {
        type: 'policy',
        title: 'Appointment Booking & Cancellation Policies',
        content:
          'Appointments can be scheduled for 15, 30, or 45-minute discovery consultations. Clients receive SMS and calendar invite confirmations immediately. Cancellations or rescheduling require at least 2 hours advance notice.',
      },
      {
        type: 'service',
        title: 'Human Call Transfer Protocols',
        content:
          'If a caller requests a human representative or requires complex technical escalations, Sarah transfers the call to +1 (555) 789-0123. If the line is busy, Sarah captures full caller contact details and logs an urgent callback.',
      },
    ];

    for (const item of knowledgeItems) {
      const doc = await KnowledgeDocument.create({
        organizationId: demoOrg._id,
        agentId: sarahAgent._id,
        type: item.type,
        title: item.title,
        content: item.content,
        source: 'seed_knowledge',
        status: 'ready',
        chunksCount: 1,
      });

      await KnowledgeChunk.create({
        organizationId: demoOrg._id,
        documentId: doc._id,
        agentId: sarahAgent._id,
        content: item.content,
        metadata: { title: item.title, type: item.type },
      });
    }

    console.log('[Seed] Creating realistic Leads with pipeline stages and AI scores...');
    const demoLeads = await Lead.insertMany([
      {
        organizationId: demoOrg._id,
        name: 'Jessica Vance',
        phone: '+1 (555) 382-9011',
        email: 'jessica@vanceproperties.com',
        company: 'Vance Real Estate Group',
        source: 'Inbound AI Call',
        pipelineStage: 'QUALIFIED',
        intent: 'AI Receptionist for 5 Agent Team',
        budget: '$10,000/yr',
        requirements: 'Requires after-hours call answering and instant lead forwarding to WhatsApp.',
        aiScore: 94,
        summary: 'Caller manages 5 luxury real estate agents. Missing 15-20 weekend buyer calls.',
      },
      {
        organizationId: demoOrg._id,
        name: 'Dr. Michael Chen',
        phone: '+1 (555) 912-4433',
        email: 'chen@summitwellness.org',
        company: 'Summit Wellness Clinic',
        source: 'Inbound AI Call',
        pipelineStage: 'APPOINTMENT',
        intent: 'Patient Intake & Booking',
        budget: '$8,000/yr',
        requirements: 'Needs HIPAA compliant patient triage and direct Google Calendar sync.',
        aiScore: 98,
        summary: 'High priority clinic intake. Scheduled consultation for tomorrow morning.',
      },
      {
        organizationId: demoOrg._id,
        name: 'Robert Miller',
        phone: '+1 (555) 472-8819',
        email: 'robert@millermotors.com',
        company: 'Miller Auto Dealership',
        source: 'Inbound AI Call',
        pipelineStage: 'CONTACTED',
        intent: 'Test Drive Scheduling',
        budget: '$15,000/yr',
        requirements: 'Looking to route service calls to mechanics and sales calls to sales desk.',
        aiScore: 82,
        summary: 'Auto dealership receiving high call volumes on Saturday mornings.',
      },
      {
        organizationId: demoOrg._id,
        name: 'Elena Rostova',
        phone: '+1 (555) 604-1290',
        email: 'elena@grandvistahotel.com',
        company: 'Grand Vista Resort & Spa',
        source: 'Inbound AI Call',
        pipelineStage: 'PROPOSAL',
        intent: 'Hotel Concierge & Reservations',
        budget: '$24,000/yr',
        requirements: 'Multi-lingual voice receptionist capable of handling room booking inquiries.',
        aiScore: 96,
        summary: 'Proposal sent for 3-property deployment with custom PMS integration.',
      },
      {
        organizationId: demoOrg._id,
        name: 'David Foster',
        phone: '+1 (555) 231-7788',
        email: 'david@fostercpas.com',
        company: 'Foster & Associates CPAs',
        source: 'Website Form',
        pipelineStage: 'NEW',
        intent: 'Tax Season Reception',
        budget: '$5,000/yr',
        requirements: 'Needs call filtering to avoid spam calls during peak tax preparation months.',
        aiScore: 78,
        summary: 'Inbound inquiry through website demo request form.',
      },
      {
        organizationId: demoOrg._id,
        name: 'Samantha Hughes',
        phone: '+1 (555) 890-3412',
        email: 'sam@hugheslawfirm.com',
        company: 'Hughes Law Firm',
        source: 'Inbound AI Call',
        pipelineStage: 'WON',
        intent: 'Legal Intake Receptionist',
        budget: '$12,000/yr',
        requirements: 'Confidential client qualification and urgent case routing.',
        aiScore: 99,
        summary: 'Closed annual Business Tier contract. Onboarded successfully.',
      },
    ]);

    // Create lead activities
    for (const lead of demoLeads) {
      await LeadActivity.create({
        organizationId: demoOrg._id,
        leadId: lead._id,
        type: 'call',
        title: 'Initial AI Receptionist Call',
        description: `Caller engaged with Sarah for 2.5 minutes. Captured intent: "${lead.intent}". AI Score evaluated at ${lead.aiScore}/100.`,
        performedBy: 'Sarah (AI Receptionist)',
      });
    }

    console.log('[Seed] Creating realistic Appointments...');
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

    const appt1 = await Appointment.create({
      organizationId: demoOrg._id,
      agentId: sarahAgent._id,
      leadId: demoLeads[1]._id, // Dr Michael Chen
      customerName: 'Dr. Michael Chen',
      customerPhone: '+1 (555) 912-4433',
      customerEmail: 'chen@summitwellness.org',
      date: tomorrow,
      timeSlot: '10:30 AM',
      durationMinutes: 30,
      type: 'Discovery Call',
      status: 'scheduled',
      notes: 'Consultation to review HIPAA-ready clinic workflows and calendar booking.',
      meetingLink: 'https://meet.google.com/ved-anco-demo',
    });

    const appt2 = await Appointment.create({
      organizationId: demoOrg._id,
      agentId: sarahAgent._id,
      leadId: demoLeads[0]._id, // Jessica Vance
      customerName: 'Jessica Vance',
      customerPhone: '+1 (555) 382-9011',
      customerEmail: 'jessica@vanceproperties.com',
      date: dayAfter,
      timeSlot: '02:00 PM',
      durationMinutes: 45,
      type: 'Product Demo',
      status: 'scheduled',
      notes: 'Live walkthrough of multi-agent routing and CRM sync.',
      meetingLink: 'https://meet.google.com/ved-anco-demo',
    });

    await Appointment.create({
      organizationId: demoOrg._id,
      agentId: sarahAgent._id,
      customerName: 'Marcus Aurelius',
      customerPhone: '+1 (555) 991-0022',
      customerEmail: 'marcus@philosophy.co',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      timeSlot: '11:00 AM',
      durationMinutes: 30,
      type: 'Discovery Call',
      status: 'completed',
      notes: 'Completed discovery session with positive evaluation.',
    });

    console.log('[Seed] Creating realistic Calls with transcripts and audio summaries...');
    const callConfigs = [
      {
        callerName: 'Dr. Michael Chen',
        callerNumber: '+1 (555) 912-4433',
        durationSeconds: 168,
        status: 'completed',
        intent: 'Appointment Booking & Intake',
        outcome: 'Appointment Scheduled & Lead Qualified',
        sentiment: 'Positive',
        leadId: demoLeads[1]._id,
        appointmentId: appt1._id,
        turns: [
          { speaker: 'ai', text: 'Hello! Thank you for calling Summit Wellness. My name is Sarah, your AI Receptionist. How may I assist you today?', timestamp: '00:01' },
          { speaker: 'caller', text: 'Hi Sarah, this is Dr. Chen. I want to book a discovery consultation to explore automated patient intake.', timestamp: '00:07' },
          { speaker: 'ai', text: 'Good morning Dr. Chen! I would be delighted to assist. We specialize in HIPAA-compliant intake and seamless schedule management. Could I book you for tomorrow at 10:30 AM?', timestamp: '00:15' },
          { speaker: 'caller', text: 'Yes, 10:30 AM tomorrow works perfectly for my schedule.', timestamp: '00:22' },
          { speaker: 'ai', text: 'Wonderful! I have confirmed your appointment for tomorrow at 10:30 AM and sent a Google Meet invitation to your email. Is there anything else I can help prepare?', timestamp: '00:30' },
          { speaker: 'caller', text: 'No, that covers everything. Thank you so much, Sarah.', timestamp: '00:35' },
          { speaker: 'ai', text: 'You are very welcome! Have a wonderful day ahead.', timestamp: '00:38' },
        ],
      },
      {
        callerName: 'Jessica Vance',
        callerNumber: '+1 (555) 382-9011',
        durationSeconds: 215,
        status: 'completed',
        intent: 'Service & Pricing Inquiry',
        outcome: 'Lead Qualified (Score 94)',
        sentiment: 'Positive',
        leadId: demoLeads[0]._id,
        appointmentId: appt2._id,
        turns: [
          { speaker: 'ai', text: 'Hello! Thank you for calling. My name is Sarah, your AI Receptionist. How may I assist you today?', timestamp: '00:01' },
          { speaker: 'caller', text: 'Hi, I run Vance Real Estate Group and we keep missing buyer calls on Sunday evenings. How does your AI handle weekend inquiries?', timestamp: '00:08' },
          { speaker: 'ai', text: 'We operate 24 hours a day, 7 days a week without interruption. I answer every caller within two rings, qualify their property preferences, budget, and pre-approval status, and instantly notify your agents.', timestamp: '00:19' },
          { speaker: 'caller', text: 'That sounds like what we need. What are your pricing plans?', timestamp: '00:27' },
          { speaker: 'ai', text: 'Our most popular Growth plan is $249 per month including 1,000 voice minutes and CRM integrations. I can also schedule a personalized product demo with our team on Thursday at 2:00 PM.', timestamp: '00:38' },
          { speaker: 'caller', text: 'Let us do Thursday at 2:00 PM. Put me down for that.', timestamp: '00:44' },
          { speaker: 'ai', text: 'Done! You are on our schedule for Thursday at 2:00 PM. We will review multi-agent routing together.', timestamp: '00:51' },
        ],
      },
      {
        callerName: 'Robert Miller',
        callerNumber: '+1 (555) 472-8819',
        durationSeconds: 135,
        status: 'transferred',
        intent: 'Speak to Human Representative',
        outcome: 'Transferred to Support Specialist',
        sentiment: 'Neutral',
        leadId: demoLeads[2]._id,
        wasTransferred: true,
        transferReason: 'Caller requested human sales engineer',
        transferredTo: '+1 (555) 789-0123',
        turns: [
          { speaker: 'ai', text: 'Hello! Thank you for calling. My name is Sarah, your AI Receptionist. How may I assist you today?', timestamp: '00:01' },
          { speaker: 'caller', text: 'Hi Sarah, can you connect me to someone in your technical team? We have a custom SIP PBX system.', timestamp: '00:08' },
          { speaker: 'ai', text: 'Certainly! I will connect you right away with our senior voice infrastructure engineer. Please stay on the line while I complete the transfer.', timestamp: '00:16' },
          { speaker: 'system', text: '[Call Transferred to Human Agent at +1 (555) 789-0123. Reason: Caller requested human sales engineer]', timestamp: '00:20' },
        ],
      },
      {
        callerName: 'Unknown Caller',
        callerNumber: '+1 (555) 103-9941',
        durationSeconds: 42,
        status: 'completed',
        intent: 'General Inquiry / Hours',
        outcome: 'Resolved by AI',
        sentiment: 'Neutral',
        turns: [
          { speaker: 'ai', text: 'Hello! Thank you for calling. My name is Sarah, your AI Receptionist. How may I assist you today?', timestamp: '00:01' },
          { speaker: 'caller', text: 'Hello, what are your opening hours today?', timestamp: '00:05' },
          { speaker: 'ai', text: 'Our headquarters and support teams are available Monday through Friday from 9:00 AM to 6:00 PM Eastern Time. However, as your AI receptionist, I am available 24/7 to assist with inquiries, take messages, and book meetings.', timestamp: '00:16' },
          { speaker: 'caller', text: 'Great, thanks for the info.', timestamp: '00:22' },
          { speaker: 'ai', text: 'My pleasure! Have a wonderful day.', timestamp: '00:25' },
        ],
      },
      {
        callerName: 'Elena Rostova',
        callerNumber: '+1 (555) 604-1290',
        durationSeconds: 198,
        status: 'completed',
        intent: 'Enterprise Multi-Location Deployment',
        outcome: 'Proposal Requested',
        sentiment: 'Positive',
        leadId: demoLeads[3]._id,
        turns: [
          { speaker: 'ai', text: 'Hello! Thank you for calling. My name is Sarah, your AI Receptionist. How may I assist you today?', timestamp: '00:01' },
          { speaker: 'caller', text: 'Good day Sarah. We operate three hotel resorts in Florida and need an automated receptionist to assist front desks with booking inquiries.', timestamp: '00:11' },
          { speaker: 'ai', text: 'Welcome Elena! Our Enterprise tier provides dedicated multi-tenant instances, custom voice personas, and PMS calendar integrations. May I gather your room booking system details to include in a formal proposal?', timestamp: '00:25' },
          { speaker: 'caller', text: 'Yes, we use Opera Cloud and have roughly 150 incoming calls daily across our properties.', timestamp: '00:36' },
          { speaker: 'ai', text: 'Splendid. I have compiled your technical requirements into an executive summary and scheduled our hotel solutions architect to follow up.', timestamp: '00:48' },
        ],
      },
    ];

    for (const conf of callConfigs) {
      const call = await Call.create({
        organizationId: demoOrg._id,
        agentId: sarahAgent._id,
        callerName: conf.callerName,
        callerNumber: conf.callerNumber,
        agentPhoneNumber: sarahAgent.phoneNumber,
        direction: 'inbound',
        status: conf.status,
        durationSeconds: conf.durationSeconds,
        intent: conf.intent,
        outcome: conf.outcome,
        sentiment: conf.sentiment,
        leadId: conf.leadId || null,
        appointmentId: conf.appointmentId || null,
        wasTransferred: conf.wasTransferred || false,
        transferReason: conf.transferReason || null,
        transferredTo: conf.transferredTo || null,
        cost: Number(((conf.durationSeconds / 60) * 0.15).toFixed(2)),
        provider: 'demo',
      });

      await CallTranscript.create({
        organizationId: demoOrg._id,
        callId: call._id,
        turns: conf.turns,
        rawTranscript: conf.turns.map((t) => `${t.speaker.toUpperCase()}: ${t.text}`).join('\n'),
      });

      await CallRecording.create({
        organizationId: demoOrg._id,
        callId: call._id,
        recordingUrl: 'https://actions.google.com/sounds/v1/telephones/phone_ring.ogg',
        durationSeconds: conf.durationSeconds,
        isDemoRecording: true,
      });

      await CallSummary.create({
        organizationId: demoOrg._id,
        callId: call._id,
        summary: `Call regarding ${conf.intent}. Resolved with outcome: ${conf.outcome}. Sentiment evaluated as ${conf.sentiment}.`,
        keyTakeaways: [
          `Inbound inquiry for ${conf.intent}`,
          `Handled smoothly by Sarah (AI Receptionist)`,
          `Total duration: ${Math.floor(conf.durationSeconds / 60)}m ${conf.durationSeconds % 60}s`,
        ],
        actionItems: ['Follow up according to qualification protocol'],
        customerIntent: conf.intent,
      });
    }

    console.log('[Seed] Creating demo Invoices & Usage Events...');
    await Invoice.insertMany([
      {
        organizationId: demoOrg._id,
        invoiceNumber: 'INV-2026-001',
        amount: 249,
        currency: 'USD',
        status: 'paid',
        paidAt: new Date(Date.now() - 30 * 86400000),
        description: 'Growth Plan Subscription - 1,000 Included Minutes',
      },
      {
        organizationId: demoOrg._id,
        invoiceNumber: 'INV-2026-002',
        amount: 249,
        currency: 'USD',
        status: 'paid',
        paidAt: new Date(Date.now() - 2 * 86400000),
        description: 'Growth Plan Subscription - Renewal',
      },
    ]);

    await UsageEvent.insertMany([
      {
        organizationId: demoOrg._id,
        agentId: sarahAgent._id,
        eventType: 'voice_minute',
        units: 142,
        providerCost: 7.1,
        customerCost: 21.3,
      },
      {
        organizationId: demoOrg._id,
        agentId: sarahAgent._id,
        eventType: 'ai_token',
        units: 24500,
        providerCost: 0.49,
        customerCost: 1.2,
      },
      {
        organizationId: demoOrg._id,
        agentId: sarahAgent._id,
        eventType: 'call_inbound',
        units: 24,
        providerCost: 0.12,
        customerCost: 0.36,
      },
    ]);

    console.log('[Seed] Setting up default Integration stubs...');
    await Integration.insertMany([
      {
        organizationId: demoOrg._id,
        serviceKey: 'openai',
        name: 'OpenAI GPT-4o',
        category: 'ai',
        isConnected: false,
        maskedCredentials: { apiKey: 'sk-••••••••abcd' },
      },
      {
        organizationId: demoOrg._id,
        serviceKey: 'vapi',
        name: 'Vapi Voice AI',
        category: 'voice',
        isConnected: false,
        maskedCredentials: {},
      },
      {
        organizationId: demoOrg._id,
        serviceKey: 'twilio',
        name: 'Twilio Telephony',
        category: 'voice',
        isConnected: false,
        maskedCredentials: {},
      },
      {
        organizationId: demoOrg._id,
        serviceKey: 'google_calendar',
        name: 'Google Calendar',
        category: 'calendar',
        isConnected: true,
        maskedCredentials: { account: 'vedanco.demo@gmail.com' },
        lastSyncedAt: new Date(),
      },
    ]);

    console.log('====================================================');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('Demo Organization: "Vedanco Demo"');
    console.log('Demo User:         demo@vedanco.ai / password123');
    console.log('Admin User:        admin@vedanco.ai / adminpassword123');
    console.log('AI Receptionist:   Sarah (ONLINE, +1 (800) 555-0199)');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
}

seedDatabase();
