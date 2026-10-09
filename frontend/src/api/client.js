import axios from 'axios';
import {
  registerLocalUser,
  loginLocalUser,
  MOCK_AGENT,
  MOCK_CALLS,
  MOCK_LEADS,
  MOCK_APPOINTMENTS,
  MOCK_ANALYTICS,
  MOCK_CLIENTS,
  MOCK_CAMPAIGNS,
  MOCK_PHONE_NUMBERS,
  MOCK_AUTOMATIONS,
  MOCK_INTEGRATIONS,
} from './mockData';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  timeout: 3500,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vedanco_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const orgId = localStorage.getItem('vedanco_org_id');
    if (orgId) {
      config.headers['x-organization-id'] = orgId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fallback dispatcher for when backend is offline, unreachable, or running on static hosting (e.g. Vercel)
function resolveOfflineFallback(config) {
  let url = (config.url || '').trim();
  // Strip protocol and domain if present
  url = url.replace(/^https?:\/\/[^\/]+/, '');
  // Strip /api or api/ prefix if present
  url = url.replace(/^\/?api(\/|$)/, '/');
  if (!url.startsWith('/')) {
    url = '/' + url;
  }
  // Strip query parameters for routing logic
  const pathOnly = url.split('?')[0];
  const method = (config.method || 'get').toLowerCase();

  let bodyData = {};
  if (config.data) {
    try {
      bodyData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    } catch {
      bodyData = {};
    }
  }

  // 1. Auth Login Fallback
  if (pathOnly === '/auth/login' && method === 'post') {
    return loginLocalUser(bodyData.email, bodyData.password);
  }

  // 2. Auth Register Fallback
  if (pathOnly === '/auth/register' && method === 'post') {
    return registerLocalUser(
      bodyData.name,
      bodyData.email,
      bodyData.password,
      bodyData.companyName
    );
  }

  // 3. Auth Me Fallback
  if (pathOnly === '/auth/me' && method === 'get') {
    const storedUser = localStorage.getItem('vedanco_user');
    const storedOrg = localStorage.getItem('vedanco_org');
    if (storedUser) {
      return {
        success: true,
        user: JSON.parse(storedUser),
        organization: storedOrg ? JSON.parse(storedOrg) : null,
      };
    }
    const defaultUser = {
      id: 'usr_demo_1',
      name: 'Alex Johnson',
      email: 'demo@vedanco.ai',
      role: 'user',
      organizationId: 'org_demo_1',
    };
    const defaultOrg = {
      id: 'org_demo_1',
      name: 'Vedanco Demo',
      plan: 'growth',
      minutesAllowance: 1000,
      minutesUsed: 0,
    };
    return {
      success: true,
      user: defaultUser,
      organization: defaultOrg,
    };
  }

  // 4. Auth Profile
  if (pathOnly === '/auth/profile' && (method === 'put' || method === 'patch')) {
    const storedUser = localStorage.getItem('vedanco_user');
    let u = storedUser ? JSON.parse(storedUser) : { name: bodyData.name || 'User' };
    if (bodyData.name) u.name = bodyData.name;
    localStorage.setItem('vedanco_user', JSON.stringify(u));
    return { success: true, message: 'Profile updated successfully', user: u };
  }

  // 5. Auth Password
  if (pathOnly === '/auth/password' && (method === 'put' || method === 'patch')) {
    return { success: true, message: 'Password updated successfully' };
  }

  // 6. Analytics
  if (pathOnly.startsWith('/analytics')) {
    return { success: true, ...MOCK_ANALYTICS };
  }

  // 7. Agents
  if (pathOnly.startsWith('/agents')) {
    if (pathOnly.includes('/sandbox/test')) {
      return { success: true, reply: 'Hello! I am Sarah, your AI Receptionist. How can I assist you today?' };
    }
    if (pathOnly.includes('/scrape-website')) {
      return { success: true, summary: 'Business information extracted successfully.', facts: [] };
    }
    if (method === 'get') {
      return { success: true, data: [MOCK_AGENT] };
    }
    if (method === 'put' || method === 'post' || method === 'patch') {
      return { success: true, data: { ...MOCK_AGENT, ...bodyData }, message: 'Agent saved successfully' };
    }
    if (method === 'delete') {
      return { success: true, message: 'Agent deleted successfully' };
    }
  }

  // 8. Calls
  if (pathOnly.startsWith('/calls')) {
    if (pathOnly.includes('/simulate')) {
      return { success: true, message: 'Simulated call completed successfully' };
    }
    if (pathOnly.includes('/transfer')) {
      return { success: true, message: 'Call transferred successfully' };
    }
    if (method === 'get' && pathOnly !== '/calls') {
      return { success: true, data: MOCK_CALLS[0] };
    }
    return { success: true, data: MOCK_CALLS, total: MOCK_CALLS.length };
  }

  // 9. Leads
  if (pathOnly.startsWith('/leads')) {
    if (pathOnly.includes('/activity')) {
      return { success: true, message: 'Activity recorded successfully' };
    }
    if (method === 'post') {
      const newLead = {
        _id: 'lead_' + Date.now(),
        ...bodyData,
        createdAt: new Date().toISOString(),
      };
      return { success: true, data: newLead, message: 'Lead created successfully' };
    }
    if (method === 'put' || method === 'patch') {
      return { success: true, data: { ...MOCK_LEADS[0], ...bodyData }, message: 'Lead updated successfully' };
    }
    if (method === 'get' && pathOnly !== '/leads') {
      return { success: true, data: MOCK_LEADS[0] };
    }
    return { success: true, data: MOCK_LEADS, total: MOCK_LEADS.length };
  }

  // 10. Appointments
  if (pathOnly.startsWith('/appointments')) {
    // 10a. Public Agents for booking
    if (pathOnly.includes('/public/agents')) {
      return {
        success: true,
        count: 4,
        data: [
          {
            _id: 'agent_sarah_re',
            name: 'Sarah',
            type: 'receptionist',
            industry: 'Real Estate & Property',
            roleTitle: 'Real Estate & Showing Specialist',
            description: 'Expert in scheduling property showings, pre-qualifying prospective buyers, and handling commercial leasing inquiries 24/7.',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
            rating: 4.98,
            reviewsCount: 342,
            serviceType: 'Property Inquiry & Showing Consultation',
            durationMinutes: 30,
            voiceStyle: 'Warm, articulate, and executive',
            responseTime: '< 1 second',
            tags: ['Real Estate', 'Buyer Qualification', 'Open Houses'],
            status: 'ONLINE',
            phoneNumber: '+1 (800) 555-0199',
          },
          {
            _id: 'agent_maya_health',
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
            status: 'ONLINE',
            phoneNumber: '+1 (800) 555-0199',
          },
          {
            _id: 'agent_david_corp',
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
            status: 'ONLINE',
            phoneNumber: '+1 (800) 555-0199',
          },
          {
            _id: 'agent_elena_dispatch',
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
            status: 'ONLINE',
            phoneNumber: '+1 (800) 555-0199',
          },
        ],
      };
    }

    // 10b. Public available slots
    if (pathOnly.includes('/public/available-slots')) {
      const date = config.params?.date || new Date().toISOString().split('T')[0];
      const masterTimes = [
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
        '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
      ];
      const bookedSet = new Set(['11:00 AM', '02:30 PM']);
      const slots = masterTimes.map((t, i) => {
        const isBooked = bookedSet.has(t);
        const period = t.includes('AM') ? 'morning' : (parseInt(t) >= 4 ? 'evening' : 'afternoon');
        return {
          timeSlot: t,
          time24: '10:00',
          period,
          durationMinutes: 30,
          isAvailable: !isBooked,
          reason: isBooked ? 'Already Booked' : null,
        };
      });
      return {
        success: true,
        data: {
          date,
          totalSlots: slots.length,
          availableCount: slots.filter((s) => s.isAvailable).length,
          isFullyBooked: false,
          slots,
        },
      };
    }

    // 10c. Public month availability
    if (pathOnly.includes('/public/month-availability')) {
      const days = {};
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const todayStr = today.toISOString().split('T')[0];

      for (let d = 1; d <= daysInMonth; d++) {
        const dStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isPast = dStr < todayStr;
        const dayDate = new Date(`${dStr}T00:00:00`);
        const isSunday = dayDate.getDay() === 0;
        days[dStr] = {
          date: dStr,
          day: d,
          isPast,
          isSunday,
          bookedCount: isPast ? 16 : (d === 15 ? 16 : 3),
          availableSlots: isPast || isSunday ? 0 : (d === 15 ? 0 : 13),
          isFullyBooked: d === 15,
          isSelectable: !isPast && !isSunday && d !== 15,
        };
      }
      return {
        success: true,
        data: { year: currentYear, month: currentMonth, daysInMonth, days },
      };
    }

    // 10d. Public Book appointment
    if (pathOnly.includes('/public/book')) {
      const refId = 'VED-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        (bodyData.serviceType || 'Consultation') + ' with ' + bodyData.customerName
      )}&dates=20261010T100000Z/20261010T103000Z&details=${encodeURIComponent(
        'AI Specialist call to ' + bodyData.customerPhone
      )}`;
      const newAppt = {
        bookingReference: refId,
        appointmentId: 'appt_' + Date.now(),
        date: bodyData.date,
        timeSlot: bodyData.timeSlot,
        customerName: bodyData.customerName,
        customerPhone: bodyData.customerPhone,
        customerEmail: bodyData.customerEmail,
        serviceType: bodyData.serviceType || 'Discovery Consultation',
        requirement: bodyData.requirement,
        durationMinutes: 30,
        status: 'scheduled',
        agent: {
          name: 'Sarah',
          roleTitle: 'Real Estate & Showing Specialist',
          phoneNumber: '+1 (800) 555-0199',
        },
        googleCalendar: {
          status: 'synced',
          eventId: 'gcal_' + Date.now(),
          addEventUrl: gcalUrl,
        },
        notification: {
          emailSent: true,
          smsSent: true,
        },
      };
      return {
        success: true,
        message: 'Appointment successfully scheduled and synchronized with Google Calendar!',
        data: newAppt,
      };
    }

    // 10e. Lookup appointment
    if (pathOnly.includes('/public/lookup/')) {
      return {
        success: true,
        data: {
          appointment: {
            bookingReference: 'VED-A8K492',
            customerName: 'Alex Mercer',
            customerPhone: '+1 (555) 749-3921',
            customerEmail: 'alex.mercer@example.com',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            timeSlot: '02:00 PM',
            serviceType: 'Property Showing & Buyer Consultation',
            status: 'scheduled',
            requirement: 'Inquiring regarding commercial leasing opportunities',
            agentId: {
              name: 'Sarah',
              roleTitle: 'Real Estate Specialist',
              phoneNumber: '+1 (800) 555-0199',
            },
            googleCalendarStatus: 'synced',
          },
          transcript: null,
        },
      };
    }

    // 10f. Trigger instant call
    if (pathOnly.includes('/trigger-call')) {
      return {
        success: true,
        message: 'Outbound AI call completed! AI Agent Sarah dialed caller and updated CRM records.',
        data: {
          call: { status: 'completed', durationSeconds: 165 },
          transcript: [
            { speaker: 'ai', text: 'Hello! This is Sarah calling from Vedanco AI for your scheduled appointment.', timestamp: '00:02' },
            { speaker: 'caller', text: 'Hi Sarah! Thanks for calling on time.', timestamp: '00:07' },
          ],
        },
      };
    }

    // 10g. Reschedule / Cancel public
    if (pathOnly.includes('/public/reschedule/')) {
      return {
        success: true,
        message: `Appointment successfully rescheduled to ${bodyData.newDate} at ${bodyData.newTimeSlot}`,
      };
    }
    if (pathOnly.includes('/public/cancel/')) {
      return {
        success: true,
        message: 'Appointment has been cancelled successfully.',
      };
    }

    // Dashboard appointments handlers
    if (method === 'post') {
      const newAppt = {
        _id: 'appt_' + Date.now(),
        bookingReference: 'VED-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        date: bodyData.date || new Date().toISOString().split('T')[0],
        timeSlot: bodyData.timeSlot || '10:30 AM',
        customerName: bodyData.customerName || 'Client',
        customerPhone: bodyData.customerPhone || bodyData.phone || '',
        customerEmail: bodyData.customerEmail || bodyData.email || '',
        type: bodyData.type || bodyData.appointmentType || 'Discovery Call',
        ...bodyData,
        status: 'scheduled',
      };
      try {
        const stored = JSON.parse(localStorage.getItem('vedanco_custom_appts') || '[]');
        stored.unshift(newAppt);
        localStorage.setItem('vedanco_custom_appts', JSON.stringify(stored));
      } catch (e) {}
      return { success: true, data: newAppt, message: 'Appointment created successfully' };
    }
    if (method === 'put' || method === 'patch') {
      return { success: true, data: { ...MOCK_APPOINTMENTS[0], ...bodyData }, message: 'Appointment updated successfully' };
    }
    if (method === 'delete') {
      return { success: true, message: 'Appointment cancelled successfully' };
    }
    try {
      const stored = JSON.parse(localStorage.getItem('vedanco_custom_appts') || '[]');
      const upcoming = stored.filter((a) => a.status === 'scheduled' || a.status === 'confirmed');
      return {
        success: true,
        data: stored,
        counts: {
          total: stored.length,
          upcoming: upcoming.length,
          past: stored.filter((a) => a.status === 'completed').length,
          cancelled: stored.filter((a) => a.status === 'cancelled').length,
        },
        total: stored.length,
      };
    } catch (e) {
      return { success: true, data: [], total: 0 };
    }
  }

  // 11. Knowledge
  if (pathOnly.startsWith('/knowledge')) {
    const storageKey = 'vedanco_knowledge_documents';
    const defaultDocuments = [];

    const readDocuments = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (Array.isArray(stored)) return stored;
      } catch {
        // Fallback when local data is malformed.
      }
      localStorage.setItem(storageKey, JSON.stringify(defaultDocuments));
      return defaultDocuments;
    };

    const writeDocuments = (documents) => {
      localStorage.setItem(storageKey, JSON.stringify(documents));
      return documents;
    };

    if (pathOnly.includes('/search')) {
      const query = String(bodyData.query || '').trim().toLowerCase();
      const terms = query.split(/\s+/).filter((term) => term.length > 2);
      const agentId = bodyData.agentId || 'agent_sarah_1';
      const results = readDocuments()
        .filter((document) => document.agentId === agentId)
        .filter((document) => {
          const haystack = `${document.title} ${document.content} ${document.source || ''}`.toLowerCase();
          return terms.length > 0 && terms.some((term) => haystack.includes(term));
        })
        .slice(0, 5)
        .map((document, index) => ({
          documentId: document._id,
          chunkIndex: index,
          content: document.content,
          metadata: { title: document.title, type: document.type, source: document.source },
        }));
      return { success: true, count: results.length, query, results };
    }
    if (pathOnly.includes('/upload')) {
      const file = config.data?.get?.('file');
      const title = config.data?.get?.('title') || file?.name || 'Uploaded document';
      const now = new Date().toISOString();
      const document = {
        _id: `knowledge_${Date.now()}`,
        agentId: config.data?.get?.('agentId') || 'agent_sarah_1',
        type: config.data?.get?.('type') || 'document',
        title,
        content: `Uploaded ${file?.name || title}. Add the production API to extract PDF or DOCX text automatically.`,
        source: file?.name || title,
        fileType: file?.name?.split('.').pop()?.toLowerCase() || 'text',
        fileSize: file?.size || 0,
        status: 'ready',
        chunksCount: 1,
        createdAt: now,
        updatedAt: now,
      };
      writeDocuments([document, ...readDocuments()]);
      return { success: true, message: 'Document uploaded and indexed successfully', data: document };
    }
    if (method === 'post') {
      const now = new Date().toISOString();
      const document = {
        _id: `knowledge_${Date.now()}`,
        ...bodyData,
        source: bodyData.source || 'manual',
        status: 'ready',
        chunksCount: Math.max(1, Math.ceil(String(bodyData.content || '').length / 500)),
        createdAt: now,
        updatedAt: now,
      };
      writeDocuments([document, ...readDocuments()]);
      return { success: true, message: 'Knowledge document added successfully', data: document };
    }
    if (method === 'delete') {
      writeDocuments(readDocuments().filter((document) => document._id !== pathOnly.split('/').pop()));
      return { success: true, message: 'Knowledge document deleted successfully' };
    }
    const type = new URLSearchParams(url.split('?')[1] || '').get('type');
    const documents = readDocuments().filter((document) => !type || type === 'all' || document.type === type);
    const agentId = new URLSearchParams(url.split('?')[1] || '').get('agentId') || 'agent_sarah_1';
    const scopedDocuments = documents.filter((document) => document.agentId === agentId);
    return {
      success: true,
      count: scopedDocuments.length,
      totalChunks: scopedDocuments.reduce((total, document) => total + (document.chunksCount || 1), 0),
      stats: scopedDocuments.reduce((stats, document) => ({ ...stats, [document.type]: (stats[document.type] || 0) + 1, total: scopedDocuments.length }), {}),
      data: scopedDocuments,
      items: scopedDocuments,
    };
  }

  // 12. Phone Numbers
  if (pathOnly.startsWith('/phone-numbers') || pathOnly.startsWith('/telephony')) {
    if (method === 'post') {
      const newNum = {
        _id: 'pn_' + Date.now(),
        phoneNumber: bodyData.phoneNumber || '+1 (800) 555-9999',
        friendlyName: bodyData.friendlyName || 'Direct Line',
        provider: bodyData.provider || 'demo',
        status: 'active',
        countryCode: 'US',
        organizationId: { name: 'Client Workspace' },
        forwardToNumber: bodyData.forwardToNumber || '+1 (555) 789-0123',
        callsThisMonth: 0,
      };
      return { success: true, message: 'Phone number provisioned successfully', data: newNum };
    }
    if (method === 'put' || method === 'patch') {
      return { success: true, message: 'Phone number updated successfully' };
    }
    return { success: true, count: MOCK_PHONE_NUMBERS.length, data: MOCK_PHONE_NUMBERS };
  }

  // 13. Campaigns
  if (pathOnly.startsWith('/campaigns')) {
    if (method === 'post') {
      const newCamp = {
        _id: 'camp_' + Date.now(),
        id: 'camp_' + Date.now(),
        name: bodyData.name || 'Inbound Reception Campaign',
        type: bodyData.type || 'inbound_reception',
        status: 'active',
        targetAudience: bodyData.targetAudience || 'All Inbound Calls',
        hours: bodyData.hours || '24/7 Priority',
        retries: 'Instant auto-answer',
        assignedAgent: bodyData.assignedAgent || 'Sarah (AI Receptionist)',
        metrics: { totalCalls: 0, qualifiedLeads: 0, appointmentsBooked: 0 },
      };
      return { success: true, message: 'Campaign created successfully', data: newCamp };
    }
    if (method === 'put' || method === 'patch') {
      return { success: true, message: 'Campaign updated successfully' };
    }
    return { success: true, count: MOCK_CAMPAIGNS.length, data: MOCK_CAMPAIGNS };
  }

  // 14. Automations
  if (pathOnly.startsWith('/automations')) {
    if (method === 'post') {
      const newAuto = {
        id: 'auto_' + Date.now(),
        name: bodyData.name || 'New Lead Alert',
        trigger: bodyData.trigger || 'lead_qualified',
        action: bodyData.action || 'send_sms_followup',
        description: bodyData.description || 'Automated trigger rule',
        isActive: true,
      };
      return { success: true, message: 'Automation created successfully', data: newAuto };
    }
    if (method === 'put' || method === 'patch') {
      return { success: true, message: 'Automation updated successfully' };
    }
    return { success: true, data: MOCK_AUTOMATIONS };
  }

  // 15. Integrations
  if (pathOnly.startsWith('/integrations')) {
    if (method === 'post') {
      return { success: true, message: 'Integration connected successfully' };
    }
    if (method === 'delete') {
      return { success: true, message: 'Integration disconnected successfully' };
    }
    return { success: true, data: MOCK_INTEGRATIONS };
  }

  // 16. Billing
  if (pathOnly.startsWith('/billing')) {
    if (pathOnly.includes('/change-plan')) {
      return { success: true, message: 'Plan updated successfully', plan: bodyData.plan || 'growth' };
    }
    return {
      success: true,
      plan: 'growth',
      minutesAllowance: 1000,
      minutesUsed: 142,
      invoices: [
        {
          _id: 'inv_1',
          invoiceNumber: 'INV-2026-001',
          amount: 249,
          currency: 'USD',
          status: 'paid',
          paidAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          description: 'Growth Plan Subscription - 1,000 Voice Minutes',
        },
        {
          _id: 'inv_2',
          invoiceNumber: 'INV-2026-002',
          amount: 249,
          currency: 'USD',
          status: 'paid',
          paidAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          description: 'Growth Plan Monthly Renewal',
        },
      ],
      currentPlan: {
        id: 'growth',
        name: 'Growth',
        price: 249,
        billingCycle: 'monthly',
        renewalDate: 'Nov 01, 2026',
      },
      usageMeter: {
        minutesUsed: 142,
        minutesAllowance: 1000,
        minutesRemaining: 858,
      },
    };
  }

  // 17. Demo
  if (pathOnly.startsWith('/demo')) {
    if (pathOnly.includes('/book')) {
      return { success: true, message: 'Demo booked successfully' };
    }
    if (pathOnly.includes('/voice-turn')) {
      return { success: true, reply: 'Thank you for reaching out to VEDANCO AI. How may I direct your call?' };
    }
    return { success: true, message: 'Demo session active' };
  }

  // 18. Clients & Client Management
  if (pathOnly.startsWith('/clients') || pathOnly.startsWith('/admin/clients')) {
    if (pathOnly.includes('/toggle-status')) {
      return { success: true, message: 'Client status updated successfully', status: 'active' };
    }
    if (method === 'post') {
      const newClient = {
        id: 'org_' + Date.now(),
        _id: 'org_' + Date.now(),
        name: bodyData.name || 'New Client Company',
        slug: (bodyData.name || 'client').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        plan: (bodyData.plan || 'growth').toUpperCase(),
        status: 'active',
        minutesUsed: 0,
        minutesAllowance: Number(bodyData.minutesAllowance) || 1000,
        agentCount: 1,
        callCount: 0,
        leadCount: 0,
        appointmentCount: 0,
        campaignCount: 1,
        createdAt: new Date().toISOString(),
        joinedDate: 'Just now',
        owner: {
          name: bodyData.ownerName || 'Account Owner',
          email: bodyData.ownerEmail || 'client@example.com',
        },
        phoneNumbers: [
          { number: '+1 (800) 555-' + Math.floor(1000 + Math.random() * 9000), label: 'Primary Line', isActive: true, provider: 'demo' },
        ],
      };
      return { success: true, message: 'Client provisioned successfully!', data: newClient };
    }
    if (method === 'put' || method === 'patch') {
      return { success: true, message: 'Client details updated successfully' };
    }
    if (method === 'get' && (pathOnly.match(/\/clients\/[^\/]+$/) || pathOnly.match(/\/admin\/clients\/[^\/]+$/))) {
      const clientId = pathOnly.split('/').pop();
      const match = MOCK_CLIENTS.find((c) => c.id === clientId || c._id === clientId) || MOCK_CLIENTS[0];
      return {
        success: true,
        data: {
          organization: match,
          owner: match.owner,
          agents: [MOCK_AGENT],
          recentCalls: MOCK_CALLS.slice(0, 5),
          recentLeads: MOCK_LEADS.slice(0, 5),
          stats: {
            agentCount: match.agentCount,
            callCount: match.callCount,
            leadCount: match.leadCount,
            appointmentCount: match.appointmentCount,
            minutesUsed: match.minutesUsed,
            minutesAllowance: match.minutesAllowance,
          },
        },
      };
    }
    return { success: true, count: MOCK_CLIENTS.length, data: MOCK_CLIENTS };
  }

  // 19. Admin Platform Control
  if (pathOnly.startsWith('/admin')) {
    if (pathOnly.includes('/appointments')) {
      return { success: true, count: MOCK_APPOINTMENTS.length, data: MOCK_APPOINTMENTS };
    }
    if (pathOnly.includes('/metrics')) {
      return {
        success: true,
        data: {
          mrr: 12450,
          customers: MOCK_CLIENTS.length,
          activeSubscriptions: MOCK_CLIENTS.filter((c) => c.status === 'active').length,
          calls: 288,
          minutes: 1707,
          aiCost: 68.28,
          revenue: 12450,
          grossMargin: 99.4,
          churn: '0.0%',
          systemHealth: {
            uptime: '99.98%',
            latencyMs: 32,
            apiStatus: 'healthy',
            voicePipeline: 'operational',
          },
        },
      };
    }
    if (pathOnly.includes('/calls')) {
      return { success: true, count: MOCK_CALLS.length, data: MOCK_CALLS };
    }
    if (pathOnly.includes('/leads')) {
      return { success: true, count: MOCK_LEADS.length, data: MOCK_LEADS };
    }
    if (pathOnly.includes('/agents')) {
      return { success: true, count: 1, data: [MOCK_AGENT] };
    }
    if (pathOnly.includes('/error-logs')) {
      return {
        success: true,
        count: 3,
        data: [
          { id: 'LOG-01', service: 'VoiceGateway', message: 'Carrier trunk latency nominal (28ms)', timestamp: new Date(Date.now() - 15 * 60000), severity: 'info' },
          { id: 'LOG-02', service: 'CalendarSync', message: 'Google Calendar OAuth token renewed', timestamp: new Date(Date.now() - 45 * 60000), severity: 'info' },
          { id: 'LOG-03', service: 'SpeechTTS', message: 'ElevenLabs voice stream verified', timestamp: new Date(Date.now() - 120 * 60000), severity: 'info' },
        ],
      };
    }
    return {
      success: true,
      stats: { totalTenants: MOCK_CLIENTS.length, totalCalls: 288, activeAgents: 4, mrr: 12450 },
      data: MOCK_CLIENTS,
    };
  }

  return {
    success: true,
    message: 'Operation completed successfully',
    data: {},
  };
}

// Response interceptor to handle errors globally and invoke offline fallback
api.interceptors.response.use(
  (response) => {
    // If the server returned an HTML document (for instance, SPA rewrite of /api/* to /index.html)
    if (
      typeof response.data === 'string' &&
      (response.data.includes('<!DOCTYPE html') ||
        response.data.includes('<html') ||
        response.headers?.['content-type']?.includes('text/html'))
    ) {
      console.warn('[API Client] Server returned HTML document for API route. Using offline fallback.');
      const fallback = resolveOfflineFallback(response.config);
      if (fallback !== undefined) {
        return fallback;
      }
    }
    return response.data;
  },
  (error) => {
    const config = error.config;
    const status = error.response?.status;

    // Check if error is because backend is not reachable, 404, 405, 500+, or network/timeout error
    const isNetworkOrServerError =
      !error.response ||
      status >= 500 ||
      status === 404 ||
      status === 405 ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network Error');

    if (config && isNetworkOrServerError) {
      try {
        console.warn(`[API Client] Network or server error (${status || error.code || 'offline'}). Using offline fallback.`);
        const fallback = resolveOfflineFallback(config);
        if (fallback !== undefined) {
          return Promise.resolve(fallback);
        }
      } catch (fallbackError) {
        return Promise.reject(fallbackError);
      }
    }

    const storedToken = localStorage.getItem('vedanco_token');
    const isLocalDemoToken = storedToken?.startsWith('vedanco_jwt_');
    if (status === 401 && isLocalDemoToken && config) {
      const fallback = resolveOfflineFallback(config);
      if (fallback !== undefined) {
        return Promise.resolve(fallback);
      }
    }

    if (status === 401) {
      if (
        window.location.pathname.startsWith('/app') ||
        window.location.pathname.startsWith('/admin')
      ) {
        localStorage.removeItem('vedanco_token');
        localStorage.removeItem('vedanco_user');
        window.location.href = '/login';
      }
    }

    const errorMsg =
      error.response?.data?.message ||
      (typeof error.response?.data === 'string' && !error.response.data.includes('<html') ? error.response.data : null) ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject(new Error(errorMsg));
  }
);

export default api;
