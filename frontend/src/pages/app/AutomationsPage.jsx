import React, { useState } from 'react';
import {
  Zap,
  Plus,
  CheckCircle2,
  MessageSquare,
  Mail,
  Webhook,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Calendar,
  UserCheck,
  PhoneMissed,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

export const AutomationsPage = () => {
  // Pre-configured Master Plan Templates
  const templates = [
    {
      id: 'tmpl-new-lead',
      name: 'New Lead Follow-up',
      trigger: 'lead_qualified',
      action: 'send_sms_followup',
      description: 'Sends an instant personalized SMS and intro dossier within 60 seconds of AI qualification.',
      channel: 'SMS & Email',
      icon: UserCheck,
    },
    {
      id: 'tmpl-appt-reminder',
      name: 'Appointment Reminder',
      trigger: 'appointment_booked',
      action: 'send_sms_reminder',
      description: 'Dispatches automated reminder text 24 hours and 1 hour before scheduled consultation.',
      channel: 'SMS',
      icon: Calendar,
    },
    {
      id: 'tmpl-missed-call',
      name: 'Missed Call Follow-up',
      trigger: 'call_missed',
      action: 'send_sms_callback',
      description: 'Instantly texts callers when an inbound line drops: "Sorry we missed you! How can we assist?"',
      channel: 'Instant SMS',
      icon: PhoneMissed,
    },
    {
      id: 'tmpl-lead-qual',
      name: 'Lead Qualification & CRM Sync',
      trigger: 'call_completed',
      action: 'ai_lead_qualification',
      description: 'Runs real-time AI scoring (0-100), extracts budget/intent, and syncs dossier to CRM.',
      channel: 'AI Engine',
      icon: Sparkles,
    },
  ];

  const [automations, setAutomations] = useState([]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newAuto, setNewAuto] = useState({
    name: '',
    trigger: 'appointment_booked',
    action: 'send_sms_confirmation',
  });

  const toast = useToast();

  const handleToggle = (id) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
    toast.info('Automation rule updated');
  };

  const handleActivateTemplate = (tmpl) => {
    const existing = automations.find((a) => a.name === tmpl.name);
    if (existing) {
      if (!existing.isActive) {
        handleToggle(existing.id);
        toast.success(`${tmpl.name} activated!`);
      } else {
        toast.info(`${tmpl.name} is already active.`);
      }
      return;
    }

    setAutomations([
      ...automations,
      {
        id: 'auto-' + Date.now(),
        name: tmpl.name,
        trigger: tmpl.trigger,
        action: tmpl.action,
        isActive: true,
        executionCount: 0,
      },
    ]);
    toast.success(`Template installed: ${tmpl.name}!`);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newAuto.name) return;
    setAutomations([
      ...automations,
      {
        id: 'auto-' + Date.now(),
        name: newAuto.name,
        trigger: newAuto.trigger,
        action: newAuto.action,
        isActive: true,
        executionCount: 0,
      },
    ]);
    toast.success('Automation rule created!');
    setCreateModalOpen(false);
    setNewAuto({ name: '', trigger: 'appointment_booked', action: 'send_sms_confirmation' });
  };

  const formatText = (text) => text.replace(/_/g, ' ');

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Workflow Automations & Triggers
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Build rules to fire SMS notifications, dispatch emails, or call webhooks when call events occur.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setCreateModalOpen(true)}>
          New Automation
        </Button>
      </div>

      {/* 4 PRE-CONFIGURED MASTER PLAN AUTOMATION TEMPLATES */}
      <Card className="p-6 border border-cyan-500/20">
        <CardHeader
          title="Master SaaS Plan Templates"
          subtitle="Pre-configured, battle-tested receptionist automations ready for one-click deployment"
          action={
            <Badge variant="cyan" size="xs">
              <Sparkles className="w-3 h-3" /> 4 Recommended Templates
            </Badge>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((tmpl) => {
            const Icon = tmpl.icon;
            const isInstalled = automations.some((a) => a.name === tmpl.name && a.isActive);
            return (
              <div
                key={tmpl.id}
                className="p-4 rounded-xl bg-navy-900 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/40 transition group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-brand-cyan flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge variant={isInstalled ? 'emerald' : 'default'} size="xs">
                      {isInstalled ? 'Active' : 'Ready'}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-brand-cyan transition mb-1">
                    {tmpl.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    {tmpl.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">{tmpl.channel}</span>
                  <button
                    onClick={() => handleActivateTemplate(tmpl)}
                    className={`text-[11px] font-semibold transition ${
                      isInstalled
                        ? 'text-emerald-400 cursor-default'
                        : 'text-brand-cyan hover:underline'
                    }`}
                  >
                    {isInstalled ? 'Enabled ✓' : 'Enable +'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ACTIVE AUTOMATION RULES */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
          Active Automation Rules ({automations.length})
        </h2>

        <div className="space-y-4">
          {automations.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-slate-800">
              <Zap className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">No Active Automation Rules</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-3">
                No custom or active workflows are currently enabled. Deploy any master template above with 1-click or create a custom rule.
              </p>
              <Button variant="outline" size="sm" icon={Plus} onClick={() => setCreateModalOpen(true)}>
                Build Custom Rule
              </Button>
            </Card>
          ) : (
            automations.map((auto) => (
              <Card key={auto.id} className="p-5" hover>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                        auto.isActive
                          ? 'bg-cyan-500/10 border-cyan-500/30 text-brand-cyan shadow-glow'
                          : 'bg-navy-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      <Zap className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white">{auto.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                        <span className="text-slate-400">Trigger:</span>
                        <Badge variant="cyan" size="xs">
                          {formatText(auto.trigger)}
                        </Badge>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-400">Action:</span>
                        <Badge variant="indigo" size="xs">
                          {formatText(auto.action)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] text-slate-400 block font-mono">
                        Executed {auto.executionCount} times
                      </span>
                      <span className="text-[10px] text-emerald-400">100% Success</span>
                    </div>

                    <button
                      onClick={() => handleToggle(auto.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        auto.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-navy-900 text-slate-500 border-slate-800 hover:text-white'
                      }`}
                    >
                      {auto.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Custom Automation Rule"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs text-left">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Rule Name *</label>
            <input
              type="text"
              required
              value={newAuto.name}
              onChange={(e) => setNewAuto({ ...newAuto, name: e.target.value })}
              placeholder="e.g. Discord notification on new lead"
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">When this event happens (Trigger)</label>
            <select
              value={newAuto.trigger}
              onChange={(e) => setNewAuto({ ...newAuto, trigger: e.target.value })}
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
            >
              <option value="appointment_booked">Appointment Booked</option>
              <option value="lead_qualified">Lead Qualified (Score &gt; 80)</option>
              <option value="call_completed">Call Completed</option>
              <option value="call_missed">Call Missed / Abandoned</option>
              <option value="call_transferred">Call Transferred to Human</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Perform this action (Action)</label>
            <select
              value={newAuto.action}
              onChange={(e) => setNewAuto({ ...newAuto, action: e.target.value })}
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
            >
              <option value="send_sms_confirmation">Send SMS Confirmation to Caller</option>
              <option value="send_sms_reminder">Send Consultation Reminder SMS</option>
              <option value="send_sms_callback">Send Instant Missed Call Follow-up Text</option>
              <option value="ai_lead_qualification">AI Lead Qualification &amp; CRM Sync</option>
              <option value="send_email_summary">Dispatch Email Transcript to Staff</option>
              <option value="notify_slack">Post Notification to Slack Channel</option>
              <option value="webhook">POST Payload to Custom Webhook URL</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Deploy Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
