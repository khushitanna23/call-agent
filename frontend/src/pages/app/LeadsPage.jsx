import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Plus,
  RotateCcw,
  Kanban,
  Table as TableIcon,
  ChevronRight,
  Phone,
  Mail,
  Building,
  Target,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import { io } from 'socket.io-client';

export const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [stageCounts, setStageCounts] = useState({});
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [draggingLeadId, setDraggingLeadId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // New lead form
  const [newLeadData, setNewLeadData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    intent: 'General Service Inquiry',
    budget: '$5,000 - $10,000',
    pipelineStage: 'NEW',
    aiScore: 85,
  });

  const toast = useToast();

  const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'APPOINTMENT', 'PROPOSAL', 'WON', 'LOST'];

  useEffect(() => {
    fetchLeads();

    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    const orgId = localStorage.getItem('vedanco_org_id');
    socket.on('connect', () => {
      if (orgId) socket.emit('join_org', orgId);
    });

    socket.on('lead_updated', (updatedLead) => {
      toast.info(`🎯 Lead Qualified: ${updatedLead.name} (${updatedLead.pipelineStage || 'APPOINTMENT'})`);
      fetchLeads();
    });

    socket.on('appointment_booked', () => {
      fetchLeads();
    });

    return () => {
      socket.disconnect();
    };
  }, [stageFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const url = `/leads?stage=${stageFilter}${search ? `&search=${search}` : ''}`;
      const res = await api.get(url);
      if (res.data) setLeads(res.data);
      if (res.stageCounts) setStageCounts(res.stageCounts);
    } catch (err) {
      toast.error('Failed to load CRM leads');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (leadId, nextStage) => {
    try {
      await api.put(`/leads/${leadId}`, { pipelineStage: nextStage });
      toast.success(`Stage updated to ${nextStage}`);
      fetchLeads();
      if (selectedLead && selectedLead._id === leadId) {
        setSelectedLead((prev) => ({ ...prev, pipelineStage: nextStage }));
      }
    } catch (err) {
      toast.error('Failed to update stage');
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLeadData.name || !newLeadData.phone) {
      toast.error('Name and phone are required');
      return;
    }
    try {
      await api.post('/leads', newLeadData);
      toast.success('Lead added successfully!');
      setNewLeadModalOpen(false);
      setNewLeadData({
        name: '',
        phone: '',
        email: '',
        company: '',
        intent: 'General Service Inquiry',
        budget: '$5,000 - $10,000',
        pipelineStage: 'NEW',
        aiScore: 85,
      });
      fetchLeads();
    } catch (err) {
      toast.error('Failed to create lead');
    }
  };

  const scoreBadgeVariant = (score) => {
    if (score >= 90) return 'emerald';
    if (score >= 75) return 'cyan';
    if (score >= 60) return 'amber';
    return 'rose';
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Lead CRM Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Inbound prospective callers automatically captured, qualified, and scored by your AI Receptionist.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#0c0c0e] border border-emerald-950/80 shadow-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'kanban'
                  ? 'bg-emerald-500 text-black font-bold shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-emerald-500 text-black font-bold shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setNewLeadModalOpen(true)}
          >
            Add Lead
          </Button>
        </div>
      </div>

      {/* Search and Quick Stage Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
            placeholder="Search by name, company, phone..."
            className="w-full bg-navy-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-cyan"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setStageFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              stageFilter === 'all'
                ? 'bg-brand-cyan text-navy-950 font-bold shadow-glow'
                : 'bg-navy-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Leads ({leads.length})
          </button>
          {stages.slice(0, 5).map((st) => (
            <button
              key={st}
              onClick={() => setStageFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                stageFilter === st
                  ? 'bg-brand-cyan text-navy-950 font-bold shadow-glow'
                  : 'bg-navy-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st} {stageCounts[st] !== undefined ? `(${stageCounts[st]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* KANBAN VIEW (All 5 Stages with HTML5 Drag-and-Drop) */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
          {['NEW', 'CONTACTED', 'QUALIFIED', 'APPOINTMENT', 'PROPOSAL'].map((st) => {
            const stageLeads = leads.filter((l) => l.pipelineStage === st);
            const isTarget = dragOverStage === st;

            return (
              <div
                key={st}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverStage !== st) setDragOverStage(st);
                }}
                onDragLeave={() => {
                  if (dragOverStage === st) setDragOverStage(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedId = e.dataTransfer.getData('text/plain') || draggingLeadId;
                  if (droppedId) {
                    handleUpdateStage(droppedId, st);
                  }
                  setDraggingLeadId(null);
                  setDragOverStage(null);
                }}
                className={`rounded-2xl p-3.5 flex flex-col min-w-[240px] transition-all border ${
                  isTarget
                    ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-500/30'
                    : 'bg-[#0c0c0e]/80 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-bold text-white tracking-wider uppercase font-mono">
                      {st.replace('_', ' ')}
                    </span>
                  </div>
                  <Badge variant={stageLeads.length > 0 ? 'emerald' : 'cyan'} size="xs">
                    {stageLeads.length}
                  </Badge>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[580px] min-h-[140px]">
                  {stageLeads.length === 0 ? (
                    <div className="py-10 text-center text-gray-500 text-xs border border-dashed border-slate-800/80 rounded-xl">
                      Drop lead here
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={(e) => {
                          setDraggingLeadId(lead._id);
                          e.dataTransfer.setData('text/plain', lead._id);
                        }}
                        onDragEnd={() => {
                          setDraggingLeadId(null);
                          setDragOverStage(null);
                        }}
                        onClick={() => {
                          setSelectedLead(lead);
                          setIsLeadModalOpen(true);
                        }}
                        className={`p-3.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all flex flex-col gap-2 group shadow-sm ${
                          draggingLeadId === lead._id
                            ? 'opacity-40 border-dashed border-emerald-400 bg-emerald-950/30'
                            : 'bg-[#121216] border-slate-800 hover:border-emerald-500/40 hover:bg-[#16161c]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition leading-tight">
                            {lead.name}
                          </h4>
                          <Badge variant={scoreBadgeVariant(lead.aiScore)} size="xs">
                            <Sparkles className="w-2.5 h-2.5" /> {lead.aiScore}
                          </Badge>
                        </div>

                        {lead.company && (
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                            <Building className="w-3 h-3 text-gray-500 shrink-0" />
                            <span className="truncate">{lead.company}</span>
                          </div>
                        )}

                        <div className="text-[11px] text-emerald-300 font-medium truncate">
                          {lead.intent}
                        </div>

                        {lead.phone && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400">
                            <Phone className="w-2.5 h-2.5 text-gray-500" />
                            <span>{lead.phone}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-gray-400">
                          <span className="font-mono text-emerald-400 font-semibold">{lead.budget || '$5,000'}</span>
                          <span className="capitalize text-gray-500">{lead.source || 'Inbound Call'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (SECTION 19) */
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Lead Name / Company</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">AI Score</th>
                  <th className="py-3.5 px-4">Intent</th>
                  <th className="py-3.5 px-4">Budget</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-16 text-center text-gray-500">
                      <Target className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-400" />
                      <p className="font-semibold text-gray-300 text-sm">No leads captured yet</p>
                      <p className="text-gray-500 mt-1">Make a test call or receive incoming calls to see qualified leads appear here.</p>
                    </td>
                  </tr>
                ) : leads.map((l) => (
                  <tr key={l._id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{l.name}</div>
                      <div className="text-slate-400 text-[11px]">{l.company || 'Individual'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <div>{l.phone}</div>
                      <div className="text-[11px] text-slate-500">{l.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="cyan" size="xs">
                        {l.pipelineStage}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={scoreBadgeVariant(l.aiScore)} size="xs">
                        {l.aiScore} / 100
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-[150px] truncate">
                      {l.intent}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{l.budget}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedLead(l);
                            setIsLeadModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-navy-800 text-slate-300 hover:bg-navy-700 transition font-semibold"
                        >
                          Quick View
                        </button>
                        <Link
                          to={`/app/leads/${l._id}`}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-brand-cyan hover:bg-cyan-500/20 border border-cyan-500/30 transition font-semibold inline-flex items-center gap-1"
                        >
                          Detail <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* LEAD DETAILS MODAL / DRAWER */}
      {selectedLead && (
        <Modal
          isOpen={isLeadModalOpen}
          onClose={() => setIsLeadModalOpen(false)}
          title={`Lead: ${selectedLead.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 text-xs text-left">
            {/* Top overview badge strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-navy-900 border border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 block">AI Qualification Score</span>
                <span className="text-xl font-extrabold text-emerald-400 font-mono">
                  {selectedLead.aiScore} / 100
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Current Stage</span>
                <select
                  value={selectedLead.pipelineStage}
                  onChange={(e) => handleUpdateStage(selectedLead._id, e.target.value)}
                  className="bg-navy-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand-cyan font-semibold"
                >
                  {stages.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Lead Source</span>
                <span className="text-slate-300 font-medium">{selectedLead.source}</span>
              </div>
            </div>

            {/* Contact Specs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-navy-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Phone</span>
                <span className="font-mono text-white font-semibold">{selectedLead.phone}</span>
              </div>
              <div className="p-3 rounded-xl bg-navy-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Email</span>
                <span className="text-white">{selectedLead.email || 'Not provided'}</span>
              </div>
              <div className="p-3 rounded-xl bg-navy-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Company</span>
                <span className="text-white font-medium">{selectedLead.company || 'Individual'}</span>
              </div>
              <div className="p-3 rounded-xl bg-navy-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Budget Indicated</span>
                <span className="text-brand-cyan font-mono font-semibold">{selectedLead.budget}</span>
              </div>
            </div>

            {/* AI Call Summary */}
            <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 text-slate-300 space-y-1">
              <span className="font-bold text-white block">AI Receptionist Summary</span>
              <p className="leading-relaxed">
                {selectedLead.summary || 'Inbound inquiry captured and qualified during AI receptionist call.'}
              </p>
            </div>

            {/* Requirements */}
            {selectedLead.requirements && (
              <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 text-slate-300 space-y-1">
                <span className="font-bold text-white block">Specific Requirements</span>
                <p className="leading-relaxed">{selectedLead.requirements}</p>
              </div>
            )}

            {/* Link to Full Page */}
            <div className="pt-2 flex justify-end">
              <Link
                to={`/app/leads/${selectedLead._id}`}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-cyan to-brand-indigo hover:from-cyan-400 hover:to-indigo-500 text-white shadow-glow transition inline-flex items-center gap-1.5"
              >
                Open Full Lead Dossier <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE NEW LEAD MODAL */}
      <Modal
        isOpen={newLeadModalOpen}
        onClose={() => setNewLeadModalOpen(false)}
        title="Add New Lead Manually"
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs text-left">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Lead Name *</label>
            <input
              type="text"
              required
              value={newLeadData.name}
              onChange={(e) => setNewLeadData({ ...newLeadData, name: e.target.value })}
              placeholder="e.g. Jessica Vance"
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={newLeadData.phone}
                onChange={(e) => setNewLeadData({ ...newLeadData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email</label>
              <input
                type="email"
                value={newLeadData.email}
                onChange={(e) => setNewLeadData({ ...newLeadData, email: e.target.value })}
                placeholder="client@example.com"
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Company</label>
              <input
                type="text"
                value={newLeadData.company}
                onChange={(e) => setNewLeadData({ ...newLeadData, company: e.target.value })}
                placeholder="Company Holdings"
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Budget</label>
              <input
                type="text"
                value={newLeadData.budget}
                onChange={(e) => setNewLeadData({ ...newLeadData, budget: e.target.value })}
                placeholder="$5,000 - $10,000"
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setNewLeadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Lead to CRM
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
