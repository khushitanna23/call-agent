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
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.success) {
            setUser(res.user);
            setOrganization(res.organization);
            if (res.organization?._id) {
              localStorage.setItem('vedanco_org_id', res.organization._id);
            }
          }
        } catch (err) {
          console.warn('[AuthContext] Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success) {
      localStorage.setItem('vedanco_token', res.token);
      localStorage.setItem('vedanco_user', JSON.stringify(res.user));
      if (res.organization?._id || res.organization?.id) {
        localStorage.setItem('vedanco_org_id', res.organization._id || res.organization.id);
      }
      setToken(res.token);
      setUser(res.user);
      setOrganization(res.organization);
      return res;
    }
  };

  const register = async (name, email, password, companyName) => {
    const res = await api.post('/auth/register', { name, email, password, companyName });
    if (res.success) {
      localStorage.setItem('vedanco_token', res.token);
      localStorage.setItem('vedanco_user', JSON.stringify(res.user));
      if (res.organization?._id || res.organization?.id) {
        localStorage.setItem('vedanco_org_id', res.organization._id || res.organization.id);
      }
      setToken(res.token);
      setUser(res.user);
      setOrganization(res.organization);
      return res;
    }
  };

  const logout = () => {
    localStorage.removeItem('vedanco_token');
    localStorage.removeItem('vedanco_user');
    localStorage.removeItem('vedanco_org_id');
    setToken(null);
    setUser(null);
    setOrganization(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.success) {
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
