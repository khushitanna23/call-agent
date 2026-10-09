import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  PhoneCall,
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Radio,
  FileText,
  Volume2,
  Calendar,
  User,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export const CallsPage = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/client';

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subTab, setSubTab] = useState('all'); // 'all', 'live', 'recordings', 'transcripts'
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientsList, setClientsList] = useState([]);
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('all');
  const toast = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchClients();
    }
  }, [isAdmin]);

  const fetchClients = async () => {
    try {
      const res = await api.get('/admin/clients');
      if (res?.data) {
        setClientsList(res.data);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [statusFilter, selectedOrgFilter]);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      let url = `/calls?status=${statusFilter}${search ? `&search=${search}` : ''}`;
      if (isAdmin && selectedOrgFilter !== 'all') {
        url += `&organizationId=${selectedOrgFilter}`;
      }
      const res = await api.get(url);
      if (res.data) setCalls(res.data);
    } catch (err) {
      toast.error('Failed to load call logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCalls();
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
      case 'in-progress':
        return 'cyan';
      default:
        return 'default';
    }
  };

  // Filter based on subTab
  const displayedCalls = calls.filter((c) => {
    if (subTab === 'live') {
      return c.status === 'in-progress' || c.status === 'answered';
    }
    if (subTab === 'recordings') {
      return c.recordingUrl || c.status === 'completed' || c.status === 'transferred';
    }
    if (subTab === 'transcripts') {
      return c.status === 'completed' || c.status === 'transferred' || c.status === 'answered';
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Call Management & Logs
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Review live and past calls, inspect real-time audio recordings, transcripts, and AI qualification outcomes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121215] border border-emerald-500/30 text-xs">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-gray-400 hidden sm:inline">Workspace:</span>
              <select
                value={selectedOrgFilter}
                onChange={(e) => setSelectedOrgFilter(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-[#121215] text-white">All Workspaces (Platform-wide)</option>
                {clientsList.map((client) => (
                  <option key={client.id || client._id} value={client.id || client._id} className="bg-[#121215] text-white">
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button variant="outline" size="sm" icon={RotateCcw} onClick={fetchCalls}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs (Master SaaS Plan Requirement) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'all', label: 'All Calls', icon: PhoneCall, count: calls.length },
          {
            id: 'live',
            label: 'Live Calls',
            icon: Radio,
            count: calls.filter((c) => c.status === 'in-progress' || c.status === 'answered').length,
          },
          {
            id: 'recordings',
            label: 'Recordings',
            icon: Volume2,
            count: calls.filter((c) => c.status === 'completed' || c.status === 'transferred').length,
          },
          {
            id: 'transcripts',
            label: 'Transcripts',
            icon: FileText,
            count: calls.filter((c) => c.status !== 'missed').length,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-[#121215] text-gray-300 hover:text-white border border-emerald-950/80 shadow-xs'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-black/20 text-black font-bold' : 'bg-[#08080a] text-gray-400 border border-emerald-950/60'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by caller, phone, intent..."
            className="w-full bg-navy-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-cyan"
          />
        </form>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'completed', 'answered', 'transferred', 'missed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-navy-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Calls Table (Matching Master Plan Columns) */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Caller</th>
                <th className="py-3.5 px-4">AI Employee</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Intent</th>
                <th className="py-3.5 px-4">Outcome</th>
                <th className="py-3.5 px-4">Lead</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedCalls.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No call records match your current filters.
                  </td>
                </tr>
              ) : (
                displayedCalls.map((c) => (
                  <tr key={c._id} className="hover:bg-white/[0.02] transition">
                    {/* Caller */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-white text-sm">{c.callerName}</div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                        {c.callerNumber}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {c.callId || 'CALL-001'}
                      </span>
                    </td>

                    {/* AI Employee */}
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-200">
                        {c.agentId?.name || 'Sarah'}
                      </span>
                      <span className="text-[10px] text-brand-cyan block">AI Receptionist</span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-slate-300 font-mono text-[11px]">
                      <div>
                        {new Date(c.createdAt || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        {new Date(c.createdAt || Date.now()).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="py-4 px-4 font-mono text-slate-300">
                      {Math.floor(c.durationSeconds / 60)}m {c.durationSeconds % 60}s
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <Badge variant={statusVariant(c.status)} size="xs">
                        {c.status}
                      </Badge>
                    </td>

                    {/* Intent */}
                    <td className="py-4 px-4 text-slate-300 max-w-[140px] truncate">
                      {c.intent || 'General Inquiry'}
                    </td>

                    {/* Outcome */}
                    <td className="py-4 px-4 text-slate-400 max-w-[140px] truncate">
                      {c.outcome || 'Resolved'}
                    </td>

                    {/* Lead */}
                    <td className="py-4 px-4">
                      {c.leadId ? (
                        <Link
                          to={`${basePath}/leads/${c.leadId._id || c.leadId}`}
                          className="inline-flex items-center gap-1 text-brand-cyan hover:underline font-semibold"
                        >
                          <Badge variant="cyan" size="xs">
                            {c.leadId.name || 'Lead Dossier'}
                          </Badge>
                        </Link>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Unlinked</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`${basePath}/calls/${c._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-brand-cyan font-bold transition border border-slate-700 hover:border-cyan-500/50"
                      >
                        Review <ChevronRight className="w-3.5 h-3.5" />
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
  );
};
