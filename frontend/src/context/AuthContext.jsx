import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

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

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          if (storedOrg) {
            setOrganization(JSON.parse(storedOrg));
          }

          const res = await api.get('/auth/me');
          if (res?.success) {
            setUser(res.user);
            setOrganization(res.organization);
            if (res.organization?._id || res.organization?.id) {
              localStorage.setItem('vedanco_org_id', res.organization._id || res.organization.id);
            }
            if (res.organization) {
              localStorage.setItem('vedanco_org', JSON.stringify(res.organization));
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
    const res = await api.post('/auth/login', { email, password });
    if (res?.success) {
      localStorage.setItem('vedanco_token', res.token);
      localStorage.setItem('vedanco_user', JSON.stringify(res.user));
      if (res.organization?._id || res.organization?.id) {
        localStorage.setItem('vedanco_org_id', res.organization._id || res.organization.id);
      }
      if (res.organization) {
        localStorage.setItem('vedanco_org', JSON.stringify(res.organization));
      }
      setToken(res.token);
      setUser(res.user);
      setOrganization(res.organization);
      return res;
    }
    throw new Error(res?.message || 'Invalid email or password');
  };

  const register = async (name, email, password, companyName) => {
    const res = await api.post('/auth/register', { name, email, password, companyName });
    if (res?.success) {
      localStorage.setItem('vedanco_token', res.token);
      localStorage.setItem('vedanco_user', JSON.stringify(res.user));
      if (res.organization?._id || res.organization?.id) {
        localStorage.setItem('vedanco_org_id', res.organization._id || res.organization.id);
      }
      if (res.organization) {
        localStorage.setItem('vedanco_org', JSON.stringify(res.organization));
      }
      setToken(res.token);
      setUser(res.user);
      setOrganization(res.organization);
      return res;
    }
    throw new Error(res?.message || 'Registration failed');
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
