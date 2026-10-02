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

const api = axios.create({
  baseURL: '/api',
  timeout: 8000,
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

// Fallback dispatcher for when backend is offline, unreachable, or running on Vercel
function resolveOfflineFallback(config) {
  const url = (config.url || '').replace(/^\/api/, '');
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
  if (url === '/auth/login' && method === 'post') {
    return loginLocalUser(bodyData.email, bodyData.password);
  }

  // 2. Auth Register Fallback
  if (url === '/auth/register' && method === 'post') {
    return registerLocalUser(
      bodyData.name,
      bodyData.email,
      bodyData.password,
      bodyData.companyName
    );
  }

  // 3. Auth Me
  if (url === '/auth/me' && method === 'get') {
    const storedUser = localStorage.getItem('vedanco_user');
    const storedOrg = localStorage.getItem('vedanco_org');
    if (storedUser) {
      return {
        success: true,
        user: JSON.parse(storedUser),
        organization: storedOrg ? JSON.parse(storedOrg) : null,
      };
    }
    throw new Error('Not authenticated');
  }

  // 4. Analytics
  if (url.startsWith('/analytics')) {
    return { success: true, ...MOCK_ANALYTICS };
  }

  // 5. Agents
  if (url.startsWith('/agents')) {
    if (method === 'get') {
      return { success: true, data: [MOCK_AGENT] };
    }
    if (method === 'put' || method === 'post') {
      return { success: true, data: MOCK_AGENT, message: 'Agent updated successfully' };
    }
  }

  // 6. Calls
  if (url.startsWith('/calls')) {
    if (url.includes('/simulate')) {
      return { success: true, message: 'Simulated call completed successfully' };
    }
    return { success: true, data: MOCK_CALLS, total: MOCK_CALLS.length };
  }

  // 7. Leads
  if (url.startsWith('/leads')) {
    return { success: true, data: MOCK_LEADS, total: MOCK_LEADS.length };
  }

  // 8. Appointments
  if (url.startsWith('/appointments')) {
    return { success: true, data: MOCK_APPOINTMENTS, total: MOCK_APPOINTMENTS.length };
  }

  // 9. Knowledge
  if (url.startsWith('/knowledge')) {
    return { success: true, data: [], items: [] };
  }

  // 10. Billing
  if (url.startsWith('/billing')) {
    return {
      success: true,
      plan: 'growth',
      minutesAllowance: 1000,
      minutesUsed: 142,
      invoices: [],
    };
  }

  // 11. Admin
  if (url.startsWith('/admin')) {
    return {
      success: true,
      stats: { totalTenants: 12, totalCalls: 1280, activeAgents: 14, mrr: 12450 },
    };
  }

  return undefined;
}

// Response interceptor to handle errors globally and invoke offline fallback
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const config = error.config;
    const status = error.response?.status;

    // Check if error is because backend is not reachable, 404, 500, or Vercel function error
    const isNetworkOrServerError = !error.response || status >= 500 || status === 404;

    if (config && isNetworkOrServerError) {
      try {
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
      (typeof error.response?.data === 'string' ? error.response.data : null) ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject(new Error(errorMsg));
  }
);

export default api;
