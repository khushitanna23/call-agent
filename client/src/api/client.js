import axios from 'axios';
import {
  registerLocalUser,
  loginLocalUser,
  MOCK_AGENT,
  MOCK_CALLS,
  MOCK_LEADS,
  MOCK_APPOINTMENTS,
  MOCK_ANALYTICS,
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
      minutesUsed: 142,
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
    if (method === 'post') {
      const newAppt = {
        _id: 'appt_' + Date.now(),
        ...bodyData,
        status: 'confirmed',
        scheduledAt: bodyData.scheduledAt || new Date().toISOString(),
      };
      return { success: true, data: newAppt, message: 'Appointment created successfully' };
    }
    if (method === 'put' || method === 'patch') {
      return { success: true, data: { ...MOCK_APPOINTMENTS[0], ...bodyData }, message: 'Appointment updated successfully' };
    }
    if (method === 'delete') {
      return { success: true, message: 'Appointment cancelled successfully' };
    }
    return { success: true, data: MOCK_APPOINTMENTS, total: MOCK_APPOINTMENTS.length };
  }

  // 11. Knowledge
  if (pathOnly.startsWith('/knowledge')) {
    if (pathOnly.includes('/search')) {
      return { success: true, results: [] };
    }
    if (pathOnly.includes('/upload')) {
      return { success: true, message: 'Document uploaded and indexed successfully' };
    }
    if (method === 'post') {
      return { success: true, message: 'Knowledge document added successfully' };
    }
    if (method === 'delete') {
      return { success: true, message: 'Knowledge document deleted successfully' };
    }
    return { success: true, data: [], items: [] };
  }

  // 12. Billing
  if (pathOnly.startsWith('/billing')) {
    if (pathOnly.includes('/change-plan')) {
      return { success: true, message: 'Plan updated successfully', plan: bodyData.plan || 'growth' };
    }
    return {
      success: true,
      plan: 'growth',
      minutesAllowance: 1000,
      minutesUsed: 142,
      invoices: [],
    };
  }

  // 13. Integrations
  if (pathOnly.startsWith('/integrations')) {
    if (method === 'post') {
      return { success: true, message: 'Integration connected successfully' };
    }
    if (method === 'delete') {
      return { success: true, message: 'Integration disconnected successfully' };
    }
    return { success: true, data: [] };
  }

  // 14. Demo
  if (pathOnly.startsWith('/demo')) {
    if (pathOnly.includes('/book')) {
      return { success: true, message: 'Demo booked successfully' };
    }
    if (pathOnly.includes('/voice-turn')) {
      return { success: true, reply: 'Thank you for reaching out to VEDANCO AI. How may I direct your call?' };
    }
    return { success: true, message: 'Demo session active' };
  }

  // 15. Admin
  if (pathOnly.startsWith('/admin')) {
    return {
      success: true,
      stats: { totalTenants: 12, totalCalls: 1280, activeAgents: 14, mrr: 12450 },
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
