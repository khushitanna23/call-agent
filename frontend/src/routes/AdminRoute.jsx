import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();

  // Read stored user directly to prevent race condition during React state updates
  const storedToken = localStorage.getItem('vedanco_token');
  const storedUserRaw = localStorage.getItem('vedanco_user');
  let storedRole = null;
  let storedEmail = null;
  try {
    const parsed = storedUserRaw ? JSON.parse(storedUserRaw) : null;
    storedRole = parsed?.role;
    storedEmail = parsed?.email;
  } catch {}

  const hasToken = isAuthenticated || !!storedToken;
  const isReallyAdmin = isAdmin || user?.role === 'admin' || storedRole === 'admin' || storedEmail === 'admin@vedanco.ai';

  if (loading && !hasToken) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <span className="text-sm font-medium">Verifying admin privileges...</span>
      </div>
    );
  }

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  if (!isReallyAdmin) {
    return <Navigate to="/login?role=admin&switch=true" replace />;
  }

  return children;
};
