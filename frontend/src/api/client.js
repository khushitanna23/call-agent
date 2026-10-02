import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized, clean up token and redirect to login if currently on protected route
      if (window.location.pathname.startsWith('/app') || window.location.pathname.startsWith('/admin')) {
        localStorage.removeItem('vedanco_token');
        localStorage.removeItem('vedanco_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
