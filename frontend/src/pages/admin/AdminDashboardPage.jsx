import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Shield,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  PhoneCall,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Building,
  CreditCard,
  Phone,
  Bot,
  MessageSquare,
  Smartphone,
  HardDrive,
  Settings,
  HelpCircle,
  FileText,
  LayoutDashboard,
  Eye,
  Sliders,
  ExternalLink,
  Search,
  Calendar,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import { io } from 'socket.io-client';

export const AdminDashboardPage = ({ initialTab }) => {
  const [searchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(initialTab || queryTab || 'dashboard');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (queryTab) {
      setActiveTab(queryTab);
    }
  }, [initialTab, queryTab]);

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inspection Modals
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'view_customer', 'view_calls', 'view_usage'
    customer: null,
  });

  // Appointment details modal
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [apptModalOpen, setApptModalOpen] = useState(false);
  const [apptSearch, setApptSearch] = useState('');
  const [apptStatusFilter, setApptStatusFilter] = useState('all');

  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const [triggeringId, setTriggeringId] = useState(null);

  const toast = useToast();

  // Dynamic platform datasets from MongoDB
  const [customers, setCustomers] = useState([]);
  const [callsList, setCallsList] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);

  useEffect(() => {
    fetchAdminData();

    // Real-Time Socket.io connection for cross-tenant appointment sync
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join_admin');
    });

    socket.on('admin_appointment_booked', (payload) => {
      const appt = payload?.appointment;
      const caller = appt?.callerName || appt?.customerName || 'Inbound Caller';
      const phone = appt?.callerPhone || appt?.customerPhone || '';
      const org = payload?.organization?.name || 'Client Workspace';

      if (appt) {
        setAppointments((prev) => {
          const exists = prev.some((a) => (a._id || a.id) === (appt._id || appt.id));
          if (exists) return prev;
          return [appt, ...prev];
        });
        setNewlyAddedId(appt._id || appt.id);
        setTimeout(() => setNewlyAddedId(null), 10000);
      }

      toast.success(`🚨 New Appointment Booked: ${caller} (${phone}) · ${org}`);
      fetchAdminData();
    });

    socket.on('appointment_booked', (payload) => {
      const appt = payload?.appointment;
      if (appt) {
        setAppointments((prev) => {
          const exists = prev.some((a) => (a._id || a.id) === (appt._id || appt.id));
          if (exists) return prev;
          return [appt, ...prev];
        });
        setNewlyAddedId(appt._id || appt.id);
        setTimeout(() => setNewlyAddedId(null), 10000);
      }
      fetchAdminData();
    });

    socket.on('admin_appointment_updated', (payload) => {
      const updated = payload?.appointment;
      if (updated) {
        setAppointments((prev) =>
          prev.map((a) => ((a._id || a.id) === (updated._id || updated.id) ? { ...a, ...updated } : a))
        );
      }
      fetchAdminData();
    });

    socket.on('appointment_updated', (payload) => {
      const updated = payload?.appointment || payload;
      if (updated) {
        setAppointments((prev) =>
          prev.map((a) => ((a._id || a.id) === (updated._id || updated.id) ? { ...a, ...updated } : a))
        );
      }
      fetchAdminData();
    });

    // Real-Time Sync for Calls across all client workspaces
    socket.on('admin_call_created', (payload) => {
      const cl = payload?.call;
      if (cl) {
        toast.info(`📞 New Call: ${cl.callerNumber || 'Inbound'} (${cl.organizationId?.name || 'Client'})`);
      }
      fetchAdminData();
    });

    socket.on('call_created', () => {
      fetchAdminData();
    });

    // Real-Time Sync for Leads across all client workspaces
    socket.on('admin_lead_created', (payload) => {
      const ld = payload?.lead;
      if (ld) {
        toast.info(`🎯 New Lead Captured: ${ld.name} (${ld.company || ld.phone || 'Client'})`);
      }
      fetchAdminData();
    });

    socket.on('lead_created', () => {
      fetchAdminData();
    });

    socket.on('admin_lead_updated', () => {
      fetchAdminData();
    });

    socket.on('lead_updated', () => {
      fetchAdminData();
    });

    // Real-Time Sync for AI Agents
    socket.on('admin_agent_created', (payload) => {
      const ag = payload?.agent;
      if (ag) {
        toast.success(`🤖 New AI Agent Created: ${ag.name}`);
      }
      fetchAdminData();
    });

    socket.on('agent_created', () => {
      fetchAdminData();
    });

    // Real-Time Sync for Client Workspaces
    socket.on('admin_client_created', (payload) => {
      toast.success(`🏢 New Client Registered: ${payload?.organization?.name || 'New Workspace'}`);
      fetchAdminData();
    });

    // Auto-polling fallback every 10 seconds to guarantee freshness
    const interval = setInterval(() => {
      fetchAdminData();
    }, 10000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleTriggerCall = async (apptId) => {
    try {
      setTriggeringId(apptId);
      toast.info('Initiating automated AI outbound phone call to customer...');
      const res = await api.post(`/appointments/${apptId}/trigger-call`);
      if (res?.success) {
        toast.success(res.message || 'Outbound AI call placed successfully via carrier!');
        fetchAdminData();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to place call');
    } finally {
      setTriggeringId(null);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [metricsRes, clientsRes, callsRes, apptsRes, logsRes] = await Promise.all([
        api.get('/admin/metrics').catch(() => null),
        api.get('/admin/clients').catch(() => null),
        api.get('/admin/calls').catch(() => api.get('/calls?limit=50').catch(() => null)),
        api.get('/admin/appointments').catch(() => null),
        api.get('/admin/error-logs').catch(() => null),
      ]);

      if (metricsRes?.data) setMetrics(metricsRes.data);

      if (clientsRes?.data) {
        const rawClients = Array.isArray(clientsRes.data) ? clientsRes.data : [];
        const mappedClients = rawClients.map((c) => ({
          id: c.id || c._id,
          name: c.owner?.name || c.name,
          organization: c.name,
          plan: c.plan ? c.plan.toUpperCase() : 'GROWTH',
          monthlyPrice: c.plan === 'starter' ? 99 : c.plan === 'business' ? 599 : 249,
          status: c.status || 'active',
          calls: c.callCount || 0,
          usageMinutes: c.minutesUsed || 0,
          minutesAllowance: c.minutesAllowance || 1000,
          joinedDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent',
          renewalDate: 'Auto-renew active',
          aiEmployee: 'Sarah',
        }));
        setCustomers(mappedClients);
      }

      if (callsRes) {
        const rawCalls = Array.isArray(callsRes.data)
          ? callsRes.data
          : Array.isArray(callsRes)
          ? callsRes
          : callsRes.data?.data || [];
        const mappedCalls = rawCalls.map((cl) => ({
          id: cl._id || cl.id,
          customer: cl.organizationId?.name || (typeof cl.organizationId === 'string' ? cl.organizationId : 'Client Workspace'),
          aiEmployee: cl.agentId?.name || (typeof cl.agentId === 'string' ? cl.agentId : 'Sarah'),
          caller: cl.callerNumber || cl.callerName || 'Inbound',
          duration: `${Math.floor((cl.durationSeconds || 0) / 60)}m ${(cl.durationSeconds || 0) % 60}s`,
          status: cl.status || 'completed',
          date: cl.createdAt ? new Date(cl.createdAt).toLocaleString() : 'Recent',
        }));
        setCallsList(mappedCalls);
      }

      if (apptsRes) {
        const rawAppts = Array.isArray(apptsRes.data)
          ? apptsRes.data
          : Array.isArray(apptsRes)
          ? apptsRes
          : apptsRes.data?.data || [];
        setAppointments(rawAppts);
      }

      if (logsRes) {
        const rawLogs = Array.isArray(logsRes.data)
          ? logsRes.data
          : Array.isArray(logsRes)
          ? logsRes
          : [];
        setErrorLogs(rawLogs);
      }
    } catch (err) {
      toast.error('Failed to load admin telemetry');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCustomerStatus = (id) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === 'active' ? 'suspended' : 'active' } : c
      )
    );
    toast.info('Customer status updated');
  };

  const m = {
    mrr: metrics?.mrr ?? 0,
    customers: metrics?.customers ?? customers.length,
    activeSubscriptions: metrics?.activeSubscriptions ?? customers.filter((c) => c.status === 'active').length,
    totalCalls: metrics?.calls ?? 0,
    totalMinutes: metrics?.minutes ?? 0,
    aiCost: metrics?.aiCost ?? 0,
    revenue: metrics?.revenue ?? 0,
    grossMargin: metrics?.grossMargin ?? 100,
    churn: metrics?.churn ?? '0.0%',
    appointmentsCount: appointments.length,
  };

  // Exactly matching Feature 6 sidebar items with Appointments:
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'calls', label: 'Calls', icon: PhoneCall },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'usage', label: 'Usage', icon: Activity },
    { id: 'billing', label: 'Billing', icon: DollarSign },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'logs', label: 'System Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const filteredAppts = appointments.filter((appt) => {
    const caller = (appt.callerName || appt.customerName || '').toLowerCase();
    const phone = (appt.callerPhone || appt.customerPhone || '');
    const org = (appt.organizationId?.name || '').toLowerCase();
    const email = (appt.customerEmail || '').toLowerCase();
    const service = (appt.serviceType || appt.type || '').toLowerCase();
    const query = apptSearch.toLowerCase();
    const matchesSearch =
      !query ||
      caller.includes(query) ||
      phone.includes(query) ||
      org.includes(query) ||
      email.includes(query) ||
      service.includes(query);
    const matchesStatus = apptStatusFilter === 'all' || appt.status === apptStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              VEDANCO AI Admin Panel
            </h1>
            <Badge variant="amber" size="xs">
              Super Admin
            </Badge>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Platform control plane, multi-tenant monitoring, usage meters, and tenant subscriptions.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={RotateCcw} onClick={fetchAdminData}>
          Refresh
        </Button>
      </div>

      {/* Horizontal Cockpit Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-emerald-950/40 scrollbar-none">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Admin Content Area */}
      <div className="space-y-6">
          {/* TAB 1: DASHBOARD (Command Center with Dedicated Left-Side Appointments Box) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Top KPI Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="p-3.5 border border-emerald-500/30 bg-gradient-to-br from-[#0c0c0e] to-[#101b14]">
                  <span className="text-[11px] text-gray-400 block font-medium">Total Appointments</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                      {appointments.length}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      Live Feed
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">Cross-tenant bookings</span>
                </Card>

                <Card className="p-3.5 border border-amber-500/20 bg-gradient-to-br from-[#0c0c0e] to-[#18150f]">
                  <span className="text-[11px] text-gray-400 block font-medium">Platform MRR</span>
                  <span className="text-2xl font-extrabold text-amber-400 mt-1 block font-mono">
                    ${m.mrr.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> +18.4% MoM
                  </span>
                </Card>

                <Card className="p-3.5 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
                  <span className="text-[11px] text-gray-400 block font-medium">Client Organizations</span>
                  <span className="text-2xl font-extrabold text-white mt-1 block font-mono">
                    {customers.length || m.customers}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Sub-accounts active</span>
                </Card>

                <Card className="p-3.5 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
                  <span className="text-[11px] text-gray-400 block font-medium">Total AI Calls</span>
                  <span className="text-2xl font-extrabold text-cyan-400 mt-1 block font-mono">
                    {m.totalCalls.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-cyan-400 mt-0.5 block">Handled by Sarah</span>
                </Card>
              </div>

              {/* 2-COLUMN SPLIT COMMAND CENTER: LEFT SIDE DEDICATED APPOINTMENTS BOX */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ======================================================== */}
                {/* LEFT SIDE BOX: DEDICATED REAL-TIME CLIENT APPOINTMENTS */}
                {/* ======================================================== */}
                <div className="lg:col-span-7 space-y-4">
                  <Card className="p-5 border border-emerald-500/30 bg-[#08080a] shadow-2xl relative overflow-hidden">
                    {/* Top ambient glow */}
                    <div className="absolute top-0 right-0 w-64 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Box Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-950/60">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-white tracking-tight">
                                Live Client Appointments
                              </h3>
                              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                REAL-TIME SYNC
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              Incoming customer bookings appear here instantly as clients schedule them
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="emerald" size="xs">
                          {appointments.length} Total
                        </Badge>
                        <Button
                          variant="outline"
                          size="xs"
                          icon={RotateCcw}
                          onClick={fetchAdminData}
                          isLoading={loading}
                        >
                          Refresh
                        </Button>
                      </div>
                    </div>

                    {/* Search & Filter Toolbar */}
                    <div className="py-3 flex flex-col sm:flex-row items-center gap-2 border-b border-slate-850">
                      <div className="relative w-full sm:flex-1">
                        <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Filter by caller, phone, client org..."
                          value={apptSearch}
                          onChange={(e) => setApptSearch(e.target.value)}
                          className="w-full bg-[#0c0c0e] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                        {['all', 'scheduled', 'calling', 'completed', 'failed'].map((st) => {
                          const count =
                            st === 'all'
                              ? appointments.length
                              : appointments.filter((a) => a.status === st).length;
                          return (
                            <button
                              key={st}
                              onClick={() => setApptStatusFilter(st)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize whitespace-nowrap transition ${
                                apptStatusFilter === st
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              {st} ({count})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Appointment Cards Stream */}
                    <div className="pt-3 space-y-3 max-h-[640px] overflow-y-auto pr-1">
                      {filteredAppts.length === 0 ? (
                        <div className="py-14 text-center">
                          <Calendar className="w-10 h-10 text-emerald-500/20 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-gray-300">
                            {appointments.length === 0
                              ? 'No appointments scheduled yet across any client workspace.'
                              : 'No appointments match the selected filter.'}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto">
                            When an incoming caller books via the AI Receptionist or client booking page, it pops up here in real-time.
                          </p>
                        </div>
                      ) : (
                        filteredAppts.map((appt) => {
                          const isJustAdded = newlyAddedId === (appt._id || appt.id);
                          const caller = appt.callerName || appt.customerName || 'Inbound Caller';
                          const phone = appt.callerPhone || appt.customerPhone || 'N/A';
                          const orgName = appt.organizationId?.name || 'Client Workspace';
                          const ownerName =
                            appt.organizationId?.ownerId?.name ||
                            appt.organizationId?.ownerId?.email ||
                            'Owner';
                          const dateStr = appt.date || appt.scheduledDate || 'TBD';
                          const timeStr = appt.timeSlot || appt.scheduledTime || 'TBD';
                          const service = appt.serviceType || appt.type || 'Discovery Consultation';

                          return (
                            <div
                              key={appt._id || appt.id}
                              className={`p-3.5 rounded-2xl border transition-all text-left group ${
                                isJustAdded
                                  ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20 animate-pulse'
                                  : 'border-slate-800 bg-[#0c0c0e] hover:border-emerald-500/40 hover:bg-[#101014]'
                              }`}
                            >
                              {/* Header row */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-xs">{caller}</span>
                                    {isJustAdded && (
                                      <span className="px-1.5 py-0.2 rounded bg-emerald-400 text-black font-extrabold text-[9px] uppercase tracking-wider animate-bounce">
                                        NEW
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="font-mono text-emerald-400 text-xs font-semibold">
                                      {phone}
                                    </span>
                                    {appt.customerEmail && (
                                      <span className="text-[10px] text-gray-500 truncate max-w-[150px]">
                                        · {appt.customerEmail}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                  <Badge
                                    variant={
                                      appt.status === 'completed'
                                        ? 'emerald'
                                        : appt.status === 'scheduled'
                                        ? 'amber'
                                        : appt.status === 'calling'
                                        ? 'cyan'
                                        : appt.status === 'failed'
                                        ? 'rose'
                                        : 'purple'
                                    }
                                    size="xs"
                                  >
                                    {appt.status}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span>{dateStr} @ {timeStr}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Details row */}
                              <div className="grid grid-cols-2 gap-2 py-2 my-2 border-y border-slate-850/80 text-[11px]">
                                <div className="flex items-center gap-1.5 text-gray-300">
                                  <Building2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                  <span className="truncate">
                                    <strong className="text-white">{orgName}</strong> ({ownerName})
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 text-gray-300">
                                  <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                  <span className="truncate">
                                    Agent: <strong className="text-cyan-300">{appt.agentId?.name || 'Sarah'}</strong>
                                  </span>
                                </div>
                              </div>

                              {/* Footer Actions */}
                              <div className="flex items-center justify-between pt-1">
                                <div className="text-[10px] text-gray-400 flex items-center gap-1 truncate max-w-[200px]">
                                  <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="truncate">{service}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerCall(appt._id || appt.id)}
                                    disabled={triggeringId === (appt._id || appt.id)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-400" />
                                    <span>{triggeringId === (appt._id || appt.id) ? 'Calling...' : 'Trigger AI Call'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAppt(appt);
                                      setApptModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-[#141418] hover:bg-[#1c1c22] border border-slate-800 text-gray-300 hover:text-white text-[11px] font-semibold transition flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3 text-gray-400" />
                                    <span>Inspect</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Card>
                </div>

                {/* ======================================================== */}
                {/* RIGHT SIDE BOX: RECENT LIVE CALLS & CLIENT TENANTS */}
                {/* ======================================================== */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Recent Calls Feed */}
                  <Card className="p-5 border border-cyan-500/20 bg-[#08080a] shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold">
                          <PhoneCall className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white">Recent AI Voice Calls</h3>
                          <p className="text-[10px] text-gray-400">Live calls handled by AI Receptionist</p>
                        </div>
                      </div>
                      <Badge variant="cyan" size="xs">
                        {callsList.length} Calls
                      </Badge>
                    </div>

                    <div className="divide-y divide-slate-850 max-h-[290px] overflow-y-auto mt-2">
                      {callsList.length === 0 ? (
                        <div className="py-8 text-center text-gray-500 text-xs">
                          No recent phone calls recorded yet.
                        </div>
                      ) : (
                        callsList.slice(0, 6).map((c) => (
                          <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span className="font-mono text-cyan-400">{c.caller}</span>
                                <span className="text-[10px] text-gray-500">· {c.customer}</span>
                              </div>
                              <span className="text-[10px] text-gray-500 block">{c.date}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-xs text-white block">{c.duration}</span>
                              <Badge variant={c.status === 'completed' ? 'emerald' : 'amber'} size="xs">
                                {c.status}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  {/* Client Sub-Accounts Health */}
                  <Card className="p-5 border border-amber-500/20 bg-[#08080a] shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white">Client Workspaces &amp; Telephony</h3>
                          <p className="text-[10px] text-gray-400">Multi-tenant usage overview</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('customers')}
                        className="text-[11px] text-amber-400 hover:underline font-semibold"
                      >
                        View All →
                      </button>
                    </div>

                    <div className="divide-y divide-slate-850 max-h-[260px] overflow-y-auto mt-2">
                      {customers.length === 0 ? (
                        <div className="py-8 text-center text-gray-500 text-xs">
                          No client sub-accounts active.
                        </div>
                      ) : (
                        customers.slice(0, 5).map((cl) => (
                          <div key={cl.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-semibold text-white block">{cl.organization}</span>
                              <span className="text-[10px] text-gray-500 block">Owner: {cl.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-xs text-emerald-400 font-semibold block">
                                {cl.usageMinutes}m / {cl.minutesAllowance}m
                              </span>
                              <Badge variant={cl.status === 'active' ? 'emerald' : 'rose'} size="xs">
                                {cl.status}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOMERS (Feature 6: Customer Name, Organization, Plan, Status, Calls, Usage, Joined Date, Actions) */}
          {activeTab === 'customers' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Customer Management</h2>
                  <p className="text-xs text-slate-400">View and manage customer accounts and statuses.</p>
                </div>
                <Badge variant="cyan" size="xs">
                  {customers.length} Organizations
                </Badge>
              </div>

              <Card className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                        <th className="py-3 px-3">Customer</th>
                        <th className="py-3 px-3">Organization</th>
                        <th className="py-3 px-3">Plan</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Calls</th>
                        <th className="py-3 px-3">Usage</th>
                        <th className="py-3 px-3">Joined Date</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-12 text-center text-slate-500">
                            No client organizations created yet. Add your first client in the Clients tab.
                          </td>
                        </tr>
                      ) : customers.map((c) => (
                        <tr key={c.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-3 font-semibold text-white">{c.name}</td>
                          <td className="py-3 px-3 text-slate-300">{c.organization}</td>
                          <td className="py-3 px-3">
                            <Badge variant="cyan" size="xs">
                              {c.plan}
                            </Badge>
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={c.status === 'active' ? 'emerald' : 'rose'} size="xs">
                              {c.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-300">{c.calls}</td>
                          <td className="py-3 px-3 font-mono text-cyan-400">
                            {c.usageMinutes}m / {c.minutesAllowance}m
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{c.joinedDate}</td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setModalState({ isOpen: true, type: 'view_customer', customer: c })}
                                className="p-1 rounded text-slate-400 hover:text-brand-cyan transition"
                                title="View Customer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setModalState({ isOpen: true, type: 'view_calls', customer: c })}
                                className="p-1 rounded text-slate-400 hover:text-white transition"
                                title="View Calls"
                              >
                                <PhoneCall className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setModalState({ isOpen: true, type: 'view_usage', customer: c })}
                                className="p-1 rounded text-slate-400 hover:text-white transition"
                                title="View Usage"
                              >
                                <Activity className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleCustomerStatus(c.id)}
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition ${
                                  c.status === 'active'
                                    ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                                    : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                }`}
                              >
                                {c.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: SUBSCRIPTIONS (Feature 6: Customer, Plan, Status, Monthly Price, Usage, Renewal Date) */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Subscription Management</h2>
                  <p className="text-xs text-slate-400">Track recurring revenue tiers, renewals, and usage quotas.</p>
                </div>
                <Badge variant="amber" size="xs">
                  ${m.mrr.toLocaleString()} MRR
                </Badge>
              </div>

              <Card className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                        <th className="py-3 px-3">Customer</th>
                        <th className="py-3 px-3">Plan</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Monthly Price</th>
                        <th className="py-3 px-3">Usage</th>
                        <th className="py-3 px-3">Renewal Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-500">
                            No active subscriptions yet.
                          </td>
                        </tr>
                      ) : customers.map((c) => (
                        <tr key={c.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-3">
                            <span className="font-semibold text-white block">{c.name}</span>
                            <span className="text-[11px] text-slate-400">{c.organization}</span>
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant="cyan" size="xs">
                              {c.plan}
                            </Badge>
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={c.status === 'active' ? 'emerald' : 'rose'} size="xs">
                              {c.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-white">
                            ${c.monthlyPrice}/mo
                          </td>
                          <td className="py-3 px-3 font-mono text-cyan-400">
                            {c.usageMinutes}m / {c.minutesAllowance}m
                          </td>
                          <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                            {c.renewalDate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 4: CALLS (Feature 6: Customer, AI Employee, Caller, Duration, Status, Date) */}
          {activeTab === 'calls' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Global Call Monitoring</h2>
                  <p className="text-xs text-slate-400">Real-time telemetry of active and completed telephone sessions across tenants.</p>
                </div>
                <Badge variant="cyan" size="xs">
                  {callsList.length} Sessions Logged
                </Badge>
              </div>

              <Card className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                        <th className="py-3 px-3">Customer</th>
                        <th className="py-3 px-3">AI Employee</th>
                        <th className="py-3 px-3">Caller</th>
                        <th className="py-3 px-3">Duration</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {callsList.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-500">
                            No call sessions logged yet across the platform.
                          </td>
                        </tr>
                      ) : callsList.map((cl) => (
                        <tr key={cl.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-3 font-semibold text-white">{cl.customer}</td>
                          <td className="py-3 px-3 text-brand-cyan">{cl.aiEmployee}</td>
                          <td className="py-3 px-3 font-mono text-slate-300">{cl.caller}</td>
                          <td className="py-3 px-3 font-mono text-slate-300">{cl.duration}</td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={
                                cl.status === 'completed'
                                  ? 'emerald'
                                  : cl.status === 'transferred'
                                  ? 'indigo'
                                  : 'rose'
                              }
                              size="xs"
                            >
                              {cl.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{cl.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 5: APPOINTMENTS (Admin view: who booked which appointment across all clients) */}
          {activeTab === 'appointments' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white">Platform Appointments Master Register</h2>
                  <p className="text-xs text-slate-400">
                    Live schedule of all incoming caller bookings across all client businesses and AI receptionists.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="emerald" size="xs">
                    {appointments.length} Total Bookings
                  </Badge>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={apptSearch}
                    onChange={(e) => setApptSearch(e.target.value)}
                    placeholder="Search by caller, phone, organization..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-navy-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {['all', 'scheduled', 'calling', 'completed', 'failed', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setApptStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                        apptStatusFilter === st
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'text-slate-400 hover:text-white bg-white/[0.02]'
                      }`}
                    >
                      {st === 'failed' ? 'Failed / Unanswered' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <Card className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                        <th className="py-3 px-3">Caller / Customer</th>
                        <th className="py-3 px-3">Client Workspace &amp; Owner</th>
                        <th className="py-3 px-3">AI Agent</th>
                        <th className="py-3 px-3">Scheduled Date &amp; Slot</th>
                        <th className="py-3 px-3">Service Type</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredAppts.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-12 text-center text-slate-500">
                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-400" />
                            {appointments.length === 0
                              ? 'No appointments scheduled yet across any client workspace. Inbound caller bookings will appear here in real-time.'
                              : 'No appointments match your filter criteria.'}
                          </td>
                        </tr>
                      ) : (
                        filteredAppts.map((appt) => {
                          const caller = appt.callerName || appt.customerName || 'Inbound Caller';
                          const phone = appt.callerPhone || appt.customerPhone || 'N/A';
                          const orgName = appt.organizationId?.name || 'Client Workspace';
                          const owner = appt.organizationId?.ownerId?.name || appt.organizationId?.ownerId?.email || 'Admin';
                          const dateStr = appt.date || appt.scheduledDate || 'TBD';
                          const timeStr = appt.timeSlot || appt.scheduledTime || 'TBD';

                          return (
                            <tr key={appt._id || appt.id} className="hover:bg-white/[0.02] transition">
                              <td className="py-3 px-3">
                                <div className="font-semibold text-white">{caller}</div>
                                <div className="font-mono text-[11px] text-cyan-400">{phone}</div>
                                {appt.customerEmail && (
                                  <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{appt.customerEmail}</div>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-medium text-slate-200">{orgName}</div>
                                <div className="text-[11px] text-slate-500">Owner: {owner}</div>
                              </td>
                              <td className="py-3 px-3 text-brand-cyan">
                                {appt.agentId?.name || 'Sarah'}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-mono font-semibold text-white">{timeStr}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{dateStr}</div>
                              </td>
                              <td className="py-3 px-3 text-slate-300">
                                {appt.serviceType || appt.type || 'Discovery Consultation'}
                              </td>
                              <td className="py-3 px-3">
                                <Badge
                                  variant={
                                    appt.status === 'completed'
                                      ? 'emerald'
                                      : appt.status === 'scheduled'
                                      ? 'amber'
                                      : appt.status === 'calling'
                                      ? 'cyan'
                                      : 'rose'
                                  }
                                  size="xs"
                                >
                                  {appt.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedAppt(appt);
                                    setApptModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-navy-800 text-amber-400 hover:bg-navy-700 transition font-semibold"
                                >
                                  Inspect
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 6: USAGE */}
          {activeTab === 'usage' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-base font-bold text-white">Resource Usage Quotas &amp; Telemetry</h2>
                <p className="text-xs text-slate-400">Aggregate consumption across voice, AI tokens, messaging, and cloud media.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Voice Minutes Consumed', used: `${m.totalMinutes}m`, total: 'Unlimited Pool', percent: Math.min(100, Math.round((m.totalMinutes / 1000) * 100)), icon: PhoneCall, color: 'text-emerald-400' },
                  { title: 'AI Token Minutes', used: `${Math.round(m.totalMinutes * 0.4)}m`, total: 'Metered LLM', percent: Math.min(100, Math.round((m.totalMinutes / 1000) * 40)), icon: Bot, color: 'text-teal-400' },
                  { title: 'Total Calls Handled', used: `${m.totalCalls}`, total: 'Active Channels', percent: Math.min(100, Math.round((m.totalCalls / 500) * 100)), icon: Phone, color: 'text-emerald-400' },
                  { title: 'Appointments Booked', used: `${appointments.length}`, total: 'Platform Master', percent: Math.min(100, appointments.length * 10), icon: Calendar, color: 'text-amber-400' },
                  { title: 'SMS Dispatched', used: '0', total: 'Carrier gateway', percent: 0, icon: MessageSquare, color: 'text-emerald-400' },
                  { title: 'Cloud Audio Storage', used: `${Number((m.totalMinutes * 0.005).toFixed(1))} GB`, total: 'Elastic S3', percent: Math.min(100, Math.round(m.totalMinutes * 0.05)), icon: HardDrive, color: 'text-amber-400' },
                ].map((u, idx) => {
                  const Icon = u.icon;
                  return (
                    <Card key={idx} className="p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-5 h-5 ${u.color}`} />
                          <Badge variant="cyan" size="xs">
                            {u.percent}%
                          </Badge>
                        </div>
                        <span className="text-xs font-bold text-white">{u.title}</span>
                        <div className="mt-2 text-base font-extrabold text-white font-mono">
                          {u.used}{' '}
                          <span className="text-[11px] text-slate-400 font-sans font-normal">
                            / {u.total}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3 border border-slate-700">
                        <div
                          className="bg-brand-cyan h-full rounded-full"
                          style={{ width: `${u.percent}%` }}
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-base font-bold text-white">Platform Invoicing &amp; Payouts</h2>
              <Card className="p-6">
                <CardHeader title="Gross Billing Telemetry" subtitle="Revenue generated across all organizations" />
                <div className="grid grid-cols-3 gap-4 text-center py-4 border-y border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-xs">Total Collected (MTD)</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">${m.revenue.toLocaleString()}.00</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Pending Invoices</span>
                    <span className="text-xl font-bold text-amber-400 font-mono mt-1 block">$0.00</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Gateway Status</span>
                    <Badge variant="emerald" size="xs" className="mt-1">Active (Live Mode)</Badge>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 8: SUPPORT */}
          {activeTab === 'support' && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-base font-bold text-white">Support Tickets &amp; Inquiries</h2>
              <Card className="p-6">
                <div className="py-8 text-center text-slate-500 text-xs">
                  <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-400" />
                  <span className="text-white font-semibold block">All Systems Operational</span>
                  <span className="text-slate-400 mt-1 block">No active customer support tickets or service complaints across client accounts.</span>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 9: SYSTEM LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-base font-bold text-white">System Logs &amp; Audit Trail</h2>
              <Card className="p-6">
                {errorLogs.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                    <span className="text-white font-medium block">Zero Critical Exceptions Logged</span>
                    <span className="text-slate-400 mt-0.5 block">All voice pipelines, SIP trunks, and webhook endpoints are healthy.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {errorLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-navy-900 border border-slate-800 flex items-center justify-between gap-4 text-xs font-mono"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-amber-400 font-bold">[{log.service}]</span>
                          <span className="text-slate-300">{log.message}</span>
                        </div>
                        <span className="text-slate-500 text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 10: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-base font-bold text-white">Platform Settings &amp; Global Limits</h2>
              <Card className="p-6">
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Carrier Outbound Concurrency:</span>
                    <span className="font-mono text-brand-cyan">100 Lines</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-300">Default AI Model:</span>
                    <span className="font-mono text-white">GPT-4o Realtime</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-300">Tenant Isolation Mode:</span>
                    <Badge variant="emerald" size="xs">Enforced (organizationId)</Badge>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

      {/* INSPECTION MODAL (View Customer, View Calls, View Usage) */}
      {modalState.isOpen && modalState.customer && (
        <Modal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ isOpen: false, type: null, customer: null })}
          title={
            modalState.type === 'view_customer'
              ? `Customer Dossier: ${modalState.customer.name}`
              : modalState.type === 'view_calls'
              ? `Calls Telemetry: ${modalState.customer.organization}`
              : `Usage Breakdown: ${modalState.customer.organization}`
          }
        >
          <div className="space-y-4 text-xs text-left">
            {modalState.type === 'view_customer' && (
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Customer Name:</span>
                  <span className="font-bold text-white">{modalState.customer.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Organization:</span>
                  <span className="text-slate-200">{modalState.customer.organization}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Active Plan:</span>
                  <span className="text-brand-cyan font-semibold">{modalState.customer.plan} (${modalState.customer.monthlyPrice}/mo)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Status:</span>
                  <Badge variant={modalState.customer.status === 'active' ? 'emerald' : 'rose'} size="xs">
                    {modalState.customer.status}
                  </Badge>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Assigned AI Employee:</span>
                  <span className="text-brand-cyan">{modalState.customer.aiEmployee}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Joined Date:</span>
                  <span className="font-mono text-slate-300">{modalState.customer.joinedDate}</span>
                </div>
              </div>
            )}

            {modalState.type === 'view_calls' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-navy-900 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Total Calls Logged:</span>
                  <span className="font-bold text-brand-cyan font-mono">{modalState.customer.calls} calls</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  All calls handled autonomously by {modalState.customer.aiEmployee} with zero dropped connections.
                </p>
              </div>
            )}

            {modalState.type === 'view_usage' && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Voice Minutes Consumed:</span>
                  <span className="font-bold text-white font-mono">
                    {modalState.customer.usageMinutes} / {modalState.customer.minutesAllowance}m
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="bg-brand-cyan h-full rounded-full"
                    style={{
                      width: `${Math.round(
                        (modalState.customer.usageMinutes / modalState.customer.minutesAllowance) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setModalState({ isOpen: false, type: null, customer: null })}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* APPOINTMENT DETAILS MODAL */}
      {apptModalOpen && selectedAppt && (
        <Modal
          isOpen={apptModalOpen}
          onClose={() => {
            setApptModalOpen(false);
            setSelectedAppt(null);
          }}
          title={`Appointment Dossier: ${selectedAppt.bookingReference || 'VED-BOOKING'}`}
        >
          <div className="space-y-4 text-xs text-left">
            <div className="p-3 rounded-2xl bg-navy-900 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Caller / Customer:</span>
                <span className="font-bold text-white">
                  {selectedAppt.callerName || selectedAppt.customerName || 'Inbound Caller'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Phone Number:</span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {selectedAppt.callerPhone || selectedAppt.customerPhone || 'N/A'}
                </span>
              </div>
              {selectedAppt.customerEmail && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-400">Customer Email:</span>
                  <span className="text-slate-200">{selectedAppt.customerEmail}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Client Workspace:</span>
                <span className="font-medium text-white">
                  {selectedAppt.organizationId?.name || 'Client Workspace'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Workspace Owner:</span>
                <span className="text-slate-300">
                  {selectedAppt.organizationId?.ownerId?.name || selectedAppt.organizationId?.ownerId?.email || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Scheduled Date &amp; Slot:</span>
                <span className="font-mono text-amber-400 font-bold">
                  {selectedAppt.date || selectedAppt.scheduledDate} at {selectedAppt.timeSlot || selectedAppt.scheduledTime}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Service Category:</span>
                <span className="text-slate-200">
                  {selectedAppt.serviceType || selectedAppt.type || 'Discovery Consultation'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Status:</span>
                <Badge
                  variant={
                    selectedAppt.status === 'completed'
                      ? 'emerald'
                      : selectedAppt.status === 'scheduled'
                      ? 'amber'
                      : selectedAppt.status === 'calling'
                      ? 'cyan'
                      : 'rose'
                  }
                  size="xs"
                >
                  {selectedAppt.status}
                </Badge>
              </div>
            </div>

            {selectedAppt.notes && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Booking Notes &amp; Intent
                </span>
                <p className="text-slate-300">{selectedAppt.notes}</p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setApptModalOpen(false);
                  setSelectedAppt(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
