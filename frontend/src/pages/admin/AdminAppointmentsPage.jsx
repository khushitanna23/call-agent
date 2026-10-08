import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Phone,
  Building,
  User,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Shield,
  Activity,
  Bot,
  Filter,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';
import { io } from 'socket.io-client';

export const AdminAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchGlobalAppointments();

    // Connect to Socket.io for Real-Time appointment broadcasts
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join_admin');
    });

    socket.on('admin_appointment_booked', (payload) => {
      toast.success(
        `🚨 New Appointment Scheduled: ${payload.appointment?.callerName || payload.appointment?.customerName} (${payload.organization?.name || 'Client'})`
      );
      fetchGlobalAppointments();
    });

    socket.on('appointment_booked', () => {
      fetchGlobalAppointments();
    });

    socket.on('admin_appointment_updated', () => {
      fetchGlobalAppointments();
    });

    socket.on('appointment_updated', () => {
      fetchGlobalAppointments();
    });

    // Clean polling fallback every 10 seconds
    const interval = setInterval(() => {
      fetchGlobalAppointments();
    }, 10000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const fetchGlobalAppointments = async () => {
    try {
      const res = await api.get('/admin/appointments');
      if (res) {
        const list = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : res.data?.data || [];
        setAppointments(list);
      }
    } catch (err) {
      console.warn('Failed to fetch admin appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((appt) => {
    const orgName = appt.organizationId?.name || '';
    const ownerName = appt.organizationId?.ownerId?.name || '';
    const caller = appt.callerName || appt.customerName || '';
    const phone = appt.callerPhone || appt.customerPhone || '';

    const matchesSearch =
      orgName.toLowerCase().includes(search.toLowerCase()) ||
      ownerName.toLowerCase().includes(search.toLowerCase()) ||
      caller.toLowerCase().includes(search.toLowerCase()) ||
      phone.includes(search);

    const matchesStatus = statusFilter === 'all' || appt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const scheduledCount = appointments.filter((a) => a.status === 'scheduled').length;
  const callingCount = appointments.filter((a) => a.status === 'calling').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const failedCount = appointments.filter((a) => a.status === 'failed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-amber-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-500/30">
              Platform Control Plane
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Global Appointments Feed</h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time cross-tenant master log of all client bookings, caller reservations, and AI receptionist consultations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={fetchGlobalAppointments} isLoading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3.5 bg-gradient-to-br from-[#0c0c0e] to-[#141418] border-amber-500/20">
          <span className="text-[11px] text-gray-400 font-medium">Total Bookings</span>
          <div className="mt-1 text-2xl font-extrabold text-white font-mono">{appointments.length}</div>
          <span className="text-[10px] text-gray-400 block">Across all sub-accounts</span>
        </Card>

        <Card className="p-3.5 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <span className="text-[11px] text-gray-400 font-medium">Scheduled / Upcoming</span>
          <div className="mt-1 text-2xl font-extrabold text-emerald-400 font-mono">{scheduledCount}</div>
          <span className="text-[10px] text-emerald-400 block">Awaiting time</span>
        </Card>

        <Card className="p-3.5 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <span className="text-[11px] text-gray-400 font-medium">Active Calling</span>
          <div className="mt-1 text-2xl font-extrabold text-cyan-400 font-mono">{callingCount}</div>
          <span className="text-[10px] text-cyan-400 block">AI on call</span>
        </Card>

        <Card className="p-3.5 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <span className="text-[11px] text-gray-400 font-medium">Completed</span>
          <div className="mt-1 text-2xl font-extrabold text-blue-400 font-mono">{completedCount}</div>
          <span className="text-[10px] text-blue-400 block">Conducted</span>
        </Card>

        <Card className="p-3.5 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <span className="text-[11px] text-gray-400 font-medium">Failed / Missed</span>
          <div className="mt-1 text-2xl font-extrabold text-rose-400 font-mono">{failedCount}</div>
          <span className="text-[10px] text-rose-400 block">Unanswered or error</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-card p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by company, owner, caller, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#08080a] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#08080a] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Statuses ({appointments.length})</option>
            <option value="scheduled">Scheduled ({scheduledCount})</option>
            <option value="calling">Calling in Progress ({callingCount})</option>
            <option value="completed">Completed ({completedCount})</option>
            <option value="failed">Failed / No Answer ({failedCount})</option>
            <option value="cancelled">Cancelled ({cancelledCount})</option>
          </select>
        </div>
      </div>

      {/* Global Appointments Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#08080a] border-b border-slate-800 text-gray-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Organization &amp; Owner</th>
                <th className="py-3 px-4">Caller / Customer</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Scheduled Date &amp; Time</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-gray-500">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-400" />
                    <p className="font-semibold text-gray-400">No appointments scheduled yet</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      When callers book consultations via any client AI Receptionist, they will stream here in real-time.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appt) => {
                  const orgName = appt.organizationId?.name || 'Client Workspace';
                  const ownerName = appt.organizationId?.ownerId?.name || appt.organizationId?.ownerId?.email || 'Business Owner';
                  const caller = appt.callerName || appt.customerName || 'Inbound Caller';
                  const phone = appt.callerPhone || appt.customerPhone || 'N/A';
                  const dateStr = appt.scheduledDate || appt.date || 'TBD';
                  const timeStr = appt.scheduledTime || appt.timeSlot || 'TBD';

                  return (
                    <tr key={appt._id} className="hover:bg-[#101014] transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/20 shrink-0">
                            <Building className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-white block leading-tight">{orgName}</span>
                            <span className="text-[10px] text-gray-400 font-medium">Owner: {ownerName}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block">{caller}</span>
                        {appt.customerEmail && (
                          <span className="text-[10px] text-gray-500 font-mono">{appt.customerEmail}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold text-xs">
                        {phone}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-white font-medium">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono mt-0.5">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span>{timeStr}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-300">
                        <span className="truncate block max-w-[140px]">
                          {appt.serviceType || appt.type || 'Discovery Consultation'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            appt.status === 'completed'
                              ? 'emerald'
                              : appt.status === 'scheduled'
                              ? 'cyan'
                              : 'rose'
                          }
                          size="xs"
                        >
                          {appt.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setSelectedAppt(appt);
                            setDetailModalOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Appointment Detail Modal */}
      {selectedAppt && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Master Appointment Dossier`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs text-left">
            <div className="p-3 rounded-xl bg-[#08080a] border border-slate-800 space-y-1">
              <span className="text-gray-400 text-[10px] uppercase font-bold">Client Organization</span>
              <div className="font-bold text-white text-sm">{selectedAppt.organizationId?.name || 'Client Workspace'}</div>
              <div className="text-gray-400 text-[11px]">
                Owner: {selectedAppt.organizationId?.ownerId?.name || 'Owner'} ({selectedAppt.organizationId?.ownerId?.email || 'N/A'})
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#0c0c0e] border border-slate-800">
                <span className="text-gray-500 text-[10px] block">Caller / Customer</span>
                <span className="font-bold text-white mt-0.5 block">{selectedAppt.callerName || selectedAppt.customerName}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0c0c0e] border border-slate-800">
                <span className="text-gray-500 text-[10px] block">Customer Phone</span>
                <span className="font-mono text-emerald-400 font-bold mt-0.5 block">
                  {selectedAppt.callerPhone || selectedAppt.customerPhone}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#0c0c0e] border border-slate-800">
                <span className="text-gray-500 text-[10px] block">Scheduled Date</span>
                <span className="font-mono text-white mt-0.5 block">{selectedAppt.scheduledDate || selectedAppt.date}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0c0c0e] border border-slate-800">
                <span className="text-gray-500 text-[10px] block">Scheduled Time</span>
                <span className="font-mono text-cyan-400 mt-0.5 block">{selectedAppt.scheduledTime || selectedAppt.timeSlot}</span>
              </div>
            </div>

            {selectedAppt.notes && (
              <div className="p-3 rounded-xl bg-[#08080a] border border-slate-800">
                <span className="text-gray-500 text-[10px] block mb-1">Notes &amp; AI Analysis</span>
                <p className="text-gray-300 leading-relaxed">{selectedAppt.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
