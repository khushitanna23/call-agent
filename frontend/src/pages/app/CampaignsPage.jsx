import React, { useState } from 'react';
import {
  Send,
  Plus,
  Play,
  Pause,
  Users,
  PhoneCall,
  CheckCircle2,
  RotateCcw,
  Clock,
  Target,
  BarChart2,
  Calendar,
  Sparkles,
  PhoneForwarded,
  XCircle,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';

export const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([
    {
      id: 'cmp-1',
      name: 'Weekend Inbound Reception Priority',
      type: 'inbound_reception',
      status: 'active',
      targetAudience: 'All weekend inbound callers across regional markets',
      totalContacts: 142,
      successfulCalls: 139,
      hours: 'Sat - Sun: 08:00 AM - 08:00 PM',
      retries: 'Instant auto-answer on Ring 1',
      assignedAgent: 'Sarah (AI Receptionist)',
      contacts: [
        { name: 'Marcus Sterling', phone: '+1 (555) 342-9901', status: 'Completed', outcome: 'Booked Appointment', time: 'Today, 11:24 AM' },
        { name: 'Elena Rostova', phone: '+1 (555) 891-2345', status: 'Completed', outcome: 'Qualified Lead', time: 'Today, 10:15 AM' },
        { name: 'David Kim', phone: '+1 (555) 772-4321', status: 'Transferred', outcome: 'Transferred to Broker', time: 'Yesterday, 04:45 PM' },
        { name: 'Jessica Vance', phone: '+1 (555) 234-5678', status: 'Completed', outcome: 'General Inquiry Resolved', time: 'Yesterday, 02:10 PM' },
      ],
    },
    {
      id: 'cmp-2',
      name: 'Unqualified Lead Reactivation',
      type: 'outbound_qualification',
      status: 'active',
      targetAudience: 'Leads from past 30 days without scheduled appointments',
      totalContacts: 45,
      successfulCalls: 38,
      hours: 'Mon - Fri: 10:00 AM - 05:00 PM',
      retries: 'Max 2 callbacks per contact',
      assignedAgent: 'Sarah (AI Receptionist)',
      contacts: [
        { name: 'Jonathan Hayes', phone: '+1 (555) 601-2299', status: 'Completed', outcome: 'Discovery Call Scheduled', time: 'Today, 09:30 AM' },
        { name: 'Sophia Lorenza', phone: '+1 (555) 438-1122', status: 'Completed', outcome: 'Qualified Lead', time: 'Sep 26, 03:15 PM' },
        { name: 'Robert Chen', phone: '+1 (555) 912-3344', status: 'Missed', outcome: 'Left AI Voicemail', time: 'Sep 25, 11:00 AM' },
      ],
    },
    {
      id: 'cmp-3',
      name: 'Appointment Day-Before Reminder',
      type: 'appointment_reminder',
      status: 'paused',
      targetAudience: 'Patients and clients with consultations scheduled tomorrow',
      totalContacts: 28,
      successfulCalls: 28,
      hours: 'Daily at 05:00 PM',
      retries: '1 retry after 30 minutes',
      assignedAgent: 'Sarah (AI Receptionist)',
      contacts: [
        { name: 'Emily Watson', phone: '+1 (555) 723-9081', status: 'Completed', outcome: 'Slot Confirmed', time: 'Sep 26, 05:01 PM' },
        { name: 'Michael Adams', phone: '+1 (555) 654-3210', status: 'Completed', outcome: 'Rescheduled via Call', time: 'Sep 25, 05:02 PM' },
      ],
    },
  ]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'inbound_reception',
    targetAudience: '',
  });

  const toast = useToast();

  const handleToggle = (id) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c
      )
    );
    if (selectedCampaign && selectedCampaign.id === id) {
      setSelectedCampaign((prev) => ({
        ...prev,
        status: prev.status === 'active' ? 'paused' : 'active',
      }));
    }
    toast.info('Campaign status toggled');
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newCampaign.name) return;
    const newCampObj = {
      id: 'cmp-' + Date.now(),
      name: newCampaign.name,
      type: newCampaign.type,
      status: 'active',
      targetAudience: newCampaign.targetAudience || 'Target audience segment',
      totalContacts: 0,
      successfulCalls: 0,
      hours: 'Mon - Sun: 24/7 Priority',
      retries: '1 automated retry',
      assignedAgent: 'Sarah (AI Receptionist)',
      contacts: [],
    };
    setCampaigns([...campaigns, newCampObj]);
    toast.success('Campaign created and activated!');
    setCreateModalOpen(false);
    setNewCampaign({ name: '', type: 'inbound_reception', targetAudience: '' });
  };

  const openDetail = (camp) => {
    setSelectedCampaign(camp);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Call Campaigns & Reception Schedules
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Configure automated inbound reception rules, callback queues, and outbound follow-up workflows.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setCreateModalOpen(true)}>
          Create Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((camp) => (
          <Card key={camp.id} className="p-6 flex flex-col justify-between" hover>
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-brand-cyan flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-snug">{camp.name}</h3>
                    <span className="text-[11px] text-slate-400 capitalize">{camp.type.replace('_', ' ')}</span>
                  </div>
                </div>
                <Badge variant={camp.status === 'active' ? 'emerald' : 'default'} size="xs">
                  {camp.status}
                </Badge>
              </div>

              <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                Audience: <strong className="text-slate-300">{camp.targetAudience}</strong>
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Calls Handled</span>
                  <span className="font-extrabold text-white text-base font-mono">
                    {camp.totalContacts}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Completed</span>
                  <span className="font-extrabold text-emerald-400 text-base font-mono">
                    {camp.successfulCalls}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => handleToggle(camp.id)}
                className="text-xs font-semibold text-brand-cyan hover:underline flex items-center gap-1"
              >
                {camp.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {camp.status === 'active' ? 'Pause' : 'Resume'}
              </button>

              <button
                onClick={() => openDetail(camp)}
                className="px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                View Details
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* CAMPAIGN DETAIL MODAL (Master Plan Requirement) */}
      {selectedCampaign && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Campaign: ${selectedCampaign.name}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 text-xs text-left">
            {/* Header Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-navy-900 border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Status</span>
                <Badge variant={selectedCampaign.status === 'active' ? 'emerald' : 'default'} size="sm" className="mt-1">
                  {selectedCampaign.status}
                </Badge>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Total Handled</span>
                <span className="text-lg font-extrabold text-white font-mono mt-0.5 block">
                  {selectedCampaign.totalContacts} calls
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Success Rate</span>
                <span className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5 block">
                  {selectedCampaign.totalContacts > 0
                    ? Math.round((selectedCampaign.successfulCalls / selectedCampaign.totalContacts) * 100)
                    : 100}
                  %
                </span>
              </div>
            </div>

            {/* Campaign Parameters */}
            <div className="space-y-3">
              <span className="font-bold text-white text-sm block">Configuration Parameters</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Target Audience</span>
                  <span className="font-semibold text-white mt-0.5 block">
                    {selectedCampaign.targetAudience}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Assigned AI Employee</span>
                  <span className="font-semibold text-brand-cyan mt-0.5 block">
                    {selectedCampaign.assignedAgent}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Active Window</span>
                  <span className="font-mono text-slate-300 mt-0.5 block">
                    {selectedCampaign.hours}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Retry / Response Protocol</span>
                  <span className="text-slate-300 mt-0.5 block">
                    {selectedCampaign.retries}
                  </span>
                </div>
              </div>
            </div>

            {/* Contacts & Call Logs Roster */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-sm">Recent Campaign Activity Log</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {selectedCampaign.contacts?.length || 0} Records
                </span>
              </div>

              {selectedCampaign.contacts && selectedCampaign.contacts.length > 0 ? (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-navy-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Contact</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Outcome</th>
                        <th className="py-2.5 px-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {selectedCampaign.contacts.map((c, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-white block">{c.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">{c.phone}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant={
                                c.status === 'Completed'
                                  ? 'emerald'
                                  : c.status === 'Transferred'
                                  ? 'indigo'
                                  : 'rose'
                              }
                              size="xs"
                            >
                              {c.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{c.outcome}</td>
                          <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[10px]">
                            {c.time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 border border-slate-800 rounded-xl bg-navy-900/30">
                  No logged calls yet for this campaign.
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={() => handleToggle(selectedCampaign.id)}
                className="text-xs font-semibold text-brand-cyan hover:underline flex items-center gap-1.5"
              >
                {selectedCampaign.status === 'active' ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause Campaign Execution
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Resume Campaign Execution
                  </>
                )}
              </button>

              <Button variant="secondary" size="sm" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Call Campaign"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs text-left">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Campaign Name *</label>
            <input
              type="text"
              required
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              placeholder="e.g. Weekend Open House Inquiries"
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Campaign Type</label>
            <select
              value={newCampaign.type}
              onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value })}
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
            >
              <option value="inbound_reception">Inbound Reception Priority</option>
              <option value="outbound_qualification">Outbound Lead Qualification</option>
              <option value="appointment_reminder">Appointment Day-Before Reminder</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Audience</label>
            <input
              type="text"
              value={newCampaign.targetAudience}
              onChange={(e) => setNewCampaign({ ...newCampaign, targetAudience: e.target.value })}
              placeholder="e.g. All callers interested in commercial properties"
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Launch Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
