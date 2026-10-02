import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Plus,
  PhoneCall,
  Sparkles,
  Settings,
  Trash2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const AgentsPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/agents');
      if (res.data) setAgents(res.data);
    } catch (err) {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (agent) => {
    const nextStatus = agent.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    try {
      await api.put(`/agents/${agent._id}`, { status: nextStatus });
      toast.success(`${agent.name} is now ${nextStatus}`);
      fetchAgents();
    } catch (e) {
      toast.error('Failed to update agent status');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Employees & Receptionists
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Manage your autonomous voice receptionists, active phone numbers, and conversational behavior.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={fetchAgents}>
            Refresh
          </Button>
          <Link to="/app/agents/new">
            <Button variant="primary" size="sm" icon={Plus}>
              Create AI Receptionist
            </Button>
          </Link>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent._id} className="p-6 flex flex-col justify-between" hover>
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-cyan to-brand-indigo flex items-center justify-center text-white shadow-glow">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{agent.name}</h3>
                    <p className="text-xs text-slate-400">{agent.industry} Receptionist</p>
                  </div>
                </div>

                <Badge variant={agent.status === 'ONLINE' ? 'emerald' : 'rose'} size="xs">
                  {agent.status}
                </Badge>
              </div>

              {/* Specs */}
              <div className="space-y-2 text-xs py-4 border-y border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Number:</span>
                  <span className="font-mono text-cyan-400 font-semibold">{agent.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Voice Persona:</span>
                  <span className="text-white font-medium">
                    {agent.voice?.gender} ({agent.voice?.style})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Calls Answered:</span>
                  <span className="text-emerald-400 font-semibold">{agent.totalCallsCount || 24} calls</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Actions:</span>
                  <span className="text-slate-300">
                    {Object.values(agent.actions || {}).filter(Boolean).length} actions enabled
                  </span>
                </div>
              </div>
            </div>

            {/* Actions button strip */}
            <div className="mt-6 pt-4 flex items-center justify-between gap-2">
              <button
                onClick={() => toggleStatus(agent)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                  agent.status === 'ONLINE'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                {agent.status === 'ONLINE' ? 'Pause Agent' : 'Set Online'}
              </button>

              <Link
                to="/app/agents/new"
                className="p-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 border border-slate-700 transition"
                title="Edit agent settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* AI EMPLOYEE TEMPLATES (Feature 5 Requirement) */}
      <div className="space-y-4 pt-6 border-t border-emerald-950/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">AI Employee Templates</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Select pre-configured conversational employee architectures built for specialized commercial functions.
            </p>
          </div>
          <Badge variant="cyan" size="xs">
            <Sparkles className="w-3 h-3" /> Ready Architectures
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[
            {
              name: 'AI Receptionist',
              icon: Bot,
              desc: 'Answers inbound calls 24/7, resolves business FAQs, qualifies caller intent, and books consultations.',
              status: 'Available',
              isAvailable: true,
            },
            {
              name: 'AI Sales Agent',
              icon: Sparkles,
              desc: 'Specialized in customer discovery, pricing negotiations, and commercial pipeline velocity.',
              status: 'Coming Soon',
              isAvailable: false,
            },
            {
              name: 'AI Support Agent',
              icon: PhoneCall,
              desc: 'Delivers real-time customer care, technical troubleshooting, and automated escalation tickets.',
              status: 'Coming Soon',
              isAvailable: false,
            },
            {
              name: 'AI Appointment Setter',
              icon: RotateCcw,
              desc: 'High-conversion booking representative that syncs calendars and confirms customer meetings.',
              status: 'Coming Soon',
              isAvailable: false,
            },
            {
              name: 'AI Follow-up Agent',
              icon: Settings,
              desc: 'Autonomous callback and outreach agent re-engaging dormant leads and delivering reminders.',
              status: 'Coming Soon',
              isAvailable: false,
            },
          ].map((tmpl, idx) => {
            const Icon = tmpl.icon;
            return (
              <Card key={idx} className="p-5 flex flex-col justify-between" hover>
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-brand-cyan flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant={tmpl.isAvailable ? 'emerald' : 'default'} size="xs">
                      {tmpl.status}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1.5">{tmpl.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{tmpl.desc}</p>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  {tmpl.isAvailable ? (
                    <Link to="/app/agents/new" className="block w-full">
                      <Button variant="primary" size="sm" className="w-full text-xs">
                        Use Template
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled className="w-full text-xs opacity-60">
                      Coming Soon
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
