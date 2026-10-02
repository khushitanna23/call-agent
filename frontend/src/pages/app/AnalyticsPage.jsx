import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  PhoneCall,
  CheckCircle2,
  Users,
  Target,
  Calendar,
  DollarSign,
  PieChart as PieIcon,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/analytics?timeRange=${timeRange}`);
      if (res.metrics) setData(res);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#ec4899'];
  const OUTCOME_COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#f43f5e'];

  const metrics = data?.metrics || {
    totalCalls: 48,
    answeredCalls: 45,
    missedCalls: 3,
    averageDurationSeconds: 118,
    leadsCount: 29,
    qualifiedLeads: 22,
    appointmentsBooked: 14,
    transfersCount: 3,
    aiResolutionRate: 94,
    bookingRate: 29,
    leadRate: 60,
    transferRate: 6,
    averageCallCost: 0.18,
    totalCost: 8.64,
  };

  const activityChart = data?.charts?.activityChart || [
    { time: 'Sep 01', calls: 8, leads: 5 },
    { time: 'Sep 05', calls: 12, leads: 7 },
    { time: 'Sep 10', calls: 15, leads: 9 },
    { time: 'Sep 15', calls: 10, leads: 6 },
    { time: 'Sep 20', calls: 18, leads: 11 },
    { time: 'Sep 25', calls: 22, leads: 14 },
    { time: 'Sep 28', calls: 16, leads: 10 },
  ];

  const intentData = data?.charts?.intentData || [
    { name: 'Service Inquiry', value: 45 },
    { name: 'Appointment Booking', value: 28 },
    { name: 'Pricing Questions', value: 18 },
    { name: 'Human Support', value: 9 },
  ];

  // Master Plan Chart 3: Appointments over time
  const appointmentChart = [
    { period: 'Week 1', booked: 3, completed: 3 },
    { period: 'Week 2', booked: 5, completed: 4 },
    { period: 'Week 3', booked: 4, completed: 4 },
    { period: 'Week 4', booked: 6, completed: 5 },
  ];

  // Master Plan Chart 4: Call Outcomes and disposition
  const outcomeData = [
    { name: 'Resolved by AI', value: 28 },
    { name: 'Qualified CRM Lead', value: 22 },
    { name: 'Appointment Booked', value: 14 },
    { name: 'Transferred to Human', value: 3 },
    { name: 'Missed Call', value: 3 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Call Analytics & Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Real-time resolution rates, conversion funnels, customer intents, and front-desk efficiency metrics.
          </p>
        </div>

        {/* Time filters */}
        <div className="flex items-center gap-2">
          {['today', '7d', '30d'].map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition ${
                timeRange === r
                  ? 'bg-emerald-500 text-black font-bold shadow-xs'
                  : 'bg-[#121215] text-gray-300 hover:text-white border border-emerald-950/80 shadow-xs'
              }`}
            >
              {r === '30d' ? '30 Days' : r === '7d' ? '7 Days' : 'Today'}
            </button>
          ))}
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={fetchAnalytics} />
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4">
          <span className="text-[11px] text-slate-400 block font-medium">Total Calls</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">{metrics.totalCalls}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">100% Inbound</span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] text-slate-400 block font-medium">Resolution Rate</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
            {metrics.aiResolutionRate}%
          </span>
          <span className="text-[10px] text-emerald-400/80 mt-0.5 block">Autonomous</span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] text-slate-400 block font-medium">Avg Duration</span>
          <span className="text-2xl font-extrabold text-cyan-400 mt-1 block font-mono">
            {Math.floor(metrics.averageDurationSeconds / 60)}m {metrics.averageDurationSeconds % 60}s
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Per call</span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] text-slate-400 block font-medium">Lead Conversion</span>
          <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">{metrics.leadRate}%</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">{metrics.leadsCount} captured</span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] text-slate-400 block font-medium">Booking Rate</span>
          <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{metrics.bookingRate}%</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">{metrics.appointmentsBooked} booked</span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] text-slate-400 block font-medium">Avg Call Cost</span>
          <span className="text-2xl font-extrabold text-white mt-1 block font-mono">
            ${metrics.averageCallCost}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">vs $15 human/hr</span>
        </Card>
      </div>

      {/* CHARTS ROW 1: Calls & Leads Over Time + Intent Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Call Volumes & Conversion Area Chart */}
        <div className="lg:col-span-8">
          <Card className="p-6">
            <CardHeader
              title="Call Volumes & Lead Generation"
              subtitle="Comparison between inbound dials, answered calls, and qualified leads"
            />
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="anCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="anLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
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
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    name="Inbound Calls"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#anCalls)"
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    name="Captured Leads"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#anLeads)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Chart 2: Intent Distribution Donut Chart */}
        <div className="lg:col-span-4">
          <Card className="p-6 h-full flex flex-col justify-between">
            <CardHeader
              title="Caller Intent Breakdown"
              subtitle="Classified automatically by AI during dialogue"
            />
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={intentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {intentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
              {intentData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="truncate max-w-[150px]">{item.name}</span>
                  </div>
                  <span className="font-mono font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* CHARTS ROW 2 (Master Plan Requirement): Appointments & Call Outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 3: Appointments Booked & Completed Bar Chart */}
        <div className="lg:col-span-7">
          <Card className="p-6">
            <CardHeader
              title="Appointments & Consultations Booked"
              subtitle="Weekly schedule volume and successful completion tracking"
              action={
                <Badge variant="emerald" size="xs">
                  {metrics.appointmentsBooked} Total Bookings
                </Badge>
              }
            />
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appointmentChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="booked" name="Booked Consultations" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" name="Completed Consultations" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Chart 4: Call Outcomes & Disposition Donut Chart */}
        <div className="lg:col-span-5">
          <Card className="p-6 h-full flex flex-col justify-between">
            <CardHeader
              title="Call Outcomes & Disposition"
              subtitle="End result of all front-desk inbound telephone sessions"
            />
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {outcomeData.map((entry, index) => (
                      <Cell key={`outcome-cell-${index}`} fill={OUTCOME_COLORS[index % OUTCOME_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
              {outcomeData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: OUTCOME_COLORS[idx % OUTCOME_COLORS.length] }}
                    />
                    <span className="truncate max-w-[170px]">{item.name}</span>
                  </div>
                  <span className="font-mono font-semibold">{item.value} calls</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
