// Client-side mock database & fallback data for Vercel/Demo mode

const USERS_DB_KEY = 'vedanco_registered_users';
const CURRENT_ORG_KEY = 'vedanco_org';

// Default seeded accounts
const DEFAULT_ACCOUNTS = [
  {
    id: 'usr_demo_1',
    _id: 'usr_demo_1',
    name: 'Alex Johnson',
    email: 'demo@vedanco.ai',
    password: 'password123',
    role: 'client',
    organizationId: 'org_demo_1',
    organization: {
      id: 'org_demo_1',
      _id: 'org_demo_1',
      name: 'Vedanco Demo',
      slug: 'vedanco-demo',
      plan: 'growth',
      minutesAllowance: 1000,
      minutesUsed: 142,
      createdAt: '2026-09-15T09:00:00.000Z',
      phoneNumbers: [
        {
          number: '+1 (800) 555-0199',
          label: 'Primary Inbound Line',
          provider: 'demo',
          isActive: true,
        },
      ],
      settings: {
        timezone: 'America/New_York',
        fallbackPhoneNumber: '+1 (555) 789-0123',
        recordingConsentMessage: 'This call may be recorded for quality and training purposes.',
      },
    },
  },
  {
    id: 'usr_admin_1',
    _id: 'usr_admin_1',
    name: 'Super Admin',
    email: 'admin@vedanco.ai',
    password: 'password123',
    role: 'admin',
    organizationId: 'org_demo_1',
    organization: {
      id: 'org_demo_1',
      _id: 'org_demo_1',
      name: 'Vedanco Master Agency',
      slug: 'vedanco-master',
      plan: 'enterprise',
      minutesAllowance: 5000,
      minutesUsed: 890,
      createdAt: '2026-08-01T09:00:00.000Z',
      phoneNumbers: [
        {
          number: '+1 (855) 833-2626',
          label: 'Agency Master Trunk',
          provider: 'twilio',
          isActive: true,
        },
      ],
      settings: {
        timezone: 'America/New_York',
        fallbackPhoneNumber: '+1 (555) 789-0123',
        recordingConsentMessage: 'This call may be recorded for quality assurance.',
      },
    },
  },
];

export const safeSetItem = (key, val) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
    }
  } catch (e) {
    console.warn(`localStorage.setItem failed for ${key}:`, e);
  }
};

export const safeGetItem = (key) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const getStoredUsers = () => {
  try {
    const raw = safeGetItem(USERS_DB_KEY);
    const customUsers = raw ? JSON.parse(raw) : [];
    return [...DEFAULT_ACCOUNTS, ...customUsers];
  } catch {
    return [...DEFAULT_ACCOUNTS];
  }
};

export const saveCustomUser = (user) => {
  try {
    const raw = safeGetItem(USERS_DB_KEY);
    const customUsers = raw ? JSON.parse(raw) : [];
    customUsers.push(user);
    safeSetItem(USERS_DB_KEY, JSON.stringify(customUsers));
  } catch (e) {
    console.error('Failed to save user to localStorage:', e);
  }
};

