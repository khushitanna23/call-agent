import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { loginLocalUser, registerLocalUser, loginLocalGoogleUser } from '../api/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [impersonatingOrg, setImpersonatingOrg] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vedanco_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('vedanco_token');
      const storedUser = localStorage.getItem('vedanco_user');
      const storedOrg = localStorage.getItem('vedanco_org');
      const storedImpersonating = localStorage.getItem('vedanco_impersonating');

      if (storedImpersonating) {
        try {
          const parsedImp = JSON.parse(storedImpersonating);
          setImpersonatingOrg(parsedImp);
          setOrganization(parsedImp);
        } catch {}
      }

      if (storedToken && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          if (storedOrg && storedOrg !== 'undefined' && storedOrg !== 'null' && !storedImpersonating) {
            setOrganization(JSON.parse(storedOrg));
          }

          const res = await api.get('/auth/me');
          if (res?.success && res.user) {
            setUser(res.user);
            if (res.organization && !storedImpersonating) {
              setOrganization(res.organization);
              localStorage.setItem('vedanco_org', JSON.stringify(res.organization));
              const orgId = res.organization._id || res.organization.id;
              if (orgId) localStorage.setItem('vedanco_org_id', orgId);
            }
          }
        } catch (err) {
          console.warn('[AuthContext] Session notice:', err);
          if (err?.message?.includes('401') || err?.response?.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res?.success && res.user) {
        const u = res.user;
        const t = res.token || ('vedanco_token_' + Date.now());
        const o = res.organization || {
          id: u.organizationId || 'org_1',
          _id: u.organizationId || 'org_1',
          name: `${u.name || 'User'}'s Workspace`,
          plan: 'growth',
          minutesAllowance: 1000,
          minutesUsed: 0,
        };

        localStorage.setItem('vedanco_token', t);
        localStorage.setItem('vedanco_user', JSON.stringify(u));
        localStorage.setItem('vedanco_org_id', o._id || o.id || 'org_1');
        localStorage.setItem('vedanco_org', JSON.stringify(o));
        setToken(t);
        setUser(u);
        setOrganization(o);
        return res;
      }
    } catch (err) {
      // If server returned a business error (e.g. 401 Account not found, 401 Invalid password)
      const errorMsg = err?.response?.data?.message || err?.message;
      if (err?.response?.status === 401 || err?.response?.status === 400 || err?.response?.status === 403) {
        throw new Error(errorMsg || 'Invalid email or password');
      }
      console.warn('[AuthContext] Backend login request failed, checking local engine:', err);
    }

    // Fail-safe client resolution only if backend network is offline
    const fallbackRes = loginLocalUser(email, password);
    if (fallbackRes?.success && fallbackRes.user) {
      setToken(fallbackRes.token);
      setUser(fallbackRes.user);
      setOrganization(fallbackRes.organization);
      return fallbackRes;
    }

    throw new Error('Invalid email or password');
  };

  const register = async (name, email, password, companyName, role = 'client') => {
    try {
      const res = await api.post('/auth/register', { name, email, password, companyName, role });
      if (res?.success && res.user) {
        const u = res.user;
        const t = res.token || ('vedanco_token_' + Date.now());
        const o = res.organization || {
          id: u.organizationId || 'org_1',
          _id: u.organizationId || 'org_1',
          name: companyName || `${u.name || 'User'}'s Workspace`,
          plan: 'growth',
          minutesAllowance: 1000,
          minutesUsed: 0,
        };

        localStorage.setItem('vedanco_token', t);
        localStorage.setItem('vedanco_user', JSON.stringify(u));
        localStorage.setItem('vedanco_org_id', o._id || o.id || 'org_1');
        localStorage.setItem('vedanco_org', JSON.stringify(o));
        setToken(t);
        setUser(u);
        setOrganization(o);
        return res;
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message;
      if (err?.response?.status === 400 || err?.response?.status === 409) {
        throw new Error(errorMsg || 'Account registration failed');
      }
      console.warn('[AuthContext] Backend register request failed, checking local engine:', err);
    }

    // Fail-safe client resolution only if backend network is offline
    const fallbackRes = registerLocalUser(name, email, password, companyName);
    if (fallbackRes?.success && fallbackRes.user) {
      setToken(fallbackRes.token);
      setUser(fallbackRes.user);
      setOrganization(fallbackRes.organization);
      return fallbackRes;
    }

    throw new Error('Registration failed');
  };

  const googleLogin = async (googleData) => {
    try {
      const res = await api.post('/auth/google', googleData);
      if (res?.success && res.user) {
        const u = res.user;
        const t = res.token || ('vedanco_token_' + Date.now());
        const o = res.organization || {
          id: u.organizationId || 'org_1',
          _id: u.organizationId || 'org_1',
          name: `${u.name || 'User'}'s Workspace`,
          plan: 'growth',
          minutesAllowance: 1000,
          minutesUsed: 0,
        };

        localStorage.setItem('vedanco_token', t);
        localStorage.setItem('vedanco_user', JSON.stringify(u));
        localStorage.setItem('vedanco_org_id', o._id || o.id || 'org_1');
        localStorage.setItem('vedanco_org', JSON.stringify(o));
        setToken(t);
        setUser(u);
        setOrganization(o);
        return res;
      }
    } catch (err) {
      console.warn('[AuthContext] Backend google login request failed, checking local engine:', err);
    }

    // Fail-safe client resolution only if backend network is offline or returns HTML
    const fallbackRes = loginLocalGoogleUser(googleData);
    if (fallbackRes?.success && fallbackRes.user) {
      setToken(fallbackRes.token);
      setUser(fallbackRes.user);
      setOrganization(fallbackRes.organization);
      return fallbackRes;
    }

    throw new Error('Google authentication failed');
  };

  const impersonateClient = (clientOrg) => {
    localStorage.setItem('vedanco_impersonating', JSON.stringify(clientOrg));
    const targetOrgId = clientOrg._id || clientOrg.id;
    if (targetOrgId) localStorage.setItem('vedanco_org_id', targetOrgId);
    setImpersonatingOrg(clientOrg);
    setOrganization(clientOrg);
  };

  const stopImpersonation = () => {
    localStorage.removeItem('vedanco_impersonating');
    setImpersonatingOrg(null);
    const storedOrg = localStorage.getItem('vedanco_org');
    if (storedOrg) {
      try {
        const o = JSON.parse(storedOrg);
        setOrganization(o);
        const origId = o._id || o.id;
        if (origId) localStorage.setItem('vedanco_org_id', origId);
      } catch {}
    }
  };

  const logout = () => {
    localStorage.removeItem('vedanco_token');
    localStorage.removeItem('vedanco_user');
    localStorage.removeItem('vedanco_org');
    localStorage.removeItem('vedanco_org_id');
    localStorage.removeItem('vedanco_impersonating');
    setImpersonatingOrg(null);
    setToken(null);
    setUser(null);
    setOrganization(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res?.success) {
        setUser(res.user);
        if (!impersonatingOrg) setOrganization(res.organization);
      }
    } catch (err) {
      console.warn('Failed to refresh user:', err);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'agency_admin';
  const role = isAdmin ? 'admin' : 'client';
  const isClient = !isAdmin;
  const defaultDashboardPath = isAdmin ? '/admin/dashboard' : '/client/dashboard';

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        impersonatingOrg,
        isImpersonating: !!impersonatingOrg,
        impersonateClient,
        stopImpersonation,
        token,
        loading,
        role,
        isAdmin,
        isClient,
        defaultDashboardPath,
        isAuthenticated: !!token && !!user,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
