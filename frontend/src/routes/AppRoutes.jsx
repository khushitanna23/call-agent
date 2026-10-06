import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Guards
import { AppLayout } from '../components/layout/AppLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { PricingPage } from '../pages/public/PricingPage';
import { DemoPage } from '../pages/public/DemoPage';
import { LoginPage } from '../pages/public/LoginPage';
import { SignupPage } from '../pages/public/SignupPage';
import { BookAppointmentPage } from '../pages/public/BookAppointmentPage';

// App Pages
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
import { AnalyticsPage } from '../pages/app/AnalyticsPage';
import { BillingPage } from '../pages/app/BillingPage';
import { SettingsPage } from '../pages/app/SettingsPage';

// Admin Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';

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

      {/* Protected SaaS App Routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
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
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Super Admin Route */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
