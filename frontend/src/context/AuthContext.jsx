import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { loginLocalUser, registerLocalUser } from '../api/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vedanco_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('vedanco_token');
      const storedUser = localStorage.getItem('vedanco_user');
      const storedOrg = localStorage.getItem('vedanco_org');

      if (storedToken && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          if (storedOrg && storedOrg !== 'undefined' && storedOrg !== 'null') {
            setOrganization(JSON.parse(storedOrg));
          }

          const res = await api.get('/auth/me');
          if (res?.success && res.user) {
            setUser(res.user);
            if (res.organization) {
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
      console.warn('[AuthContext] Backend login request failed, resolving via local engine:', err);
    }

    // Fail-safe client resolution so login never fails on Vercel or offline
    const fallbackRes = loginLocalUser(email, password);
    if (fallbackRes?.success && fallbackRes.user) {
      setToken(fallbackRes.token);
      setUser(fallbackRes.user);
      setOrganization(fallbackRes.organization);
      return fallbackRes;
    }

    throw new Error('Invalid email or password');
  };

  const register = async (name, email, password, companyName) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, companyName });
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
      console.warn('[AuthContext] Backend register request failed, resolving via local engine:', err);
    }

    // Fail-safe client resolution so register never fails on Vercel or offline
    const fallbackRes = registerLocalUser(name, email, password, companyName);
    if (fallbackRes?.success && fallbackRes.user) {
      setToken(fallbackRes.token);
      setUser(fallbackRes.user);
      setOrganization(fallbackRes.organization);
      return fallbackRes;
    }

    throw new Error('Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('vedanco_token');
    localStorage.removeItem('vedanco_user');
    localStorage.removeItem('vedanco_org');
    localStorage.removeItem('vedanco_org_id');
    setToken(null);
    setUser(null);
    setOrganization(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res?.success) {
        setUser(res.user);
        setOrganization(res.organization);
      }
    } catch (err) {
      console.warn('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
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
