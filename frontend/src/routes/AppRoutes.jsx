import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Layouts & Guards
import { ClientLayout } from '../components/layout/ClientLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { ClientRoute } from './ClientRoute';
import { AdminRoute } from './AdminRoute';
import { useAuth } from '../context/AuthContext';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { PricingPage } from '../pages/public/PricingPage';
import { DemoPage } from '../pages/public/DemoPage';
import { LoginPage } from '../pages/public/LoginPage';
import { SignupPage } from '../pages/public/SignupPage';
import { BookAppointmentPage } from '../pages/public/BookAppointmentPage';

// Canonical Shared Modules
import { DashboardPage } from '../pages/app/DashboardPage';
import { AgentsPage } from '../pages/app/AgentsPage';
import { CreateAgentWizardPage } from '../pages/app/CreateAgentWizardPage';
import { CallsPage } from '../pages/app/CallsPage';
import { CallDetailPage } from '../pages/app/CallDetailPage';
import { LeadsPage } from '../pages/app/LeadsPage';
import { LeadDetailPage } from '../pages/app/LeadDetailPage';
import { AppointmentsPage } from '../pages/app/AppointmentsPage';
import { KnowledgePage } from '../pages/app/KnowledgePage';
import { CampaignsPage } from '../pages/app/CampaignsPage';
import { AutomationsPage } from '../pages/app/AutomationsPage';
import { IntegrationsPage } from '../pages/app/IntegrationsPage';
import { PhoneNumbersPage } from '../pages/app/PhoneNumbersPage';
import { AnalyticsPage } from '../pages/app/AnalyticsPage';
import { ClientManagementPage } from '../pages/app/ClientManagementPage';
import { BillingPage } from '../pages/app/BillingPage';
import { SettingsPage } from '../pages/app/SettingsPage';

// Admin Dedicated Dashboard
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';

// Smart Redirect Handlers
const DashboardRedirect = () => {
  const { defaultDashboardPath, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={defaultDashboardPath || '/client/dashboard'} replace />;
};

const LegacyAppRedirect = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const sub = location.pathname.replace(/^\/app\/?/, '');
  const prefix = isAdmin ? '/admin' : '/client';
  return <Navigate to={`${prefix}/${sub || 'dashboard'}${location.search}`} replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Booking Routes (Login Required) */}
      <Route
        path="/book"
        element={
          <ProtectedRoute>
            <BookAppointmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <BookAppointmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/book-appointment"
        element={
          <ProtectedRoute>
            <BookAppointmentPage />
          </ProtectedRoute>
        }
      />

      {/* Smart Root Dashboard Redirect */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        }
      />

      {/* CLIENT WORKSPACE EXPERIENCE (/client/*) */}
      <Route
        path="/client"
        element={
          <ClientRoute>
            <ClientLayout />
          </ClientRoute>
        }
      >
        <Route index element={<Navigate to="/client/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="agents/new" element={<CreateAgentWizardPage />} />
        <Route path="calls" element={<CallsPage />} />
        <Route path="calls/:id" element={<CallDetailPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="book" element={<BookAppointmentPage />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="automations" element={<AutomationsPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="phone-numbers" element={<PhoneNumbersPage />} />
        <Route path="telephony" element={<Navigate to="/client/phone-numbers" replace />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="clients" element={<ClientManagementPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* ADMIN & AGENCY MASTER EXPERIENCE (/admin/*) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="agents/new" element={<CreateAgentWizardPage />} />
        <Route path="calls" element={<CallsPage />} />
        <Route path="calls/:id" element={<CallDetailPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="automations" element={<AutomationsPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="phone-numbers" element={<PhoneNumbersPage />} />
        <Route path="telephony" element={<Navigate to="/admin/phone-numbers" replace />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="clients" element={<ClientManagementPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="whitelabel" element={<Navigate to="/admin/settings?tab=whitelabel" replace />} />
        <Route path="logs" element={<AdminDashboardPage initialTab="logs" />} />
      </Route>

      {/* Universal Legacy /app/* handler */}
      <Route path="/app/*" element={<LegacyAppRedirect />} />
      <Route path="/app" element={<LegacyAppRedirect />} />

      {/* 404 Catch All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
