import React, { useState, useEffect } from 'react';
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
import api from '../../api/client';

export const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'inbound_reception',
    targetAudience: '',
  });

  const toast = useToast();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/campaigns');
      if (res?.data) {
        setCampaigns(res.data);
      }
    } catch (err) {
      console.warn('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    const camp = campaigns.find((c) => (c._id || c.id) === id);
    if (!camp) return;
    const nextStatus = camp.status === 'active' ? 'paused' : 'active';
    try {
      await api.put(`/campaigns/${id}`, { status: nextStatus });
      setCampaigns((prev) =>
        prev.map((c) =>
          (c._id || c.id) === id ? { ...c, status: nextStatus } : c
        )
      );
      if (selectedCampaign && (selectedCampaign._id || selectedCampaign.id) === id) {
        setSelectedCampaign((prev) => ({
          ...prev,
          status: nextStatus,
        }));
      }
      toast.info(`Campaign status updated to ${nextStatus}`);
    } catch (err) {
      toast.error('Failed to update campaign status');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCampaign.name) return;
    try {
      const res = await api.post('/campaigns', {
        name: newCampaign.name,
        type: newCampaign.type,
        targetAudience: newCampaign.targetAudience || 'All inbound callers',
        hours: 'Mon - Sun: 24/7 Priority',
        retries: 'Instant auto-answer',
        assignedAgent: 'Sarah (AI Receptionist)',
      });
      if (res?.data) {
        setCampaigns((prev) => [res.data, ...prev]);
        toast.success('Campaign created and activated!');
      }
      setCreateModalOpen(false);
      setNewCampaign({ name: '', type: 'inbound_reception', targetAudience: '' });
    } catch (err) {
      toast.error('Failed to create campaign');
    }
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
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 h-52 animate-pulse bg-slate-900/40">
              <div className="h-4 w-1/2 bg-slate-800 rounded mb-3" />
              <div className="h-3 w-1/3 bg-slate-800 rounded mb-6" />
              <div className="h-10 bg-slate-800/60 rounded" />
            </Card>
          ))
        ) : campaigns.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs">
            <Send className="w-10 h-10 mx-auto mb-2 opacity-40 text-brand-cyan" />
            <p className="font-semibold text-gray-300 text-sm">No campaigns scheduled yet</p>
            <p className="text-gray-500 mt-1">
              Configure automated inbound reception rules, callback queues, or outbound follow-up workflows.
            </p>
          </div>
        ) : (
          campaigns.map((camp) => {
            const campId = camp._id || camp.id;
            return (
              <Card key={campId} className="p-6 flex flex-col justify-between" hover>
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-brand-cyan flex items-center justify-center shrink-0">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white leading-snug">{camp.name}</h3>
                        <span className="text-[11px] text-slate-400 capitalize">{(camp.type || 'inbound_reception').replace('_', ' ')}</span>
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
                        {camp.totalContacts || camp.callsHandled || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Completed</span>
                      <span className="font-extrabold text-emerald-400 text-base font-mono">
                        {camp.successfulCalls || camp.completed || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggle(campId)}
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
            );
          })
        )}
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
