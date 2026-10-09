import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Building,
  Target,
  Sparkles,
  Calendar,
  Clock,
  PhoneCall,
  CheckCircle2,
  Send,
  MessageSquare,
  ShieldCheck,
  Tag,
  DollarSign,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const LeadDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/client';
  const [leadData, setLeadData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'APPOINTMENT', 'PROPOSAL', 'WON', 'LOST'];

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/leads/${id}`);
      if (res.data) {
        setLeadData(res.data.lead || res.data);
        setActivities(res.data.activities || []);
      }
    } catch (err) {
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (nextStage) => {
    try {
      setIsUpdatingStage(true);
      const res = await api.put(`/leads/${id}`, { pipelineStage: nextStage });
      if (res.success) {
        toast.success(`Pipeline stage updated to ${nextStage}`);
        setLeadData((prev) => ({ ...prev, pipelineStage: nextStage }));
        // Refresh details to fetch new activity entry
        fetchLeadDetails();
      }
    } catch (err) {
      toast.error('Failed to update stage');
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      setIsSubmittingNote(true);
      const res = await api.post(`/leads/${id}/activity`, {
        title: noteTitle.trim() || 'Internal Follow-up Note',
        description: noteText.trim(),
        type: 'note',
      });
      if (res.success) {
        toast.success('Activity note saved!');
        setNoteTitle('');
        setNoteText('');
        fetchLeadDetails();
      }
    } catch (err) {
      toast.error('Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const scoreBadgeVariant = (score) => {
    if (score >= 90) return 'emerald';
    if (score >= 75) return 'cyan';
    if (score >= 60) return 'amber';
    return 'rose';
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand-cyan border-t-transparent animate-spin" />
        Loading lead dossier and activity timeline...
      </div>
    );
  }

  if (!leadData) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Lead Record Not Found</h2>
        <p className="text-xs text-slate-400 mb-4">The requested lead does not exist or has been deleted.</p>
        <Link to={`${basePath}/leads`}>
          <Button variant="secondary" size="sm">
            Return to CRM Pipeline
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Back button */}
      <div>
        <Link
          to={`${basePath}/leads`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-emerald-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to CRM Pipeline
        </Link>
      </div>

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 glass-card rounded-2xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-brand-cyan flex items-center justify-center font-bold text-xl shrink-0">
            {leadData.name ? leadData.name.charAt(0).toUpperCase() : 'L'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{leadData.name}</h1>
              <Badge variant={scoreBadgeVariant(leadData.aiScore)} size="sm">
                <Sparkles className="w-3.5 h-3.5" /> AI Score: {leadData.aiScore}/100
              </Badge>
              <Badge variant="default" size="sm" className="font-mono uppercase">
                {leadData.pipelineStage}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-400">
              {leadData.company && (
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  {leadData.company}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono">{leadData.phone}</span>
              </span>
              {leadData.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {leadData.email}
                </span>
              )}
              <span className="text-slate-500">
                Source: <strong className="text-slate-400">{leadData.source}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`tel:${leadData.phone}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition"
          >
            <PhoneCall className="w-4 h-4" /> Dial Lead
          </a>
          {leadData.email && (
            <a
              href={`mailto:${leadData.email}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-navy-800 text-slate-300 border border-slate-700 hover:text-white transition"
            >
              <Mail className="w-4 h-4" /> Email
            </a>
          )}
        </div>
      </div>

      {/* Pipeline Stage Transition Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pipeline Stage Progression
          </span>
          <span className="text-[11px] text-slate-500">
            Click any stage to update lead status
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {stages.map((st) => {
            const isCurrent = leadData.pipelineStage === st;
            return (
              <button
                key={st}
                disabled={isUpdatingStage}
                onClick={() => handleUpdateStage(st)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition text-center border ${
                  isCurrent
                    ? 'bg-brand-cyan text-navy-950 font-bold border-cyan-400 shadow-glow'
                    : 'bg-navy-900 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: AI Qualification & Lead Info */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Qualification Overview */}
          <Card className="p-6 border border-cyan-500/20">
            <CardHeader
              title="AI Lead Qualification Dossier"
              subtitle="Synthesized autonomously from customer conversation"
              action={
                <Badge variant={scoreBadgeVariant(leadData.aiScore)} size="xs">
                  {leadData.aiScore >= 80 ? 'Highly Qualified' : 'Standard Priority'}
                </Badge>
              }
            />

            <div className="space-y-4 text-xs">
              {leadData.summary && (
                <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 text-slate-300">
                  <span className="text-[11px] font-bold uppercase text-brand-cyan block mb-1">
                    AI Conversation Summary
                  </span>
                  <p className="leading-relaxed text-slate-200">{leadData.summary}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Customer Intent</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">
                    {leadData.intent || 'General Inquiry'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Estimated Budget</span>
                  <span className="font-bold text-emerald-400 text-sm mt-0.5 font-mono block">
                    {leadData.budget || 'To Be Determined'}
                  </span>
                </div>
              </div>

              {leadData.requirements && (
                <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 text-slate-300">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Identified Specific Requirements
                  </span>
                  <p className="leading-relaxed text-slate-200">{leadData.requirements}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Linked Call & Appointment Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Last Call */}
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">
                  Last Phone Call
                </span>
                {leadData.lastCallId ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Call ID:</span>
                      <span className="font-mono text-white">
                        {leadData.lastCallId.callId || leadData.lastCallId._id?.substring(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <span className="font-mono text-cyan-400">
                        {leadData.lastCallId.durationSeconds || 120}s
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Outcome:</span>
                      <span className="text-white capitalize">
                        {leadData.lastCallId.outcome || 'Qualified'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No recorded call linked to this lead.</p>
                )}
              </div>

              {leadData.lastCallId && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <Link
                    to={`/app/calls/${leadData.lastCallId._id || leadData.lastCallId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-cyan hover:underline"
                  >
                    View Call Audio & Transcript <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </Card>

            {/* Scheduled Appointment */}
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">
                  Scheduled Consultation
                </span>
                {leadData.appointmentId ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Date:</span>
                      <span className="font-mono text-white">
                        {leadData.appointmentId.date}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Slot:</span>
                      <span className="font-mono text-brand-cyan">
                        {leadData.appointmentId.timeSlot}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white capitalize">
                        {leadData.appointmentId.type || 'Discovery'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No active appointment scheduled.</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <Link
                  to={`${basePath}/appointments`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-cyan hover:underline"
                >
                  Manage Appointments <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column: Activity Timeline & Internal Notes */}
        <div className="lg:col-span-5 space-y-6">
          {/* Add Note Form */}
          <Card className="p-6">
            <CardHeader
              title="Add Activity Note"
              subtitle="Record manual interactions, callbacks, and internal team memos"
            />

            <form onSubmit={handleAddNote} className="space-y-3 text-xs">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note Title (e.g. Discussed pricing over email)"
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-cyan"
              />
              <textarea
                rows={3}
                required
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write detailed notes here..."
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-cyan resize-none"
              />
              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingNote}>
                  Save Note
                </Button>
              </div>
            </form>
          </Card>

          {/* Activity Timeline */}
          <Card className="p-6">
            <CardHeader
              title="CRM Activity Timeline"
              subtitle="Chronological log of AI actions, stage changes, and team updates"
            />

            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-brand-cyan" />
                  No timeline activities recorded yet.
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act._id} className="flex gap-3 text-xs">
                    <div className="w-8 h-8 rounded-xl bg-navy-900 border border-slate-800 text-brand-cyan flex items-center justify-center shrink-0 mt-0.5">
                      {act.type === 'stage_change' ? (
                        <Tag className="w-4 h-4 text-brand-indigo" />
                      ) : act.type === 'call' ? (
                        <PhoneCall className="w-4 h-4 text-brand-cyan" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-white">{act.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(act.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{act.description}</p>
                      {act.performedBy && (
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          By: {act.performedBy}
                        </span>
                      )}
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
