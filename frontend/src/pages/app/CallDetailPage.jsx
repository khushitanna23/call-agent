import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PhoneCall,
  User,
  Bot,
  Copy,
  Download,
  Search,
  Check,
  Share2,
  Calendar,
  Sparkles,
  Volume2,
  Clock,
  ShieldAlert,
  Headphones,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { AudioPlayer } from '../../components/common/AudioPlayer';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const CallDetailPage = () => {
  const { id } = useParams();
  const [callData, setCallData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferPhone, setTransferPhone] = useState('+1 (555) 789-0123');
  const [transferReason, setTransferReason] = useState('Customer requested senior human representative');
  const [isTransferring, setIsTransferring] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCallDetails();
  }, [id]);

  const fetchCallDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/calls/${id}`);
      if (res.data) setCallData(res.data);
    } catch (err) {
      toast.error('Failed to load call details');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTranscript = () => {
    if (!callData?.transcript?.turns) return;
    const text = callData.transcript.turns
      .map((t) => `[${t.timestamp}] ${t.speaker.toUpperCase()}: ${t.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Transcript copied to clipboard!');
  };

  const handleDownloadTranscript = () => {
    if (!callData?.transcript?.turns) return;
    const text = callData.transcript.turns
      .map((t) => `[${t.timestamp}] ${t.speaker.toUpperCase()}: ${t.text}`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${callData.call.callId || id}.txt`;
    a.click();
    toast.success('Transcript downloaded!');
  };

  const handleExecuteTransfer = async () => {
    try {
      setIsTransferring(true);
      const res = await api.post(`/calls/${id}/transfer`, {
        targetPhoneNumber: transferPhone,
        reason: transferReason,
      });
      if (res.success) {
        toast.success(`Call transfer executed to ${transferPhone}`);
        setTransferModalOpen(false);
        fetchCallDetails();
      }
    } catch (e) {
      toast.error(e.message || 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        Loading call recording and transcript...
      </div>
    );
  }

  if (!callData?.call) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-slate-400">Call record not found.</p>
        <Link to="/app/calls">
          <Button variant="secondary" size="sm">
            Back to Calls
          </Button>
        </Link>
      </div>
    );
  }

  const { call, transcript, recording, summary } = callData;

  const filteredTurns = transcript?.turns?.filter((t) =>
    transcriptSearch ? t.text.toLowerCase().includes(transcriptSearch.toLowerCase()) : true
  );

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
      {/* Top back link and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/app/calls"
            className="p-2 rounded-xl bg-navy-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Call with {call.callerName}
              </h1>
              <Badge variant={call.status === 'completed' ? 'emerald' : 'indigo'} size="xs">
                {call.status}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {call.callId} • {new Date(call.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={Headphones}
            onClick={() => setTransferModalOpen(true)}
          >
            Transfer to Human
          </Button>
          <Button variant="secondary" size="sm" icon={Copy} onClick={handleCopyTranscript}>
            Copy Transcript
          </Button>
          <Button variant="secondary" size="sm" icon={Download} onClick={handleDownloadTranscript}>
            Download
          </Button>
        </div>
      </div>

      {/* Overview Cards & Recording Player */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recording Player & Summary */}
        <div className="lg:col-span-8 space-y-6">
          {/* Audio Player Card */}
          <Card className="p-6">
            <CardHeader
              title="Call Recording & Waveform"
              subtitle="Listen to full telephone exchange with speed controls"
            />
            <AudioPlayer
              audioUrl={recording?.recordingUrl}
              durationSeconds={call.durationSeconds || 120}
            />
          </Card>

          {/* AI Executive Summary Card */}
          <Card className="p-6">
            <CardHeader
              title="AI Executive Summary"
              subtitle="Synthesized takeaways, intent analysis, and recommended action items"
              action={
                <Badge variant="cyan" size="xs">
                  <Sparkles className="w-3 h-3" /> GPT-4o Analyzed
                </Badge>
              }
            />

            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 rounded-2xl bg-navy-900/90 border border-slate-800 text-slate-200">
                <span className="font-semibold text-brand-cyan block mb-1 text-[11px] uppercase tracking-wider">
                  Summary Overview
                </span>
                {summary?.summary || 'Customer engaged with AI Receptionist for discovery inquiry.'}
              </div>

              {/* Key Takeaways */}
              {summary?.keyTakeaways && summary.keyTakeaways.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-300 block">Key Takeaways</span>
                  <div className="space-y-1.5">
                    {summary.keyTakeaways.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action items */}
              {summary?.actionItems && summary.actionItems.length > 0 && (
                <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-slate-300">
                  <span className="font-bold text-brand-cyan block mb-1.5">Action Items</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {summary.actionItems.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Metadata & Lead Link */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6">
            <CardHeader title="Call Information" subtitle="Caller telemetry, AI employee, and timestamps" />
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Caller Phone:</span>
                <span className="font-mono font-semibold text-white">{call.callerNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">AI Employee:</span>
                <span className="font-semibold text-brand-cyan">{call.agentId?.name || 'Sarah (AI Receptionist)'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Start Time:</span>
                <span className="font-mono text-slate-300">
                  {new Date(call.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">End Time:</span>
                <span className="font-mono text-slate-300">
                  {new Date(new Date(call.createdAt || Date.now()).getTime() + (call.durationSeconds || 120) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Duration:</span>
                <span className="font-mono text-slate-200">
                  {Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Status:</span>
                <Badge variant={call.status === 'completed' || call.status === 'answered' ? 'emerald' : call.status === 'transferred' ? 'indigo' : 'rose'} size="xs">
                  {call.status}
                </Badge>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Detected Intent:</span>
                <span className="text-brand-cyan font-semibold">{call.intent}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Call Outcome:</span>
                <span className="text-emerald-400 font-semibold">{call.outcome}</span>
              </div>
            </div>
          </Card>

          {/* Linked Lead Information Card */}
          {call.leadId && (
            <Card className="p-6 border border-emerald-500/30">
              <CardHeader
                title="Lead Information"
                subtitle="Captured into CRM by Sarah"
                action={
                  <Link
                    to={`/app/leads/${call.leadId._id || call.leadId}`}
                    className="text-xs text-brand-cyan hover:underline font-semibold"
                  >
                    View Dossier
                  </Link>
                }
              />
              <div className="text-xs space-y-2">
                <div className="font-bold text-white text-sm">{call.leadId.name}</div>
                <div className="text-slate-400">{call.leadId.company || 'Private Client'}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="emerald" size="xs">
                    AI Score: {call.leadId.aiScore || 85}/100
                  </Badge>
                  <Badge variant="cyan" size="xs">
                    Stage: {call.leadId.pipelineStage || 'QUALIFIED'}
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Appointment Information Card */}
          <Card className="p-6 border border-slate-800">
            <CardHeader
              title="Appointment Information"
              subtitle="Scheduled consultation details"
              action={
                <Link
                  to="/app/appointments"
                  className="text-xs text-brand-cyan hover:underline font-semibold"
                >
                  Calendar
                </Link>
              }
            />
            {call.appointmentId ? (
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <Badge variant="emerald" size="xs">Confirmed</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-mono text-white">{call.appointmentId.date || 'Tomorrow'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time Slot:</span>
                  <span className="font-mono text-brand-cyan font-bold">{call.appointmentId.timeSlot || '10:30 AM'}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No consultation was booked during this call session.</p>
            )}
          </Card>
        </div>
      </div>

      {/* FULL SPEAKER TRANSCRIPT VIEWER (SECTION 18) */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Full Speaker-Attributed Transcript</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Accurate speech-to-text dialogue turns with second timestamps
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={transcriptSearch}
              onChange={(e) => setTranscriptSearch(e.target.value)}
              placeholder="Search transcript..."
              className="w-full bg-navy-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-cyan"
            />
          </div>
        </div>

        {/* Transcript turns list */}
        <div className="space-y-4">
          {filteredTurns && filteredTurns.length > 0 ? (
            filteredTurns.map((turn, index) => {
              const isAi = turn.speaker === 'ai';
              const isSystem = turn.speaker === 'system';
              return (
                <div
                  key={index}
                  className={`flex gap-4 items-start ${isSystem ? 'opacity-80' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                      isAi
                        ? 'bg-cyan-500/20 text-brand-cyan border border-cyan-500/30'
                        : isSystem
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : isSystem ? 'SYS' : <User className="w-4 h-4" />}
                  </div>

                  <div
                    className={`flex-1 rounded-2xl p-4 text-xs leading-relaxed border ${
                      isAi
                        ? 'bg-navy-900/90 border-slate-800 text-slate-200'
                        : isSystem
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200 font-mono text-[11px]'
                        : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span className="font-bold uppercase tracking-wider text-slate-300">
                        {isAi ? `${call.agentId?.name || 'Sarah'} (AI Receptionist)` : isSystem ? 'System Transfer' : call.callerName}
                      </span>
                      <span>{turn.timestamp || '00:00'}</span>
                    </div>
                    <p className="text-sm">{turn.text}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              No dialogue turns match your search filter.
            </div>
          )}
        </div>
      </Card>

      {/* Human Transfer Modal (Section 21) */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Human Call Handoff Transfer"
      >
        <div className="space-y-4 text-xs text-left">
          <p className="text-slate-300">
            Execute an immediate live phone handoff. The active caller will be bridged directly to the designated human telephone line.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Phone Number *
            </label>
            <input
              type="tel"
              value={transferPhone}
              onChange={(e) => setTransferPhone(e.target.value)}
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Transfer Reason
            </label>
            <input
              type="text"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div className="p-3 rounded-xl bg-navy-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-white block">Transferred Context:</span>
            <div>• Caller: {call.callerName} ({call.callerNumber})</div>
            <div>• Detected Intent: {call.intent}</div>
            <div>• AI Summary forwarded to receiving representative</div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isTransferring}
              onClick={handleExecuteTransfer}
            >
              Confirm Live Transfer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
