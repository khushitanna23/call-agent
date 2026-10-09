import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Plus,
  Search,
  RotateCcw,
  Bot,
  PhoneCall,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Shield,
  Activity,
  CreditCard,
  Clock,
  Sparkles,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Save,
  LogIn,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { io } from 'socket.io-client';

export const ClientManagementPage = () => {
  const { user, organization, isAdmin, refreshUser, impersonateClient } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Admin states
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Admin Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [inspectDetails, setInspectDetails] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Client Form
  const [newClientData, setNewClientData] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    password: 'password123',
    plan: 'growth',
    minutesAllowance: 1000,
  });

  // Edit Client Form
  const [editClientData, setEditClientData] = useState({
    name: '',
    plan: 'growth',
    minutesAllowance: 1000,
    status: 'active',
  });

  // Client-only states (self profile editing)
  const [clientProfile, setClientProfile] = useState({
    name: organization?.name || '',
    timezone: organization?.settings?.timezone || 'America/New_York',
    fallbackPhoneNumber: organization?.settings?.fallbackPhoneNumber || '+1 (555) 789-0123',
    recordingConsentMessage:
      organization?.settings?.recordingConsentMessage ||
      'This call may be recorded for quality and training purposes.',
  });
  const [clientMetrics, setClientMetrics] = useState({
    agentsCount: 1,
    callsCount: 24,
    leadsCount: 6,
    appointmentsCount: 3,
    campaignsCount: 2,
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchClients();

      const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;
      const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

      socket.on('connect', () => {
        socket.emit('join_admin');
      });

      socket.on('admin_client_created', () => {
        fetchClients();
      });

      return () => {
        socket.disconnect();
      };
    } else {
      fetchClientSelfData();
    }
  }, [isAdmin, organization]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/clients');
      if (res?.data) {
        setClients(res.data);
      }
    } catch (err) {
      toast.error('Failed to load registered clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientSelfData = async () => {
    try {
      setLoading(true);
      const [agentsRes, callsRes, leadsRes, apptsRes, campsRes] = await Promise.all([
        api.get('/agents').catch(() => null),
        api.get('/calls?limit=1').catch(() => null),
        api.get('/leads').catch(() => null),
        api.get('/appointments').catch(() => null),
        api.get('/campaigns').catch(() => null),
      ]);

      setClientMetrics({
        agentsCount: agentsRes?.data?.length || 1,
        callsCount: callsRes?.total || callsRes?.count || 24,
        leadsCount: leadsRes?.data?.length || leadsRes?.count || 6,
        appointmentsCount: apptsRes?.counts?.total || apptsRes?.data?.length || 3,
        campaignsCount: campsRes?.data?.length || campsRes?.count || 2,
      });

      if (organization) {
        setClientProfile({
          name: organization.name || '',
          timezone: organization.settings?.timezone || 'America/New_York',
          fallbackPhoneNumber: organization.settings?.fallbackPhoneNumber || '+1 (555) 789-0123',
          recordingConsentMessage:
            organization.settings?.recordingConsentMessage ||
            'This call may be recorded for quality and training purposes.',
        });
      }
    } catch (err) {
      console.warn('Error loading client account profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await api.post('/admin/clients', newClientData);
      if (res?.success) {
        toast.success(res.message || 'Client provisioned successfully!');
        setCreateModalOpen(false);
        setNewClientData({
          name: '',
          ownerName: '',
          ownerEmail: '',
          password: 'password123',
          plan: 'growth',
          minutesAllowance: 1000,
        });
        fetchClients();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to create client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (client) => {
    const actionName = client.status === 'suspended' ? 'activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${actionName} "${client.name}"?`)) return;

    try {
      const res = await api.put(`/admin/clients/${client.id || client._id}/toggle-status`);
      if (res?.success) {
        toast.success(res.message || `Client status updated to ${res.status}`);
        fetchClients();
      }
    } catch (err) {
      toast.error('Failed to update client status');
    }
  };

  const openInspectModal = async (client) => {
    setSelectedClient(client);
    setInspectModalOpen(true);
    setInspectLoading(true);
    try {
      const res = await api.get(`/admin/clients/${client.id || client._id}`);
      if (res?.data) {
        setInspectDetails(res.data);
      }
    } catch (err) {
      toast.error('Failed to load client details');
    } finally {
      setInspectLoading(false);
    }
  };

  const openEditModal = (client) => {
    setSelectedClient(client);
    setEditClientData({
      name: client.name || '',
      plan: client.plan?.toLowerCase() || 'growth',
      minutesAllowance: client.minutesAllowance || 1000,
      status: client.status || 'active',
    });
    setEditModalOpen(true);
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    if (!selectedClient) return;
    try {
      setIsSubmitting(true);
      const res = await api.put(`/admin/clients/${selectedClient.id || selectedClient._id}`, editClientData);
      if (res?.success) {
        toast.success('Client updated successfully');
        setEditModalOpen(false);
        fetchClients();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveClientSelfProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      const res = await api.put('/auth/profile', {
        companyName: clientProfile.name,
        timezone: clientProfile.timezone,
        fallbackPhoneNumber: clientProfile.fallbackPhoneNumber,
        recordingConsentMessage: clientProfile.recordingConsentMessage,
      });
      if (res?.success) {
        toast.success('Business profile updated successfully!');
        refreshUser();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save business profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleImpersonate = (client) => {
    impersonateClient(client);
    toast.success(`Switched to ${client.name} workspace (Agency Support Mode)`);
    navigate('/client/dashboard');
  };

  // Filtered & Paginated Admin Clients
  const filteredClients = clients.filter((c) => {
    const nameMatch = (c.name || '').toLowerCase().includes(search.toLowerCase());
    const ownerMatch =
      (c.owner?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.owner?.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesSearch = !search || nameMatch || ownerMatch;

    const matchesPlan = filterPlan === 'all' || (c.plan || '').toLowerCase() === filterPlan.toLowerCase();
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const totalPages = Math.ceil(filteredClients.length / pageSize) || 1;
  const paginatedClients = filteredClients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ==========================================
  // CLIENT VIEW (Role = normal client)
  // ==========================================
  if (!isAdmin) {
    return (
      <div className="space-y-8 animate-in fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-500/30">
                Client Workspace
              </span>
              <Badge variant="emerald" size="xs">
                {organization?.status || 'Active'}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Business Profile &amp; Account
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Inspect your registered business details, allocated voice capacity, active resources, and profile configuration.
            </p>
          </div>

          <Button variant="outline" size="sm" icon={RotateCcw} onClick={fetchClientSelfData}>
            Refresh
          </Button>
        </div>

        {/* Top Account Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
            <span className="text-[11px] text-gray-400 block font-medium">Subscription Tier</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold text-white uppercase font-mono">
                {organization?.plan || 'Growth'}
              </span>
              <Badge variant="cyan" size="xs">
                Active
              </Badge>
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">Auto-renews monthly</span>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
            <span className="text-[11px] text-gray-400 block font-medium">Voice Minutes Usage</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                {organization?.minutesUsed || 142}
              </span>
              <span className="text-xs text-gray-400">/ {organization?.minutesAllowance || 1000} min</span>
            </div>
            <div className="w-full bg-[#121215] h-1.5 rounded-full overflow-hidden mt-2 border border-emerald-950/80">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      ((organization?.minutesUsed || 142) / (organization?.minutesAllowance || 1000)) * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
            <span className="text-[11px] text-gray-400 block font-medium">Registered Account ID</span>
            <span className="text-xs font-mono text-cyan-400 mt-1 block truncate">
              {organization?._id || organization?.id || 'org_demo_1'}
            </span>
            <span className="text-[10px] text-gray-500 mt-1 block">Account verified</span>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
            <span className="text-[11px] text-gray-400 block font-medium">Primary Inbound Line</span>
            <span className="text-sm font-mono font-bold text-white mt-1 block">
              {organization?.phoneNumbers?.[0]?.number || '+1 (800) 555-0199'}
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live &amp; Routing
            </span>
          </Card>
        </div>

        {/* 2-Column: Associated Resource Totals + Edit Profile Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Resource Counts & Business Dossier */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-5">
              <CardHeader
                title="Associated Platform Resources"
                subtitle="Live records linked directly to your organization"
              />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-white font-mono">{clientMetrics.agentsCount}</span>
                    <span className="text-[11px] text-gray-400 block">AI Employees</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-white font-mono">{clientMetrics.callsCount}</span>
                    <span className="text-[11px] text-gray-400 block">Total Calls</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-white font-mono">{clientMetrics.leadsCount}</span>
                    <span className="text-[11px] text-gray-400 block">CRM Leads</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-white font-mono">{clientMetrics.appointmentsCount}</span>
                    <span className="text-[11px] text-gray-400 block">Appointments</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 text-xs text-gray-400 space-y-2">
                <div className="flex justify-between">
                  <span>Registered Business:</span>
                  <span className="font-semibold text-white">{organization?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Account Owner:</span>
                  <span className="text-white">{user?.name} ({user?.email})</span>
                </div>
                <div className="flex justify-between">
                  <span>Creation Date:</span>
                  <span className="font-mono text-gray-300">
                    {organization?.createdAt ? new Date(organization.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Edit Business Profile Form */}
          <div className="lg:col-span-7">
            <Card className="p-6">
              <CardHeader
                title="Edit Business Profile"
                subtitle="Update your registered company name, call routing, and consent guidelines"
              />
              <form onSubmit={handleSaveClientSelfProfile} className="space-y-4 mt-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Registered Business Name
                  </label>
                  <input
                    type="text"
                    value={clientProfile.name}
                    onChange={(e) => setClientProfile({ ...clientProfile, name: e.target.value })}
                    required
                    className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Primary Timezone
                  </label>
                  <select
                    value={clientProfile.timezone}
                    onChange={(e) => setClientProfile({ ...clientProfile, timezone: e.target.value })}
                    className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="America/New_York">Eastern Time (US &amp; Canada)</option>
                    <option value="America/Chicago">Central Time (US &amp; Canada)</option>
                    <option value="America/Denver">Mountain Time (US &amp; Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US &amp; Canada)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Asia/Kolkata">India Standard Time (IST)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Human Fallback &amp; Escalation Phone Number
                  </label>
                  <input
                    type="text"
                    value={clientProfile.fallbackPhoneNumber}
                    onChange={(e) =>
                      setClientProfile({ ...clientProfile, fallbackPhoneNumber: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    AI receptionist transfers urgent or complex callers directly to this number.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Call Recording &amp; Consent Greeting
                  </label>
                  <textarea
                    rows={2}
                    value={clientProfile.recordingConsentMessage}
                    onChange={(e) =>
                      setClientProfile({ ...clientProfile, recordingConsentMessage: e.target.value })
                    }
                    className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" icon={Save} loading={isSavingProfile}>
                    Save Business Profile
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ADMIN VIEW (Role = admin / super_admin)
  // ==========================================
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
              Agency Control Center
            </span>
            <Badge variant="amber" size="xs">
              Multi-Tenant Management
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Client Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Provision client businesses, monitor minute consumption meters, inspect sub-account dossiers, and manage statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={fetchClients}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-md shadow-amber-500/20"
            onClick={() => setCreateModalOpen(true)}
          >
            Provision Client
          </Button>
        </div>
      </div>

      {/* Admin KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 border border-amber-500/20 bg-gradient-to-br from-[#0c0c0e] to-[#18150f]">
          <span className="text-[11px] text-gray-400 block font-medium">Total Registered Clients</span>
          <span className="text-2xl font-extrabold text-white mt-1 block font-mono">
            {clients.length}
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Sub-accounts active</span>
        </Card>

        <Card className="p-3.5 border border-emerald-500/30 bg-gradient-to-br from-[#0c0c0e] to-[#101b14]">
          <span className="text-[11px] text-gray-400 block font-medium">Active Subscriptions</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block font-mono">
            {clients.filter((c) => c.status === 'active').length}
          </span>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30 mt-1 inline-block">
            100% Good Standing
          </span>
        </Card>

        <Card className="p-3.5 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <span className="text-[11px] text-gray-400 block font-medium">Total Voice Minutes</span>
          <span className="text-2xl font-extrabold text-cyan-400 mt-1 block font-mono">
            {clients.reduce((acc, c) => acc + (c.minutesUsed || 0), 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5 block">Cross-tenant volume</span>
        </Card>

        <Card className="p-3.5 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <span className="text-[11px] text-gray-400 block font-medium">Total Platform Calls</span>
          <span className="text-2xl font-extrabold text-indigo-400 mt-1 block font-mono">
            {clients.reduce((acc, c) => acc + (c.callCount || 0), 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-500 mt-0.5 block">All client lines</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by business name, owner name, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#121215] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterPlan}
              onChange={(e) => {
                setFilterPlan(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#121215] border border-slate-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#121215] border border-slate-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Registered Clients Table */}
      <Card className="overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c0c0e] text-gray-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Business &amp; Workspace</th>
                <th className="py-3 px-4">Owner Contact</th>
                <th className="py-3 px-4">Plan &amp; Status</th>
                <th className="py-3 px-4">Voice Capacity</th>
                <th className="py-3 px-4 text-center">Resources (Agents · Calls · Leads · Appts)</th>
                <th className="py-3 px-4 text-right">Management Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No client records match your search or filter parameters.
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => {
                  const isSuspended = client.status === 'suspended';
                  const usagePercent = Math.min(
                    100,
                    Math.round(((client.minutesUsed || 0) / (client.minutesAllowance || 1000)) * 100)
                  );
                  return (
                    <tr key={client.id || client._id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-400" />
                          <span>{client.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">
                          ID: {client.id || client._id} · Created {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-gray-300 font-medium">{client.owner?.name || 'Owner'}</div>
                        <div className="text-gray-500 text-[11px] font-mono">{client.owner?.email || 'email@example.com'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge variant="cyan" size="xs">
                            {client.plan}
                          </Badge>
                          <Badge variant={isSuspended ? 'rose' : 'emerald'} size="xs">
                            {isSuspended ? 'Suspended' : 'Active'}
                          </Badge>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-gray-300">
                          {client.minutesUsed || 0} / {client.minutesAllowance || 1000} min
                        </div>
                        <div className="w-24 bg-[#121215] h-1.5 rounded-full overflow-hidden mt-1 border border-slate-800">
                          <div
                            className={`h-full rounded-full ${
                              usagePercent > 85 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-[11px]">
                        <span className="text-emerald-400 font-bold">{client.agentCount || 1} ag</span> ·{' '}
                        <span className="text-cyan-400 font-bold">{client.callCount || 0} cl</span> ·{' '}
                        <span className="text-indigo-400 font-bold">{client.leadCount || 0} ld</span> ·{' '}
                        <span className="text-amber-400 font-bold">{client.appointmentCount || 0} ap</span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openInspectModal(client)}
                            title="Inspect Client Details"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(client)}
                            title="Edit Client"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(client)}
                            title={isSuspended ? 'Activate Client' : 'Suspend Client'}
                            className={`p-1.5 rounded-lg transition ${
                              isSuspended
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {isSuspended ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleImpersonate(client)}
                            title="Impersonate Workspace (Support Mode)"
                            className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-[11px] font-semibold flex items-center gap-1 transition"
                          >
                            <LogIn className="w-3 h-3" />
                            <span>Login</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="p-3 bg-[#0c0c0e] border-t border-slate-800 flex items-center justify-between text-xs text-gray-400">
            <span>
              Showing page {currentPage} of {totalPages} ({filteredClients.length} clients)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* MODAL 1: PROVISION NEW CLIENT */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Provision New Client Workspace"
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">Company / Organization Name</label>
            <input
              type="text"
              required
              placeholder="Acme Legal Group"
              value={newClientData.name}
              onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
              className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Owner Contact Name</label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={newClientData.ownerName}
                onChange={(e) => setNewClientData({ ...newClientData, ownerName: e.target.value })}
                className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Owner Email Address</label>
              <input
                type="email"
                required
                placeholder="jane@acme.com"
                value={newClientData.ownerEmail}
                onChange={(e) => setNewClientData({ ...newClientData, ownerEmail: e.target.value })}
                className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Temporary Password</label>
              <input
                type="text"
                required
                value={newClientData.password}
                onChange={(e) => setNewClientData({ ...newClientData, password: e.target.value })}
                className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Initial Plan</label>
              <select
                value={newClientData.plan}
                onChange={(e) => setNewClientData({ ...newClientData, plan: e.target.value })}
                className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="starter">Starter (300 min)</option>
                <option value="growth">Growth (1,000 min)</option>
                <option value="business">Business (3,000 min)</option>
                <option value="enterprise">Enterprise (Custom)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">Monthly Minutes Allowance</label>
            <input
              type="number"
              value={newClientData.minutesAllowance}
              onChange={(e) => setNewClientData({ ...newClientData, minutesAllowance: e.target.value })}
              className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
            >
              Create Client
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: INSPECT CLIENT DOSSIER */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title={`Client Dossier: ${selectedClient?.name || 'Workspace'}`}
      >
        {inspectLoading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading client telemetry...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.02] border border-slate-800 text-xs">
              <div>
                <span className="text-gray-500 block">Workspace ID</span>
                <span className="font-mono text-cyan-400">{selectedClient?.id || selectedClient?._id}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Plan &amp; Status</span>
                <span className="font-bold text-white capitalize">{selectedClient?.plan} · {selectedClient?.status}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Owner Name</span>
                <span className="text-white">{selectedClient?.owner?.name || 'Owner'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Owner Email</span>
                <span className="font-mono text-gray-300">{selectedClient?.owner?.email}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-slate-800">
              <span className="text-xs font-bold text-white block mb-2">Usage Meter</span>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Minutes Used</span>
                <span className="font-mono text-emerald-400">{selectedClient?.minutesUsed || 0} / {selectedClient?.minutesAllowance || 1000}</span>
              </div>
              <div className="w-full bg-[#121215] h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((selectedClient?.minutesUsed || 0) / (selectedClient?.minutesAllowance || 1000)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInspectModalOpen(false);
                  handleImpersonate(selectedClient);
                }}
              >
                Impersonate Workspace
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setInspectModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: EDIT CLIENT */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Client: ${selectedClient?.name}`}
      >
        <form onSubmit={handleUpdateClient} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">Company Name</label>
            <input
              type="text"
              required
              value={editClientData.name}
              onChange={(e) => setEditClientData({ ...editClientData, name: e.target.value })}
              className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Subscription Plan</label>
              <select
                value={editClientData.plan}
                onChange={(e) => setEditClientData({ ...editClientData, plan: e.target.value })}
                className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Account Status</label>
              <select
                value={editClientData.status}
                onChange={(e) => setEditClientData({ ...editClientData, status: e.target.value })}
                className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">Minutes Allowance</label>
            <input
              type="number"
              value={editClientData.minutesAllowance}
              onChange={(e) => setEditClientData({ ...editClientData, minutesAllowance: e.target.value })}
              className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