export const registerLocalUser = (name, email, password, companyName) => {
  const normEmail = (email || 'user').toLowerCase().trim();
  const userName = (name || normEmail.split('@')[0] || 'User').trim();

  const orgId = 'org_' + Date.now();
  const orgName = companyName?.trim() || `${userName}'s Workspace`;

  const newOrg = {
    id: orgId,
    _id: orgId,
    name: orgName,
    slug: orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000),
    plan: 'growth',
    minutesAllowance: 1000,
    minutesUsed: 0,
    createdAt: new Date().toISOString(),
    phoneNumbers: [
      {
        number: '+1 (800) 555-' + Math.floor(1000 + Math.random() * 9000),
        label: 'Primary Line',
        provider: 'demo',
        isActive: true,
      },
    ],
    settings: {
      timezone: 'America/New_York',
      fallbackPhoneNumber: '+1 (555) 789-0123',
      recordingConsentMessage: 'This call may be recorded for quality and training purposes.',
    },
  };

  const newUser = {
    id: 'usr_' + Date.now(),
    _id: 'usr_' + Date.now(),
    name: userName,
    email: normEmail,
    password: password || 'password',
    role: normEmail.includes('admin') ? 'admin' : 'client',
    organizationId: orgId,
    organization: newOrg,
    createdAt: new Date().toISOString(),
  };

  try {
    const raw = safeGetItem(USERS_DB_KEY);
    let customUsers = raw ? JSON.parse(raw) : [];
    customUsers = customUsers.filter((u) => (u.email || '').toLowerCase() !== normEmail);
    customUsers.push(newUser);
    safeSetItem(USERS_DB_KEY, JSON.stringify(customUsers));
  } catch (e) {
    console.error('Failed to update localStorage users:', e);
  }

  const token = 'vedanco_jwt_' + Math.random().toString(36).substring(2) + '_' + Date.now();
  safeSetItem('vedanco_token', token);
  safeSetItem('vedanco_user', JSON.stringify({
    id: newUser.id,
    _id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    organizationId: newUser.organizationId,
  }));
  safeSetItem('vedanco_org_id', orgId);
  safeSetItem(CURRENT_ORG_KEY, JSON.stringify(newOrg));

  return {
    success: true,
    message: 'Account registered successfully',
    token,
    user: {
      id: newUser.id,
      _id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      organizationId: newUser.organizationId,
    },
    organization: newOrg,
  };
};

