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
    role: 'user',
    organizationId: 'org_demo_1',
    organization: {
      id: 'org_demo_1',
      _id: 'org_demo_1',
      name: 'Vedanco Demo',
      plan: 'growth',
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
    },
  },
  {
    id: 'usr_admin_1',
    _id: 'usr_admin_1',
    name: 'Super Admin',
    email: 'admin@vedanco.ai',
    password: 'adminpassword123',
    role: 'admin',
    organizationId: 'org_demo_1',
    organization: {
      id: 'org_demo_1',
      _id: 'org_demo_1',
      name: 'Vedanco Demo',
      plan: 'growth',
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
  const orgName = companyName?.trim() || `${userName}'s Company`;

  const newOrg = {
    id: orgId,
    _id: orgId,
    name: orgName,
    plan: 'growth',
    minutesAllowance: 1000,
    minutesUsed: 0,
    phoneNumbers: [
      {
        number: '+1 (800) 555-' + Math.floor(1000 + Math.random() * 9000),
        label: 'Primary Line',
        provider: 'demo',
        isActive: true,
      },
    ],
  };

  const newUser = {
    id: 'usr_' + Date.now(),
    _id: 'usr_' + Date.now(),
    name: userName,
    email: normEmail,
    password: password || 'password',
    role: normEmail.includes('admin') ? 'admin' : 'user',
    organizationId: orgId,
    organization: newOrg,
    createdAt: new Date().toISOString(),
  };

  // Upsert user into custom users
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
    // If not found in standalone mode, auto-register the account instantly
    return registerLocalUser(normEmail.split('@')[0], normEmail, password, `${normEmail.split('@')[0]}'s Workspace`);
  }

  // Update password if changed so user is never locked out
  if (password) {
    user.password = password;
    saveCustomUser(user);
  }

  const org = user.organization || {
    id: user.organizationId || 'org_demo_1',
    _id: user.organizationId || 'org_demo_1',
    name: `${user.name}'s Company`,
    plan: 'growth',
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
};

export const MOCK_CALLS = [
  {
    _id: 'call_1',
    callerName: 'Jessica Vance',
    callerNumber: '+1 (555) 382-9011',
    status: 'completed',
    direction: 'inbound',
    durationSeconds: 145,
    intent: 'AI Receptionist for Real Estate Team',
    aiScore: 94,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    summary: 'Caller inquired about 24/7 coverage for a 5-broker office. Lead qualified and calendar booking sent.',
  },
  {
    _id: 'call_2',
    callerName: 'Dr. Michael Chen',
    callerNumber: '+1 (555) 912-4433',
    status: 'completed',
    direction: 'inbound',
    durationSeconds: 210,
    intent: 'Patient Intake & Appointment Booking',
    aiScore: 98,
    createdAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    summary: 'Scheduled consultation for tomorrow morning. Sent confirmation SMS to patient.',
  },
  {
    _id: 'call_3',
    callerName: 'Robert Miller',
    callerNumber: '+1 (555) 472-8819',
    status: 'answered',
    direction: 'inbound',
    durationSeconds: 98,
    intent: 'Test Drive Scheduling & Service Hours',
    aiScore: 82,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    summary: 'Caller verified Saturday service hours and requested callback from service manager.',
  },
  {
    _id: 'call_4',
    callerName: 'Elena Rostova',
    callerNumber: '+1 (555) 604-1290',
    status: 'transferred',
    direction: 'inbound',
    durationSeconds: 312,
    intent: 'Hotel Concierge & Group Booking',
    aiScore: 91,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    summary: 'Group reservation query for 20 guests. Transferred to VIP reservations desk.',
  },
];

export const MOCK_LEADS = [
  {
    _id: 'lead_1',
    name: 'Jessica Vance',
    phone: '+1 (555) 382-9011',
    email: 'jessica@vanceproperties.com',
    company: 'Vance Real Estate Group',
    pipelineStage: 'QUALIFIED',
    aiScore: 94,
    intent: 'AI Receptionist for 5 Agent Team',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    _id: 'lead_2',
    name: 'Dr. Michael Chen',
    phone: '+1 (555) 912-4433',
    email: 'chen@summitwellness.org',
    company: 'Summit Wellness Clinic',
    pipelineStage: 'APPOINTMENT',
    aiScore: 98,
    intent: 'Patient Intake & Booking',
    createdAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
  },
  {
    _id: 'lead_3',
    name: 'Robert Miller',
    phone: '+1 (555) 472-8819',
    email: 'robert@millermotors.com',
    company: 'Miller Auto Dealership',
    pipelineStage: 'CONTACTED',
    aiScore: 82,
    intent: 'Test Drive Scheduling',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    _id: 'lead_4',
    name: 'Elena Rostova',
    phone: '+1 (555) 604-1290',
    email: 'elena@grandvistahotel.com',
    company: 'Grand Vista Resort & Spa',
    pipelineStage: 'PROPOSAL',
    aiScore: 91,
    intent: 'Hotel Concierge & Reservations',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
];

export const MOCK_APPOINTMENTS = [
  {
    _id: 'appt_1',
    title: 'Consultation with Dr. Michael Chen',
    customerName: 'Dr. Michael Chen',
    customerPhone: '+1 (555) 912-4433',
    status: 'confirmed',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    durationMinutes: 30,
  },
  {
    _id: 'appt_2',
    title: 'Platform Onboarding with Jessica Vance',
    customerName: 'Jessica Vance',
    customerPhone: '+1 (555) 382-9011',
    status: 'confirmed',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    durationMinutes: 45,
  },
];

export const MOCK_ANALYTICS = {
  metrics: {
    totalCalls: 38,
    answeredCalls: 36,
    missedCalls: 2,
    totalMinutes: 142,
    leadsCount: 29,
    leadRate: 62,
    appointmentsBooked: 14,
    avgScore: 88,
  },
  charts: {
    activityChart: [
      { date: 'Mon', calls: 5, leads: 3, appointments: 1 },
      { date: 'Tue', calls: 8, leads: 6, appointments: 3 },
      { date: 'Wed', calls: 7, leads: 5, appointments: 2 },
      { date: 'Thu', calls: 10, leads: 8, appointments: 4 },
      { date: 'Fri', calls: 8, leads: 7, appointments: 4 },
    ],
  },
};
