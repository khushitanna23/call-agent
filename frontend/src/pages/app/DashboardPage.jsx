import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  PhoneCall,
  CheckCircle2,
  Users,
  Target,
  Calendar,
  Sparkles,
  Bot,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ChevronRight,
  AlertCircle,
  Plus,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const DashboardPage = () => {
  const { user, organization } = useAuth();
  const { agentOnline, onOpenVoiceDemo } = useOutletContext() || {};
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [agent, setAgent] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, callsRes, leadsRes, apptsRes, agentsRes] = await Promise.all([
        api.get('/analytics?timeRange=30d').catch(() => null),
        api.get('/calls?limit=6').catch(() => null),
        api.get('/leads?limit=5').catch(() => null),
        api.get('/appointments?limit=4').catch(() => null),
        api.get('/agents').catch(() => null),
      ]);

      if (analyticsRes?.metrics) {
        setMetrics(analyticsRes.metrics);
        setChartData(analyticsRes.charts?.activityChart || []);
      }

      if (callsRes?.data) setRecentCalls(callsRes.data);
      if (leadsRes?.data) setRecentLeads(leadsRes.data);
      if (apptsRes?.data) setUpcomingAppointments(apptsRes.data);
      if (agentsRes?.data && agentsRes.data.length > 0) setAgent(agentsRes.data[0]);
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateCall = async () => {
    try {
      toast.info('Simulating incoming customer call...');
      const res = await api.post('/calls/simulate', {
        callerName: 'Inbound Caller',
        callerNumber: '+1 (800) ' + Math.floor(100 + Math.random() * 900) + '-4499',
        intent: 'Appointment & Consultation Inquiry',
      });
      if (res.success) {
        toast.success('Inbound call processed, qualified, and synchronized with CRM!');
        fetchDashboardData();
      }
    } catch (e) {
      toast.error('Simulation error: ' + (e.message || 'Failed'));
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const statusVariant = (status) => {
    switch (status) {
      case 'completed':
      case 'answered':
        return 'emerald';
      case 'transferred':
        return 'indigo';
      case 'missed':
      case 'failed':
        return 'rose';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {getGreeting()}, {user?.name || 'Partner'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Here is your AI Receptionist performance overview for{' '}
            <strong className="text-white font-semibold">{organization?.name || 'Your Company'}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>

          <Link to="/app/appointments?book=true">
            <Button
              variant="secondary"
              size="sm"
              icon={Calendar}
              className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
            >
              Book Appointment
            </Button>
          </Link>

          <Button
            variant="secondary"
            size="sm"
            icon={Sparkles}
            onClick={handleSimulateCall}
            title="Simulate inbound call event"
          >
            Simulate Call
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={PhoneCall}
            onClick={onOpenVoiceDemo}
          >
            Talk to AI
          </Button>
        </div>
      </div>

      {/* AI RECEPTIONIST LIVE STATUS WIDGET (SECTION 8) */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-glow relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Agent info */}
          <div className="lg:col-span-4 flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-cyan to-brand-indigo flex items-center justify-center text-white shadow-glow">
                <Bot className="w-9 h-9" />
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-navy-950 ${
                  agentOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  {agent?.name || 'Sarah'}
                </h3>
                <Badge variant={agentOnline ? 'emerald' : 'rose'} size="xs">
                  {agentOnline ? 'ONLINE' : 'OFFLINE'}
                </Badge>
              </div>
              <p className="text-xs font-mono text-cyan-400 font-semibold mt-0.5">
                {agent?.phoneNumber || organization?.phoneNumbers?.[0]?.number || '+1 (800) 555-0199'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {agent?.industry || 'Technology'} • {agent?.voice?.style || 'Friendly'} Voice
              </p>
            </div>
          </div>

          {/* Quick Real-Time Metrics Counters */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-navy-900/80 p-3 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Calls Today</span>
              <span className="text-xl font-extrabold text-white mt-0.5 block">
                {agent?.totalCallsCount ?? 0}
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> 100% answered
              </span>
            </div>

            <div className="bg-navy-900/80 p-3 rounded-2xl border border-slate-800 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 block font-medium">Minutes Used</span>
                <Link
                  to="/app/billing"
                  className="text-[10px] text-brand-cyan hover:underline font-semibold"
                >
                  + Refill
                </Link>
              </div>
              <span className="text-xl font-extrabold text-brand-cyan mt-0.5 block">
                {organization?.minutesUsed ?? 0}m
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                of {organization?.minutesAllowance || 1000}m
              </span>
            </div>

            <div className="bg-navy-900/80 p-3 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Leads Captured</span>
              <span className="text-xl font-extrabold text-indigo-400 mt-0.5 block">
                {metrics?.leadsCount ?? 0}
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5 font-semibold">
                {metrics?.leadRate ?? 0}% conversion
              </span>
            </div>

            <div className="bg-navy-900/80 p-3 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Appointments</span>
              <span className="text-xl font-extrabold text-emerald-400 mt-0.5 block">
                {metrics?.appointmentsBooked ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Calendar Synced</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOP STAT CARDS (SECTION 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: 'Total Calls',
            value: metrics?.totalCalls ?? 0,
            subtext: 'Across all channels',
            icon: PhoneCall,
            color: 'cyan',
          },
          {
            label: 'Answered Calls',
            value: metrics?.answeredCalls ?? 0,
            subtext: `${metrics?.aiResolutionRate ?? 0}% AI Resolution`,
            icon: CheckCircle2,
            color: 'emerald',
          },
          {
            label: 'Leads Captured',
            value: metrics?.leadsCount ?? 0,
            subtext: 'Auto CRM synced',
            icon: Users,
            color: 'indigo',
          },
          {
            label: 'Qualified Leads',
            value: metrics?.qualifiedLeads ?? 0,
            subtext: `Avg AI score: ${metrics?.avgScore ?? 0}/100`,
            icon: Target,
            color: 'amber',
          },
          {
            label: 'Appointments',
            value: metrics?.appointmentsBooked ?? 0,
            subtext: `${metrics?.bookingRate ?? 0}% booking rate`,
            icon: Calendar,
            color: 'emerald',
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="p-5 flex flex-col justify-between" hover>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">{stat.label}</span>
                <div className="w-8 h-8 rounded-lg bg-navy-800 text-brand-cyan flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  {stat.value}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">{stat.subtext}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* MAIN CHART & RECENT CALLS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Call Volume Activity Chart */}
        <div className="lg:col-span-7">
          <Card className="p-6 h-full flex flex-col justify-between">
            <CardHeader
              title="Call Activity & Answered Volume"
              subtitle="Hourly and daily trends handled autonomously by your AI Receptionist"
              action={
                <Badge variant="cyan" size="xs">
                  Past 14 Days
                </Badge>
              }
            />

            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorAnswered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    name="Total Calls"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCalls)"
                  />
                  <Area
                    type="monotone"
                    dataKey="answered"
                    name="Answered"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAnswered)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-cyan"></span> Total Inbound
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> AI Resolved
                </span>
              </div>
              <Link to="/app/analytics" className="text-brand-cyan hover:underline flex items-center gap-1">
                Full Metrics <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Upcoming Appointments Quick View */}
        <div className="lg:col-span-5">
          <Card className="p-6 h-full flex flex-col justify-between">
            <CardHeader
              title="Upcoming Appointments"
              subtitle="Confirmed consultations scheduled by AI"
              action={
                <Link to="/app/appointments" className="text-xs text-brand-cyan hover:underline">
                  View All
                </Link>
              }
            />

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[260px]">
              {upcomingAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-xs">
                  <Calendar className="w-8 h-8 mb-2 opacity-50" />
                  No appointments scheduled today.
                </div>
              ) : (
                upcomingAppointments.slice(0, 4).map((appt) => (
                  <div
                    key={appt._id}
                    className="p-3 rounded-2xl bg-navy-900/80 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 text-xs font-bold">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{appt.customerName}</h4>
                        <p className="text-[11px] text-slate-400">
                          {appt.type} • {appt.customerPhone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-semibold text-brand-cyan block">
                        {appt.timeSlot}
                      </span>
                      <span className="text-[10px] text-slate-500 block">{appt.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <Link to="/app/appointments">
                <Button variant="outline" size="sm" className="w-full">
                  Manage Calendar Slots
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* RECENT CALLS TABLE & RECENT LEADS (SECTION 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Calls Table */}
        <div className="lg:col-span-8">
          <Card className="p-6">
            <CardHeader
              title="Recent Inbound Calls"
              subtitle="Latest recordings, transcripts, and AI qualification outcomes"
              action={
                <Link to="/app/calls" className="text-xs text-brand-cyan hover:underline flex items-center gap-1">
                  View All Calls <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              }
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">Call ID / Caller</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Intent</th>
                    <th className="py-3 px-3">Outcome</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentCalls.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No recent calls recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentCalls.map((call) => (
                      <tr key={call._id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{call.callerName}</div>
                          <div className="font-mono text-[11px] text-slate-400">
                            {call.callerNumber}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={statusVariant(call.status)} size="xs">
                            {call.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-300 max-w-[150px] truncate">
                          {call.intent}
                        </td>
                        <td className="py-3 px-3 text-slate-400 max-w-[160px] truncate">
                          {call.outcome}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to={`/app/calls/${call._id}`}
                            className="px-2.5 py-1 rounded-lg bg-navy-800 text-brand-cyan hover:bg-navy-700 transition font-semibold"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Recent High-Intent Leads */}
        <div className="lg:col-span-4">
          <Card className="p-6">
            <CardHeader
              title="Recent Qualified Leads"
              subtitle="Automatically scored by AI Receptionist"
              action={
                <Link to="/app/leads" className="text-xs text-brand-cyan hover:underline">
                  CRM Pipeline
                </Link>
              }
            />

            <div className="space-y-3">
              {recentLeads.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No leads captured yet.
                </div>
              ) : (
                recentLeads.slice(0, 5).map((lead) => (
                  <div
                    key={lead._id}
                    className="p-3 rounded-2xl bg-navy-900/80 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{lead.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                        {lead.company || lead.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={lead.aiScore >= 90 ? 'emerald' : 'cyan'}
                        size="xs"
                        className="font-mono"
                      >
                        {lead.aiScore}/100
                      </Badge>
                      <Link
                        to={`/app/leads`}
                        className="p-1 text-slate-400 hover:text-white transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
