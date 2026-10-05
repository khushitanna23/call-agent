import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inspection Modals
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'view_customer', 'view_calls', 'view_usage'
    customer: null,
  });

  const toast = useToast();

  // Admin Mock Data for All 9 Tabs
  const [customers, setCustomers] = useState([
    {
      id: 'cust-1',
      name: 'Alex Johnson',
      organization: 'Vedanco Demo',
      plan: 'Growth',
      monthlyPrice: 249,
      status: 'active',
      calls: 48,
      usageMinutes: 142,
      minutesAllowance: 1000,
      joinedDate: 'Aug 15, 2026',
      renewalDate: 'Oct 25, 2026',
      aiEmployee: 'Sarah',
    },
    {
      id: 'cust-2',
      name: 'Elena Rostova',
      organization: 'Premier Realty Advisors',
      plan: 'Business',
      monthlyPrice: 599,
      status: 'active',
      calls: 215,
      usageMinutes: 480,
      minutesAllowance: 2500,
      joinedDate: 'Jul 10, 2026',
      renewalDate: 'Nov 01, 2026',
      aiEmployee: 'Rachel',
    },
    {
      id: 'cust-3',
      name: 'Dr. Marcus Sterling',
      organization: 'Sterling Health Clinics',
      plan: 'Business',
      monthlyPrice: 599,
      status: 'active',
      calls: 342,
      usageMinutes: 890,
      minutesAllowance: 2500,
      joinedDate: 'Jun 22, 2026',
      renewalDate: 'Oct 28, 2026',
      aiEmployee: 'David',
    },
    {
      id: 'cust-4',
      name: 'David Kim',
      organization: 'Apex Hotel & Suites',
      plan: 'Growth',
      monthlyPrice: 249,
      status: 'active',
      calls: 128,
      usageMinutes: 310,
      minutesAllowance: 1000,
      joinedDate: 'Sep 01, 2026',
      renewalDate: 'Oct 15, 2026',
      aiEmployee: 'Sarah',
    },
    {
      id: 'cust-5',
      name: 'Victoria Vance',
      organization: 'Vance Auto Dealerships',
      plan: 'Starter',
      monthlyPrice: 99,
      status: 'suspended',
      calls: 35,
      usageMinutes: 82,
      minutesAllowance: 400,
      joinedDate: 'May 14, 2026',
      renewalDate: 'Nov 14, 2026',
      aiEmployee: 'Michael',
    },
  ]);

  const [callsList] = useState([
    {
      id: 'call-mon-1',
      customer: 'Vedanco Demo',
      aiEmployee: 'Sarah',
      caller: '+1 (555) 234-5678',
      duration: '2m 14s',
      status: 'completed',
      date: 'Today, 11:45 AM',
    },
    {
      id: 'call-mon-2',
      customer: 'Premier Realty Advisors',
      aiEmployee: 'Rachel',
      caller: '+1 (555) 987-6543',
      duration: '1m 48s',
      status: 'completed',
      date: 'Today, 11:32 AM',
    },
    {
      id: 'call-mon-3',
      customer: 'Sterling Health Clinics',
      aiEmployee: 'David',
      caller: '+1 (555) 345-6789',
      duration: '3m 05s',
      status: 'transferred',
      date: 'Today, 10:15 AM',
    },
    {
      id: 'call-mon-4',
      customer: 'Apex Hotel & Suites',
      aiEmployee: 'Sarah',
      caller: '+1 (555) 654-3210',
      duration: '0m 45s',
      status: 'missed',
      date: 'Yesterday, 04:20 PM',
    },
  ]);

  const errorLogs = [
    { id: '1', service: 'VoicePipeline', message: 'SIP Trunk latency normal (38ms)', timestamp: new Date() },
    { id: '2', service: 'WebhookGateway', message: 'Inbound carrier webhook delivered 200 OK', timestamp: new Date(Date.now() - 120000) },
    { id: '3', service: 'STTEngine', message: 'Transcriber speech confidence 98.4%', timestamp: new Date(Date.now() - 300000) },
    { id: '4', service: 'DatabaseCluster', message: 'Tenant shard health: 0 replication lag', timestamp: new Date(Date.now() - 600000) },
  ];

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/metrics').catch(() => null);
      if (res?.data) setMetrics(res.data);
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

  // Exactly matching Feature 6 metrics requirement:
  // MRR, Customers, Active Subscriptions, Total Calls, Total Minutes, AI Cost, Revenue, Gross Margin, Churn
  const m = {
    mrr: 14250,
    customers: customers.length,
    activeSubscriptions: customers.filter((c) => c.status === 'active').length,
    totalCalls: 1420,
    totalMinutes: 11450,
    aiCost: 428.5,
    revenue: 14250,
    grossMargin: 92.4,
    churn: '1.8%',
  };

  // Exactly matching Feature 6 sidebar items:
  // Dashboard, Customers, Subscriptions, Calls, Usage, Billing, Support, System Logs, Settings
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'calls', label: 'Calls', icon: PhoneCall },
    { id: 'usage', label: 'Usage', icon: Activity },
    { id: 'billing', label: 'Billing', icon: DollarSign },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'logs', label: 'System Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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

      {/* Main Layout: Admin Sidebar + Content Body (Feature 6 Requirement) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Admin Sidebar */}
        <div className="lg:col-span-3">
          <Card className="p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
              Admin Navigation
            </div>
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold shadow-glow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Admin Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: DASHBOARD (Feature 6: MRR, Customers, Subscriptions, Calls, Minutes, AI Cost, Revenue, Gross Margin, Churn) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-base font-bold text-white">Platform Overview &amp; Key Metrics</h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card className="p-4 border border-amber-500/30">
                  <span className="text-[11px] text-slate-400 block font-medium">MRR</span>
                  <span className="text-2xl font-extrabold text-amber-400 mt-1 block font-mono">
                    ${m.mrr.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> +18.4% MoM
                  </span>
                </Card>

                <Card className="p-4">
                  <span className="text-[11px] text-slate-400 block font-medium">Customers</span>
                  <span className="text-2xl font-extrabold text-white mt-1 block font-mono">
                    {m.customers}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Tenant accounts</span>
                </Card>

                <Card className="p-4">
                  <span className="text-[11px] text-slate-400 block font-medium">Active Subscriptions</span>
                  <span className="text-2xl font-extrabold text-emerald-400 mt-1 block font-mono">
                    {m.activeSubscriptions}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Paying organizations</span>
                </Card>

                <Card className="p-4">
                  <span className="text-[11px] text-slate-400 block font-medium">Calls</span>
                  <span className="text-2xl font-extrabold text-brand-cyan mt-1 block font-mono">
                    {m.totalCalls.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Handled by Sarah</span>
                </Card>

                <Card className="p-4">
                  <span className="text-[11px] text-slate-400 block font-medium">Minutes</span>
                  <span className="text-2xl font-extrabold text-white mt-1 block font-mono">
                    {m.totalMinutes.toLocaleString()}m
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Telephony consumed</span>
                </Card>

                <Card className="p-4">
                  <span className="text-[11px] text-slate-400 block font-medium">AI Cost</span>
                  <span className="text-2xl font-extrabold text-rose-400 mt-1 block font-mono">
                    ${m.aiCost}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Speech &amp; LLM tokens</span>
                </Card>

                <Card className="p-4">
                  <span className="text-[11px] text-slate-400 block font-medium">Revenue</span>
                  <span className="text-2xl font-extrabold text-emerald-400 mt-1 block font-mono">
                    ${m.revenue.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Gross billing</span>
                </Card>

                <Card className="p-4">
                  <span className="text-[11px] text-slate-400 block font-medium">Gross Margin</span>
                  <span className="text-2xl font-extrabold text-brand-indigo mt-1 block font-mono">
                    {m.grossMargin}%
                  </span>
                  <span className="text-[10px] text-emerald-400 mt-0.5 block">Profitable SaaS unit</span>
                </Card>

                <Card className="p-4">
                  <span className="text-[11px] text-slate-400 block font-medium">Churn</span>
                  <span className="text-2xl font-extrabold text-slate-200 mt-1 block font-mono">
                    {m.churn}
                  </span>
                  <span className="text-[10px] text-emerald-400 mt-0.5 block">Industry low</span>
                </Card>
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
                      {customers.map((c) => (
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
                      {customers.map((c) => (
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
                      {callsList.map((cl) => (
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

          {/* TAB 5: USAGE (Feature 6: Voice Minutes, AI Minutes, Calls, SMS, WhatsApp, Storage) */}
          {activeTab === 'usage' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-base font-bold text-white">Resource Usage Quotas &amp; Telemetry</h2>
                <p className="text-xs text-slate-400">Aggregate consumption across voice, AI tokens, messaging, and cloud media.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Voice Minutes', used: '11,450', total: '50,000 min', percent: 23, icon: PhoneCall, color: 'text-emerald-400' },
                  { title: 'AI Minutes', used: '4,280', total: '25,000 min', percent: 17, icon: Bot, color: 'text-teal-400' },
                  { title: 'Total Calls Handled', used: '1,420', total: '10,000 calls', percent: 14, icon: Phone, color: 'text-emerald-400' },
                  { title: 'SMS Dispatched', used: '890', total: '5,000 msgs', percent: 18, icon: MessageSquare, color: 'text-emerald-400' },
                  { title: 'WhatsApp Notifications', used: '420', total: '2,500 msgs', percent: 17, icon: Smartphone, color: 'text-green-400' },
                  { title: 'Cloud Audio Storage', used: '48.5 GB', total: '500 GB', percent: 10, icon: HardDrive, color: 'text-amber-400' },
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

          {/* TAB 6: BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-base font-bold text-white">Platform Invoicing &amp; Payouts</h2>
              <Card className="p-6">
                <CardHeader title="Gross Billing Telemetry" subtitle="Revenue generated across all organizations" />
                <div className="grid grid-cols-3 gap-4 text-center py-4 border-y border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-xs">Total Collected (MTD)</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">$14,250.00</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Pending Invoices</span>
                    <span className="text-xl font-bold text-amber-400 font-mono mt-1 block">$0.00</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Gateway Status</span>
                    <Badge variant="emerald" size="xs" className="mt-1">Active (Demo Mode)</Badge>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 7: SUPPORT */}
          {activeTab === 'support' && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-base font-bold text-white">Support Tickets &amp; Inquiries</h2>
              <Card className="p-6">
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-navy-900 border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">SIP Forwarding Query</span>
                      <span className="text-slate-400">From: Premier Realty Advisors</span>
                    </div>
                    <Badge variant="emerald" size="xs">Resolved</Badge>
                  </div>
                  <div className="p-3 rounded-xl bg-navy-900 border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">Custom Voice Model Request</span>
                      <span className="text-slate-400">From: Sterling Health Clinics</span>
                    </div>
                    <Badge variant="cyan" size="xs">In Progress</Badge>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 8: SYSTEM LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-base font-bold text-white">System Logs &amp; Audit Trail</h2>
              <Card className="p-6">
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
              </Card>
            </div>
          )}

          {/* TAB 9: SETTINGS */}
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
    </div>
  );
};