export const loginLocalUser = (email, password) => {
  const normEmail = (email || 'user').toLowerCase().trim();
  const allUsers = getStoredUsers();

  let user = allUsers.find((u) => {
    const uEmail = (u.email || '').toLowerCase();
    const uName = (u.name || '').toLowerCase();
    return uEmail === normEmail || uName === normEmail || u.id === normEmail || u._id === normEmail;
  });

  if (!user) {
    return registerLocalUser(normEmail.split('@')[0], normEmail, password, `${normEmail.split('@')[0]}'s Workspace`);
  }

  if (password) {
    user.password = password;
    saveCustomUser(user);
  }

  const org = user.organization || {
    id: user.organizationId || 'org_demo_1',
    _id: user.organizationId || 'org_demo_1',
    name: `${user.name}'s Company`,
    slug: 'user-workspace',
    plan: 'growth',
    minutesAllowance: 1000,
    minutesUsed: 142,
    createdAt: '2026-09-15T09:00:00.000Z',
    phoneNumbers: [
      {
        number: '+1 (800) 555-0199',
        label: 'Primary Line',
        provider: 'demo',
        isActive: true,
      },
    ],
  };

  const token = 'vedanco_jwt_' + Math.random().toString(36).substring(2) + '_' + Date.now();
  safeSetItem('vedanco_token', token);
  safeSetItem('vedanco_user', JSON.stringify({
    id: user.id || user._id,
    _id: user.id || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  }));
  safeSetItem('vedanco_org_id', user.organizationId || org.id);
  safeSetItem(CURRENT_ORG_KEY, JSON.stringify(org));

  return {
    success: true,
    token,
    role: user.role === 'admin' ? 'admin' : 'client',
    user: {
      id: user.id || user._id,
      _id: user.id || user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
    organization: org,
  };
};

// Fallback Mock Data for other API routes
export const MOCK_AGENT = {
  _id: 'agent_sarah_1',
  name: 'Sarah',
  type: 'receptionist',
  industry: 'Technology',
  voice: {
    gender: 'Female',
    style: 'Friendly',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
  },
  phoneNumber: '+1 (800) 555-0199',
  status: 'ONLINE',
  greetingMessage: 'Hello! Thank you for calling VEDANCO AI. My name is Sarah, your AI Receptionist. How may I assist you today?',
  totalCallsCount: 24,
  totalMinutesUsed: 142,
  personality: 'Warm, articulate, highly attentive, and proactive.',
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
};

export const MOCK_CLIENTS = [
  {
    id: 'org_demo_1',
    _id: 'org_demo_1',
    name: 'Vedanco Demo',
    slug: 'vedanco-demo',
    plan: 'GROWTH',
    status: 'active',
    minutesUsed: 142,
    minutesAllowance: 1000,
    agentCount: 1,
    callCount: 24,
    leadCount: 6,
    appointmentCount: 3,
    campaignCount: 2,
    createdAt: '2026-09-15T09:00:00.000Z',
    joinedDate: 'Sep 15, 2026',
    owner: {
      name: 'Alex Johnson',
      email: 'demo@vedanco.ai',
    },
    phoneNumbers: [
      { number: '+1 (800) 555-0199', label: 'Primary Inbound Line', isActive: true, provider: 'demo' },
    ],
  },
  {
    id: 'org_client_2',
    _id: 'org_client_2',
    name: 'Premier Realty Advisors',
    slug: 'premier-realty',
    plan: 'BUSINESS',
    status: 'active',
    minutesUsed: 480,
    minutesAllowance: 3000,
    agentCount: 2,
    callCount: 88,
    leadCount: 22,
    appointmentCount: 14,
    campaignCount: 3,
    createdAt: '2026-09-01T10:00:00.000Z',
    joinedDate: 'Sep 1, 2026',
    owner: {
      name: 'Jessica Vance',
      email: 'jessica@vanceproperties.com',
    },
    phoneNumbers: [
      { number: '+1 (212) 555-0199', label: 'VIP Showings Desk', isActive: true, provider: 'twilio' },
    ],
  },
  {
    id: 'org_client_3',
    _id: 'org_client_3',
    name: 'Sterling Health Clinics',
    slug: 'sterling-health',
    plan: 'BUSINESS',
    status: 'active',
    minutesUsed: 890,
    minutesAllowance: 3000,
    agentCount: 3,
    callCount: 145,
    leadCount: 38,
    appointmentCount: 29,
    campaignCount: 2,
    createdAt: '2026-08-20T11:00:00.000Z',
    joinedDate: 'Aug 20, 2026',
    owner: {
      name: 'Dr. Michael Chen',
      email: 'chen@summitwellness.org',
    },
    phoneNumbers: [
      { number: '+1 (312) 429-8811', label: 'Patient Triage Line', isActive: true, provider: 'twilio' },
    ],
  },
  {
    id: 'org_client_4',
    _id: 'org_client_4',
    name: 'Nexus Law Partners',
    slug: 'nexus-law',
    plan: 'STARTER',
    status: 'active',
    minutesUsed: 195,
    minutesAllowance: 500,
    agentCount: 1,
    callCount: 31,
    leadCount: 9,
    appointmentCount: 5,
    campaignCount: 1,
    createdAt: '2026-09-22T14:30:00.000Z',
    joinedDate: 'Sep 22, 2026',
    owner: {
      name: 'Samantha Hughes',
      email: 'sam@hugheslawfirm.com',
    },
    phoneNumbers: [
      { number: '+1 (415) 800-4123', label: 'Legal Consultation Routing', isActive: true, provider: 'twilio' },
    ],
  },
];

export const MOCK_CALLS = [
  {
    _id: 'call_demo_1',
    callId: 'CALL-9021',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Demo' },
    agentId: { _id: 'agent_sarah_1', name: 'Sarah', type: 'receptionist' },
    callerName: 'Dr. Michael Chen',
    callerNumber: '+1 (555) 912-4433',
    durationSeconds: 168,
    status: 'completed',
    intent: 'Appointment Booking & Intake',
    outcome: 'Appointment Scheduled & Lead Qualified',
    sentiment: 'Positive',
    cost: 0.42,
    leadId: { _id: 'lead_demo_2', name: 'Dr. Michael Chen' },
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    turns: [
      { speaker: 'ai', text: 'Hello! Thank you for calling Summit Wellness. My name is Sarah, your AI Receptionist. How may I assist you today?', timestamp: '00:01' },
      { speaker: 'caller', text: 'Hi Sarah, this is Dr. Chen. I want to book a discovery consultation to explore automated patient intake.', timestamp: '00:07' },
      { speaker: 'ai', text: 'Good morning Dr. Chen! I would be delighted to assist. Could I book you for tomorrow at 10:30 AM?', timestamp: '00:15' },
      { speaker: 'caller', text: 'Yes, 10:30 AM tomorrow works perfectly.', timestamp: '00:22' },
      { speaker: 'ai', text: 'Wonderful! Your appointment is confirmed and sent to your email.', timestamp: '00:30' },
    ],
    recordingUrl: 'https://actions.google.com/sounds/v1/telephones/phone_ring.ogg',
    summary: {
      summary: 'Dr. Chen called to book an intake workflow discovery consultation. Scheduled successfully for tomorrow 10:30 AM.',
      keyTakeaways: ['Clinic automation discovery requested', 'Appointment locked into calendar', 'High intent lead'],
      actionItems: ['Prepare HIPAA overview materials'],
    },
  },
  {
    _id: 'call_demo_2',
    callId: 'CALL-8842',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Demo' },
    agentId: { _id: 'agent_sarah_1', name: 'Sarah', type: 'receptionist' },
    callerName: 'Jessica Vance',
    callerNumber: '+1 (555) 382-9011',
    durationSeconds: 215,
    status: 'completed',
    intent: 'Service & Pricing Inquiry',
    outcome: 'Lead Qualified (Score 94)',
    sentiment: 'Positive',
    cost: 0.54,
    leadId: { _id: 'lead_demo_1', name: 'Jessica Vance' },
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    turns: [
      { speaker: 'ai', text: 'Hello! Thank you for calling. My name is Sarah, your AI Receptionist. How may I assist you today?', timestamp: '00:01' },
      { speaker: 'caller', text: 'Hi, I run Vance Real Estate Group and we keep missing buyer calls on Sunday evenings. How does your AI handle weekend inquiries?', timestamp: '00:08' },
      { speaker: 'ai', text: 'We operate 24 hours a day, 7 days a week. I answer every caller within two rings and qualify their preferences.', timestamp: '00:19' },
    ],
    recordingUrl: 'https://actions.google.com/sounds/v1/telephones/phone_ring.ogg',
    summary: {
      summary: 'Jessica Vance inquired regarding after-hours coverage for 5 real estate brokers.',
      keyTakeaways: ['Weekend coverage needed', 'AI score 94/100'],
      actionItems: ['Send custom proposal'],
    },
  },
  {
    _id: 'call_demo_3',
    callId: 'CALL-7731',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Demo' },
    agentId: { _id: 'agent_sarah_1', name: 'Sarah', type: 'receptionist' },
    callerName: 'Robert Miller',
    callerNumber: '+1 (555) 472-8819',
    durationSeconds: 135,
    status: 'transferred',
    intent: 'Speak to Human Representative',
    outcome: 'Transferred to Support Specialist',
    sentiment: 'Neutral',
    cost: 0.34,
    leadId: { _id: 'lead_demo_3', name: 'Robert Miller' },
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    wasTransferred: true,
    transferredTo: '+1 (555) 789-0123',
    turns: [
      { speaker: 'ai', text: 'Hello! Thank you for calling. How may I assist you today?', timestamp: '00:01' },
      { speaker: 'caller', text: 'Hi Sarah, can you connect me to someone in your technical team?', timestamp: '00:08' },
      { speaker: 'ai', text: 'Certainly! I will connect you right away with our senior voice engineer.', timestamp: '00:16' },
    ],
    recordingUrl: 'https://actions.google.com/sounds/v1/telephones/phone_ring.ogg',
    summary: {
      summary: 'Caller requested human representative for custom PBX integration. Transferred smoothly.',
      keyTakeaways: ['Custom PBX setup', 'Transferred to engineer'],
      actionItems: ['Verify transfer log'],
    },
  },
  {
    _id: 'call_demo_4',
    callId: 'CALL-6590',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Demo' },
    agentId: { _id: 'agent_sarah_1', name: 'Sarah', type: 'receptionist' },
    callerName: 'Elena Rostova',
    callerNumber: '+1 (555) 604-1290',
    durationSeconds: 198,
    status: 'completed',
    intent: 'Enterprise Multi-Location Deployment',
    outcome: 'Proposal Requested',
    sentiment: 'Positive',
    cost: 0.50,
    leadId: { _id: 'lead_demo_4', name: 'Elena Rostova' },
    createdAt: new Date(Date.now() - 1000 * 60 * 540).toISOString(),
    turns: [
      { speaker: 'ai', text: 'Hello! Thank you for calling. How may I assist you?', timestamp: '00:01' },
      { speaker: 'caller', text: 'We operate three hotel resorts in Florida and need an automated receptionist.', timestamp: '00:11' },
    ],
    recordingUrl: 'https://actions.google.com/sounds/v1/telephones/phone_ring.ogg',
    summary: {
      summary: 'Elena Rostova requested enterprise quote for multi-resort hospitality receptionist.',
      keyTakeaways: ['3 hotel properties', 'Opera Cloud PMS integration required'],
      actionItems: ['Send enterprise agreement'],
    },
  },
  {
    _id: 'call_demo_5',
    callId: 'CALL-5412',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Demo' },
    agentId: { _id: 'agent_sarah_1', name: 'Sarah', type: 'receptionist' },
    callerName: 'Inbound Caller',
    callerNumber: '+1 (555) 103-9941',
    durationSeconds: 42,
    status: 'completed',
    intent: 'General Inquiry / Operating Hours',
    outcome: 'Resolved by AI',
    sentiment: 'Neutral',
    cost: 0.11,
    createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    turns: [
      { speaker: 'ai', text: 'Hello! Thank you for calling. How may I assist you today?', timestamp: '00:01' },
      { speaker: 'caller', text: 'What are your opening hours today?', timestamp: '00:05' },
      { speaker: 'ai', text: 'Our headquarters are open 9:00 AM to 6:00 PM EST, and I am available 24/7 to assist.', timestamp: '00:15' },
    ],
    recordingUrl: 'https://actions.google.com/sounds/v1/telephones/phone_ring.ogg',
    summary: {
      summary: 'Caller inquired regarding business operating hours. Successfully answered.',
      keyTakeaways: ['Operating hours provided', 'Quick resolution under 1 min'],
      actionItems: [],
    },
  },
];

export const MOCK_LEADS = [
  {
    _id: 'lead_demo_1',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Demo' },
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
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    _id: 'lead_demo_2',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Demo' },
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
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    _id: 'lead_demo_3',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Demo' },
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
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    _id: 'lead_demo_4',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Demo' },
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
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    _id: 'lead_demo_5',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Demo' },
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
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    _id: 'lead_demo_6',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Demo' },
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
    summary: 'Closed annual contract. Onboarded successfully.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
];

export const MOCK_APPOINTMENTS = [
  {
    _id: 'appt_demo_1',
    bookingReference: 'VED-CH912',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Demo' },
    agentId: { _id: 'agent_sarah_1', name: 'Sarah', type: 'receptionist' },
    leadId: { _id: 'lead_demo_2', name: 'Dr. Michael Chen' },
    customerName: 'Dr. Michael Chen',
    customerPhone: '+1 (555) 912-4433',
    customerEmail: 'chen@summitwellness.org',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: '10:30 AM',
    durationMinutes: 30,
    type: 'Discovery Call',
    status: 'scheduled',
    notes: 'Consultation to review HIPAA-ready clinic workflows and calendar booking.',
    meetingLink: 'https://meet.google.com/ved-anco-demo',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'appt_demo_2',
    bookingReference: 'VED-JV382',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Demo' },
    agentId: { _id: 'agent_sarah_1', name: 'Sarah', type: 'receptionist' },
    leadId: { _id: 'lead_demo_1', name: 'Jessica Vance' },
    customerName: 'Jessica Vance',
    customerPhone: '+1 (555) 382-9011',
    customerEmail: 'jessica@vanceproperties.com',
    date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    timeSlot: '02:00 PM',
    durationMinutes: 45,
    type: 'Product Demo',
    status: 'scheduled',
    notes: 'Live walkthrough of multi-agent routing and CRM sync.',
    meetingLink: 'https://meet.google.com/ved-anco-demo',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'appt_demo_3',
    bookingReference: 'VED-MA991',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Demo' },
    agentId: { _id: 'agent_sarah_1', name: 'Sarah', type: 'receptionist' },
    customerName: 'Marcus Aurelius',
    customerPhone: '+1 (555) 991-0022',
    customerEmail: 'marcus@philosophy.co',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    timeSlot: '11:00 AM',
    durationMinutes: 30,
    type: 'Discovery Call',
    status: 'completed',
    notes: 'Completed discovery session with positive evaluation.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export const MOCK_PHONE_NUMBERS = [
  {
    _id: 'pn_1',
    phoneNumber: '+1 (800) 555-0199',
    friendlyName: 'Primary Inbound Line',
    provider: 'demo',
    status: 'active',
    countryCode: 'US',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Demo', plan: 'growth' },
    agentId: { _id: 'agent_sarah_1', name: 'Sarah', type: 'receptionist' },
    forwardToNumber: '+1 (555) 789-0123',
    callsThisMonth: 24,
    monthlyFee: 1.15,
  },
  {
    _id: 'pn_2',
    phoneNumber: '+1 (212) 555-0199',
    friendlyName: 'VIP Showings Desk',
    provider: 'twilio',
    status: 'active',
    countryCode: 'US',
    organizationId: { _id: 'org_client_2', name: 'Premier Realty Advisors', plan: 'business' },
    agentId: { _id: 'agent_sarah_1', name: 'Sarah', type: 'receptionist' },
    forwardToNumber: '+1 (555) 382-9011',
    callsThisMonth: 88,
    monthlyFee: 1.15,
  },
  {
    _id: 'pn_3',
    phoneNumber: '+1 (312) 429-8811',
    friendlyName: 'Patient Triage Line',
    provider: 'twilio',
    status: 'active',
    countryCode: 'US',
    organizationId: { _id: 'org_client_3', name: 'Sterling Health Clinics', plan: 'business' },
    agentId: { _id: 'agent_sarah_1', name: 'Sarah', type: 'receptionist' },
    forwardToNumber: '+1 (555) 912-4433',
    callsThisMonth: 145,
    monthlyFee: 1.15,
  },
  {
    _id: 'pn_4',
    phoneNumber: '+1 (415) 800-4123',
    friendlyName: 'Legal Intake Line',
    provider: 'twilio',
    status: 'active',
    countryCode: 'US',
    organizationId: { _id: 'org_client_4', name: 'Nexus Law Partners', plan: 'starter' },
    agentId: { _id: 'agent_sarah_1', name: 'Sarah', type: 'receptionist' },
    forwardToNumber: '+1 (555) 890-3412',
    callsThisMonth: 31,
    monthlyFee: 1.15,
  },
  {
    _id: 'pn_5',
    phoneNumber: '+1 (855) 833-2626',
    friendlyName: 'Master Carrier Trunk',
    provider: 'twilio',
    status: 'active',
    countryCode: 'US',
    organizationId: { _id: 'org_demo_1', name: 'Vedanco Master Agency', plan: 'enterprise' },
    agentId: { _id: 'agent_sarah_1', name: 'Sarah', type: 'receptionist' },
    forwardToNumber: '+1 (555) 789-0123',
    callsThisMonth: 288,
    monthlyFee: 2.50,
  },
];

export const MOCK_CAMPAIGNS = [
  {
    _id: 'camp_1',
    id: 'camp_1',
    name: '24/7 Primary Reception',
    type: 'inbound_reception',
    status: 'active',
    targetAudience: 'All inbound callers & inquiries',
    hours: 'Mon - Sun: 24/7 Priority',
    retries: 'Instant auto-answer',
    assignedAgent: 'Sarah (AI Receptionist)',
    metrics: { totalCalls: 24, qualifiedLeads: 6, appointmentsBooked: 3 },
  },
  {
    _id: 'camp_2',
    id: 'camp_2',
    name: 'After-Hours VIP Routing',
    type: 'outbound_followup',
    status: 'active',
    targetAudience: 'Missed calls & weekend inquiries',
    hours: 'Weekends & Evenings',
    retries: 'Instant SMS + Callback',
    assignedAgent: 'Sarah (AI Receptionist)',
    metrics: { totalCalls: 12, qualifiedLeads: 4, appointmentsBooked: 2 },
  },
];

export const MOCK_AUTOMATIONS = [
  {
    id: 'auto_1',
    name: 'New Lead Follow-up',
    trigger: 'lead_qualified',
    action: 'send_sms_followup',
    description: 'Sends instant personalized SMS and intro dossier within 60s of AI qualification.',
    isActive: true,
  },
  {
    id: 'auto_2',
    name: 'Appointment Reminder',
    trigger: 'appointment_booked',
    action: 'send_sms_reminder',
    description: 'Dispatches automated reminder text 24 hours and 1 hour before scheduled call.',
    isActive: true,
  },
  {
    id: 'auto_3',
    name: 'Missed Call Recovery',
    trigger: 'call_missed',
    action: 'send_sms_callback',
    description: 'Instantly texts callers when an inbound line drops: "Sorry we missed you!"',
    isActive: true,
  },
  {
    id: 'auto_4',
    name: 'AI Lead Qualification & Sync',
    trigger: 'call_completed',
    action: 'ai_lead_qualification',
    description: 'Runs real-time AI scoring (0-100), extracts budget/intent, and syncs dossier to CRM.',
    isActive: true,
  },
];

export const MOCK_INTEGRATIONS = [
  {
    serviceKey: 'openai',
    name: 'OpenAI GPT-4o',
    category: 'ai',
    isConnected: true,
    maskedCredentials: { apiKey: 'sk-••••••••4o' },
  },
  {
    serviceKey: 'vapi',
    name: 'Vapi Voice AI Engine',
    category: 'voice',
    isConnected: true,
    maskedCredentials: { apiKey: 'vap-••••••••live' },
  },
  {
    serviceKey: 'twilio',
    name: 'Twilio Carrier Trunk',
    category: 'voice',
    isConnected: true,
    maskedCredentials: { accountSid: 'AC••••••••2626' },
  },
  {
    serviceKey: 'google_calendar',
    name: 'Google Calendar Sync',
    category: 'calendar',
    isConnected: true,
    maskedCredentials: { account: 'voice.vedanco@gmail.com' },
  },
  {
    serviceKey: 'elevenlabs',
    name: 'ElevenLabs Voice Engine',
    category: 'voice',
    isConnected: true,
    maskedCredentials: { voiceId: '21m00Tcm4TlvDq8ikWAM (Sarah)' },
  },
];

export const MOCK_ANALYTICS = {
  metrics: {
    totalCalls: 24,
    answeredCalls: 22,
    missedCalls: 2,
    averageDurationSeconds: 152,
    leadsCount: 6,
    qualifiedLeads: 5,
    appointmentsBooked: 3,
    transfersCount: 1,
    aiResolutionRate: 92,
    bookingRate: 14,
    leadRate: 25,
    transferRate: 4,
    averageCallCost: 0.38,
    totalCost: 9.12,
  },
  charts: {
    activityChart: [
      { time: 'Oct 01', calls: 3, answered: 3, leads: 1 },
      { time: 'Oct 02', calls: 2, answered: 2, leads: 0 },
      { time: 'Oct 03', calls: 4, answered: 4, leads: 1 },
      { time: 'Oct 04', calls: 3, answered: 2, leads: 1 },
      { time: 'Oct 05', calls: 5, answered: 5, leads: 2 },
      { time: 'Oct 06', calls: 4, answered: 4, leads: 1 },
      { time: 'Oct 07', calls: 3, answered: 2, leads: 0 },
    ],
    intentData: [
      { name: 'Appointment Booking', value: 8 },
      { name: 'Service & Pricing', value: 7 },
      { name: 'Human Representative', value: 3 },
      { name: 'General Inquiries', value: 6 },
    ],
  },
};
