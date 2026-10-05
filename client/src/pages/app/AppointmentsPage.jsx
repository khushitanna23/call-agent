import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  Plus,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  List as ListIcon,
  LayoutGrid,
  Sparkles,
  AlertCircle,
  Edit2,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'all', 'upcoming', 'confirmed', 'completed', 'rescheduled', 'cancelled'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: '', timeSlot: '' });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [counts, setCounts] = useState({ total: 0, upcoming: 0, past: 0, cancelled: 0 });

  // Current Calendar Month & Year
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Booking form
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: '10:30 AM',
    type: 'Discovery Call',
    notes: 'Booked directly via appointment console.',
  });

  const toast = useToast();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      if (res.data) setAppointments(res.data);
      if (res.counts) setCounts(res.counts);
    } catch (err) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/appointments', formData);
      if (res.success) {
        toast.success('Appointment scheduled and synchronized with calendar!');
        setBookModalOpen(false);
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          timeSlot: '10:30 AM',
          type: 'Discovery Call',
          notes: 'Booked directly via appointment console.',
        });
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.message || 'Booking failed');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      setIsUpdatingStatus(true);
      const res = await api.put(`/appointments/${id}`, { status });
      if (res.success) {
        toast.success(`Appointment marked as ${status}`);
        fetchAppointments();
        if (selectedAppt && selectedAppt._id === id) {
          setSelectedAppt((prev) => ({ ...prev, status }));
        }
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleData.date || !rescheduleData.timeSlot) return;

    try {
      setIsUpdatingStatus(true);
      const res = await api.put(`/appointments/${selectedAppt._id}`, {
        date: rescheduleData.date,
        timeSlot: rescheduleData.timeSlot,
        status: 'rescheduled',
      });
      if (res.success) {
        toast.success('Appointment rescheduled successfully!');
        setIsRescheduling(false);
        fetchAppointments();
        setSelectedAppt((prev) => ({
          ...prev,
          date: rescheduleData.date,
          timeSlot: rescheduleData.timeSlot,
          status: 'rescheduled',
        }));
      }
    } catch (err) {
      toast.error('Failed to reschedule');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.info('Appointment cancelled');
      fetchAppointments();
      if (selectedAppt && selectedAppt._id === id) {
        setSelectedAppt((prev) => ({ ...prev, status: 'cancelled' }));
      }
    } catch (e) {
      toast.error('Cancel failed');
    }
  };

  const statusVariant = (status) => {
    switch (status) {
      case 'scheduled':
        return 'emerald';
      case 'confirmed':
        return 'cyan';
      case 'completed':
        return 'indigo';
      case 'rescheduled':
        return 'amber';
      case 'cancelled':
        return 'rose';
      default:
        return 'default';
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAppointments = appointments.filter((a) => {
    if (activeTab === 'upcoming') {
      return (a.status === 'scheduled' || a.status === 'confirmed') && a.date >= todayStr;
    }
    if (activeTab === 'confirmed') return a.status === 'confirmed';
    if (activeTab === 'completed') return a.status === 'completed';
    if (activeTab === 'rescheduled') return a.status === 'rescheduled';
    if (activeTab === 'cancelled') return a.status === 'cancelled';
    return true; // 'all'
  });

  // Calendar Helper functions
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };

  const openApptDetail = (appt) => {
    setSelectedAppt(appt);
    setRescheduleData({ date: appt.date, timeSlot: appt.timeSlot });
    setIsRescheduling(false);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Appointments & Calendar Sync
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Real-time consultations and discovery calls scheduled autonomously by your AI Receptionist.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-[#0c0c0e] border border-emerald-950/80 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-emerald-500 text-black font-bold shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'calendar'
                  ? 'bg-emerald-500 text-black font-bold shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Calendar View"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>

          <Button variant="outline" size="sm" icon={RotateCcw} onClick={fetchAppointments}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setBookModalOpen(true)}>
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'upcoming', label: `Upcoming (${appointments.filter(a => (a.status === 'scheduled' || a.status === 'confirmed') && a.date >= todayStr).length})` },
            { id: 'confirmed', label: `Confirmed (${appointments.filter(a => a.status === 'confirmed').length})` },
            { id: 'completed', label: `Completed (${appointments.filter(a => a.status === 'completed').length})` },
            { id: 'rescheduled', label: `Rescheduled (${appointments.filter(a => a.status === 'rescheduled').length})` },
            { id: 'cancelled', label: `Cancelled (${appointments.filter(a => a.status === 'cancelled').length})` },
            { id: 'all', label: `All (${appointments.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-brand-cyan text-navy-950 font-bold shadow-glow'
                  : 'bg-navy-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Google Calendar & Cal.com Two-Way Sync Active</span>
        </div>
      </div>

      {/* VIEW MODE: LIST OR CALENDAR */}
      {viewMode === 'calendar' ? (
        /* CALENDAR MONTH GRID VIEW (Master Plan Requirement) */
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {monthNames[month]} {year}
              </h2>
              <Badge variant="cyan" size="xs">
                {filteredAppointments.length} Booked
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-navy-900 border border-slate-800 text-slate-400 hover:text-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCalendarDate(new Date())}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-navy-900 border border-slate-800 text-slate-300 hover:text-white transition"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-navy-900 border border-slate-800 text-slate-400 hover:text-white transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells before month start */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[100px] p-2 rounded-xl bg-navy-950/40 border border-slate-800/40 opacity-30"
              />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
              const dayNum = dayIndex + 1;
              const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const isToday = dateString === todayStr;
              const dayAppts = appointments.filter((a) => a.date === dateString);

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`min-h-[105px] p-2 rounded-xl border transition flex flex-col justify-between ${
                    isToday
                      ? 'bg-cyan-500/5 border-cyan-500/40 ring-1 ring-cyan-500/30'
                      : 'bg-navy-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold ${
                        isToday ? 'text-brand-cyan' : 'text-slate-400'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayAppts.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {dayAppts.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[70px]">
                    {dayAppts.map((appt) => (
                      <button
                        key={appt._id}
                        onClick={() => openApptDetail(appt)}
                        className="w-full text-left p-1 rounded-md bg-navy-800 hover:bg-slate-700 border border-slate-700 text-[10px] truncate block transition"
                        title={`${appt.timeSlot} - ${appt.customerName}`}
                      >
                        <div className="font-semibold text-white truncate flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              appt.status === 'confirmed'
                                ? 'bg-brand-cyan'
                                : appt.status === 'completed'
                                ? 'bg-indigo-400'
                                : appt.status === 'cancelled'
                                ? 'bg-rose-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                          <span className="truncate">{appt.customerName}</span>
                        </div>
                        <div className="text-slate-400 font-mono text-[9px]">
                          {appt.timeSlot}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        /* LIST / CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAppointments.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 text-xs">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-40 text-brand-cyan" />
              No appointments found in "{activeTab}" category.
            </div>
          ) : (
            filteredAppointments.map((appt) => (
              <Card key={appt._id} className="p-6 flex flex-col justify-between" hover>
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white">{appt.customerName}</h3>
                      <p className="text-xs text-brand-cyan font-medium">{appt.type}</p>
                    </div>
                    <Badge variant={statusVariant(appt.status)} size="xs">
                      {appt.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs py-4 border-y border-slate-800">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4 text-brand-cyan shrink-0" />
                      <span className="font-mono font-semibold text-white">
                        {appt.date} at {appt.timeSlot}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        ({appt.durationMinutes} min)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="font-mono">{appt.customerPhone}</span>
                    </div>

                    {appt.customerEmail && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="truncate">{appt.customerEmail}</span>
                      </div>
                    )}

                    {appt.notes && (
                      <p className="text-[11px] text-slate-400 italic pt-1">{appt.notes}</p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-6 pt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openApptDetail(appt)}
                    className="flex-1 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold border border-slate-700 text-center transition"
                  >
                    View Details
                  </button>

                  {appt.meetingLink && (
                    <a
                      href={appt.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-brand-cyan text-xs font-semibold border border-cyan-500/30 transition"
                      title="Join Meeting Room"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                    <button
                      onClick={() => handleCancelAppointment(appt._id)}
                      className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-semibold transition"
                      title="Cancel appointment"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* APPOINTMENT DETAIL / STATUS LIFECYCLE MODAL (Master Plan Requirement) */}
      {selectedAppt && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Appointment: ${selectedAppt.customerName}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-5 text-xs text-left">
            {/* Top Status Header */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-navy-900 border border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 block">Status</span>
                <Badge variant={statusVariant(selectedAppt.status)} size="sm">
                  {selectedAppt.status}
                </Badge>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Consultation Type</span>
                <span className="font-bold text-white text-sm">{selectedAppt.type}</span>
              </div>
            </div>

            {/* Customer & Scheduling Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-navy-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Date & Time</span>
                <span className="font-bold text-brand-cyan text-sm font-mono mt-0.5 block">
                  {selectedAppt.date} at {selectedAppt.timeSlot}
                </span>
                <span className="text-[10px] text-slate-500">
                  Duration: {selectedAppt.durationMinutes} minutes
                </span>
              </div>

              <div className="p-3 rounded-xl bg-navy-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Client Contact</span>
                <span className="font-semibold text-white block mt-0.5">{selectedAppt.customerName}</span>
                <span className="font-mono text-slate-400 text-[11px] block">{selectedAppt.customerPhone}</span>
                {selectedAppt.customerEmail && (
                  <span className="text-slate-400 text-[11px] block truncate">{selectedAppt.customerEmail}</span>
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedAppt.notes && (
              <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800 text-slate-300">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Appointment Notes
                </span>
                <p className="leading-relaxed">{selectedAppt.notes}</p>
              </div>
            )}

            {/* Meeting Link */}
            {selectedAppt.meetingLink && (
              <div className="p-3 rounded-xl bg-navy-900 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Virtual Meeting URL</span>
                  <span className="text-brand-cyan font-mono text-[11px] truncate max-w-xs block">
                    {selectedAppt.meetingLink}
                  </span>
                </div>
                <a
                  href={selectedAppt.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-brand-cyan border border-cyan-500/30 text-xs font-semibold inline-flex items-center gap-1"
                >
                  Open <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Reschedule Form Toggle */}
            {isRescheduling ? (
              <form onSubmit={handleRescheduleSubmit} className="p-4 rounded-xl bg-navy-900 border border-amber-500/30 space-y-3">
                <span className="font-bold text-white block">Reschedule Consultation</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">New Date</label>
                    <input
                      type="date"
                      required
                      value={rescheduleData.date}
                      onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                      className="w-full bg-navy-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-brand-cyan"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">New Time Slot</label>
                    <input
                      type="text"
                      required
                      value={rescheduleData.timeSlot}
                      onChange={(e) => setRescheduleData({ ...rescheduleData, timeSlot: e.target.value })}
                      placeholder="e.g. 02:00 PM"
                      className="w-full bg-navy-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-brand-cyan"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="ghost" size="sm" onClick={() => setIsRescheduling(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isUpdatingStatus}>
                    Confirm Reschedule
                  </Button>
                </div>
              </form>
            ) : null}

            {/* Lifecycle Status Action Bar */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {selectedAppt.status !== 'confirmed' && selectedAppt.status !== 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedAppt._id, 'confirmed')}
                    isLoading={isUpdatingStatus}
                  >
                    Confirm
                  </Button>
                )}

                {selectedAppt.status !== 'completed' && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedAppt._id, 'completed')}
                    isLoading={isUpdatingStatus}
                  >
                    Mark Completed
                  </Button>
                )}

                {!isRescheduling && selectedAppt.status !== 'completed' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Edit2}
                    onClick={() => setIsRescheduling(true)}
                  >
                    Reschedule
                  </Button>
                )}
              </div>

              {selectedAppt.status !== 'cancelled' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleCancelAppointment(selectedAppt._id)}
                >
                  Cancel Appt
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Book New Appointment Modal */}
      <Modal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        title="Schedule New Appointment"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4 text-xs text-left">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Customer Name *</label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
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
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="client@example.com"
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Time Slot *</label>
              <input
                type="text"
                required
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                placeholder="10:30 AM"
                className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Appointment Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
            >
              <option value="Discovery Call">Discovery Call</option>
              <option value="Product Demo">Product Demo</option>
              <option value="Technical Consultation">Technical Consultation</option>
              <option value="Customer Support">Customer Support</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Notes / Instructions</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any details or agenda for the consultation..."
              className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setBookModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Schedule & Sync
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
