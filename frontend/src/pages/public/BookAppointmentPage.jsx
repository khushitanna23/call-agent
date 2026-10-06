import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Bot,
  Copy,
  Check,
  Download,
  CalendarCheck2,
  PhoneCall,
  RefreshCw,
  Search,
  X,
  FileText,
  ShieldCheck,
  Star,
  Globe,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

// Common global timezones for user selection
const POPULAR_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada) - ET' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada) - CT' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada) - MT' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada) - PT' },
  { value: 'Europe/London', label: 'London, Edinburgh, Dublin - GMT/BST' },
  { value: 'Europe/Paris', label: 'Central European Time - CET' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time - GST' },
  { value: 'Asia/Kolkata', label: 'India Standard Time - IST (+5:30)' },
  { value: 'Asia/Singapore', label: 'Singapore, Hong Kong - SGT/HKT' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time - JST' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time - AEST' },
];

export const BookAppointmentPage = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();

  // Wizard Step: 1 = Service/Agent, 2 = Date & Time, 3 = Details, 4 = Review, 5 = Success
  const [currentStep, setCurrentStep] = useState(1);

  // Agent / Service Data
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loadingAgents, setLoadingAgents] = useState(true);

  // Calendar & Slot selection
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [monthAvailability, setMonthAvailability] = useState({});
  const [selectedDate, setSelectedDate] = useState(() => {
    // Tomorrow by default
    const tomorrow = new Date(Date.now() + 86400000);
    // If tomorrow is Sunday, choose Monday
    if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
    } catch {
      return 'America/New_York';
    }
  });

  // Customer Form Data
  const [customerDetails, setCustomerDetails] = useState({
    fullName: '',
    phone: '',
    email: '',
    requirement: '',
    company: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Booking Execution State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Instant Outbound Call Test State
  const [isTriggeringCall, setIsTriggeringCall] = useState(false);
  const [instantCallResult, setInstantCallResult] = useState(null);
  const [instantCallModalOpen, setInstantCallModalOpen] = useState(false);

  // Manage / Lookup Existing Booking Modal
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [lookupInput, setLookupInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookedUpBooking, setLookedUpBooking] = useState(null);
  const [lookupError, setLookupError] = useState('');

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ newDate: '', newSlot: '' });

  // 1. Fetch Agents on mount
  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoadingAgents(true);
      const res = await api.get('/appointments/public/agents');
      if (res.data && res.data.length > 0) {
        setAgents(res.data);
        // Pre-select first agent or one from query param
        const preselect = searchParams.get('agent');
        const matched = res.data.find(
          (a) => a.name.toLowerCase() === (preselect || '').toLowerCase()
        ) || res.data[0];
        setSelectedAgent(matched);
      }
    } catch (err) {
      console.warn('Error fetching agents:', err);
      toast.error('Unable to load available services.');
    } finally {
      setLoadingAgents(false);
    }
  };

  // 2. Fetch Month Availability when Month or Agent changes
  useEffect(() => {
    if (!selectedAgent) return;
    fetchMonthAvailability();
  }, [currentMonthDate, selectedAgent]);

  const fetchMonthAvailability = async () => {
    try {
      const year = currentMonthDate.getFullYear();
      const month = currentMonthDate.getMonth() + 1;
      const res = await api.get('/appointments/public/month-availability', {
        params: {
          agentId: selectedAgent?._id,
          year,
          month,
          timezone,
        },
      });
      if (res.data?.days) {
        setMonthAvailability(res.data.days);
      }
    } catch (err) {
      console.warn('Error fetching month availability:', err);
    }
  };

  // 3. Fetch Time Slots when Selected Date or Agent or Timezone changes
  useEffect(() => {
    if (!selectedDate || !selectedAgent) return;
    fetchDateSlots(selectedDate);
  }, [selectedDate, selectedAgent, timezone]);

  const fetchDateSlots = async (date) => {
    try {
      setLoadingSlots(true);
      setSelectedSlot(null); // Clear selected slot when date changes
      const res = await api.get('/appointments/public/available-slots', {
        params: {
          agentId: selectedAgent?._id,
          date,
          timezone,
        },
      });
      if (res.data?.slots) {
        setAvailableSlots(res.data.slots);
      } else {
        setAvailableSlots([]);
      }
    } catch (err) {
      console.warn('Error fetching slots:', err);
      toast.error('Could not load time slots for this date.');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Step 3 Validation
  const validateCustomerDetails = () => {
    const errors = {};
    if (!customerDetails.fullName.trim()) {
      errors.fullName = 'Please enter your full name.';
    }
    if (!customerDetails.phone.trim()) {
      errors.phone = 'Phone number is required for the automated AI call.';
    } else if (customerDetails.phone.trim().length < 8) {
      errors.phone = 'Please enter a valid phone number with area code.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerDetails.email.trim()) {
      errors.email = 'Email address is required for calendar confirmation.';
    } else if (!emailRegex.test(customerDetails.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 4 Execution: Confirm Appointment
  const handleConfirmBooking = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        agentId: selectedAgent?._id,
        serviceType: selectedAgent?.serviceType || 'Consultation & Discovery Call',
        date: selectedDate,
        timeSlot: selectedSlot.timeSlot,
        customerName: customerDetails.fullName.trim(),
        customerPhone: customerDetails.phone.trim(),
        customerEmail: customerDetails.email.trim(),
        requirement: customerDetails.requirement.trim(),
        customerTimezone: timezone,
      };

      const res = await api.post('/appointments/public/book', payload);

      if (res.success && res.data) {
        setConfirmedBooking(res.data);
        setCurrentStep(5);
        toast.success('Appointment confirmed & synchronized with Google Calendar!');
      } else {
        throw new Error(res.message || 'Unable to schedule appointment.');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      toast.error(err.message || 'Booking conflict or network error. Please select another slot.');
      // If conflict, refresh available slots
      fetchDateSlots(selectedDate);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instant AI Call Test trigger
  const handleTriggerInstantCall = async (reference) => {
    try {
      setIsTriggeringCall(true);
      const res = await api.post(`/appointments/public/trigger-call/${reference}`);
      if (res.success && res.data) {
        setInstantCallResult(res.data);
        setInstantCallModalOpen(true);
        toast.success('Automated AI call successfully connected!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to trigger instant call.');
    } finally {
      setIsTriggeringCall(false);
    }
  };

  // Copy booking reference
  const handleCopyReference = (ref) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    toast.success('Reference ID copied to clipboard!');
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Lookup existing booking
  const handleLookupBooking = async (e) => {
    e.preventDefault();
    if (!lookupInput.trim()) return;

    try {
      setIsLookingUp(true);
      setLookupError('');
      const res = await api.get(`/appointments/public/lookup/${encodeURIComponent(lookupInput.trim())}`);
      if (res.success && res.data?.appointment) {
        setLookedUpBooking(res.data.appointment);
      } else {
        setLookupError('No appointment found matching this reference code or phone number.');
      }
    } catch (err) {
      setLookupError(err.message || 'Appointment record not found.');
    } finally {
      setIsLookingUp(false);
    }
  };

  // Cancel booking
  const handleCancelBooking = async (ref) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await api.post(`/appointments/public/cancel/${ref}`, {
        cancellationReason: 'Cancelled by customer via self-service portal',
      });
      if (res.success) {
        toast.success('Appointment has been cancelled.');
        setLookedUpBooking((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
        fetchMonthAvailability();
        fetchDateSlots(selectedDate);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel appointment');
    }
  };

  // Format month title
  const monthTitle = currentMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Calendar Day Generation
  const renderCalendarDays = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Adjust so Monday is 0
    const startOffset = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarGrid = [];

    // Empty lead cells
    for (let i = 0; i < startOffset; i++) {
      calendarGrid.push(<div key={`empty-${i}`} className="h-10 sm:h-12" />);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayDate = new Date(`${dateStr}T00:00:00`);
      const isSunday = dayDate.getDay() === 0;
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;
      const isSelected = selectedDate === dateStr;

      const summary = monthAvailability[dateStr];
      const isFullyBooked = summary?.isFullyBooked;
      const availableSlotsCount = summary?.availableSlots ?? 12;

      const isDisabled = isPast || isSunday || isFullyBooked;

      calendarGrid.push(
        <button
          key={dateStr}
          type="button"
          disabled={isDisabled}
          onClick={() => {
            setSelectedDate(dateStr);
          }}
          className={`h-11 sm:h-13 rounded-xl flex flex-col items-center justify-center relative transition-all duration-150 text-sm font-semibold group ${
            isSelected
              ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/30 scale-105 z-10'
              : isDisabled
              ? 'text-gray-600 bg-black/20 cursor-not-allowed opacity-50'
              : 'text-gray-200 bg-gray-900/60 hover:bg-gray-800 hover:text-white border border-gray-800/80 hover:border-emerald-500/50'
          }`}
        >
          <span className="text-sm">{day}</span>
          {!isDisabled && (
            <span
              className={`w-1.5 h-1.5 rounded-full mt-1 ${
                isSelected ? 'bg-black' : 'bg-emerald-400 group-hover:scale-125 transition-transform'
              }`}
            />
          )}
          {isFullyBooked && (
            <span className="text-[9px] text-red-400 font-normal leading-tight">Full</span>
          )}
          {isSunday && (
            <span className="text-[9px] text-gray-600 font-normal leading-tight">Closed</span>
          )}
        </button>
      );
    }

    return calendarGrid;
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-gray-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-gray-800/80 bg-[#0a0d14]/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-black font-black shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6 text-black" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                VEDANCO <span className="text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">AI</span>
              </span>
              <p className="text-[10px] tracking-wider uppercase text-gray-400 font-semibold -mt-1">
                Commercial Scheduling
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setLookupModalOpen(true);
                setLookupError('');
                setLookedUpBooking(null);
              }}
              className="text-xs font-semibold text-gray-300 hover:text-emerald-400 px-3.5 py-2 rounded-lg bg-gray-900/80 hover:bg-gray-800 border border-gray-800 transition flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lookup / Reschedule</span>
            </button>
            <Link
              to="/"
              className="text-xs font-medium text-gray-400 hover:text-white px-3 py-2 transition hidden sm:inline-block"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Progress Stepper (visible on steps 1-4) */}
        {currentStep < 5 && (
          <div className="mb-10 max-w-3xl mx-auto">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-800 w-full z-0" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 transition-all duration-300 z-0"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />

              {[
                { step: 1, label: 'Service & AI Agent' },
                { step: 2, label: 'Date & Time' },
                { step: 3, label: 'Your Details' },
                { step: 4, label: 'Review & Confirm' },
              ].map((item) => {
                const isPassed = currentStep > item.step;
                const isCurrent = currentStep === item.step;
                return (
                  <div key={item.step} className="relative z-10 flex flex-col items-center">
                    <button
                      type="button"
                      disabled={item.step > currentStep}
                      onClick={() => item.step < currentStep && setCurrentStep(item.step)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                        isPassed
                          ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                          : isCurrent
                          ? 'bg-emerald-400 text-black ring-4 ring-emerald-500/20 font-extrabold'
                          : 'bg-gray-900 border border-gray-700 text-gray-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : item.step}
                    </button>
                    <span
                      className={`text-[11px] font-medium mt-2 hidden sm:block ${
                        isCurrent ? 'text-emerald-400 font-semibold' : 'text-gray-400'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 1: SELECT SERVICE & AI AGENT */}
        {/* ==================================================== */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="text-center max-w-2xl mx-auto">
              <Badge variant="cyan" size="sm" className="mb-2">
                Step 1 of 4 • AI Specialist Selection
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Select Your Required Service & AI Specialist
              </h1>
              <p className="text-gray-400 mt-2 text-sm sm:text-base leading-relaxed">
                Choose the specialized AI agent tailored to your industry. At your scheduled time, this specialist will place an automated phone call to answer questions and capture your requirements.
              </p>
            </div>

            {loadingAgents ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-64 rounded-2xl bg-gray-900/60 animate-pulse border border-gray-800" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {agents.map((agent) => {
                  const isSelected = selectedAgent?._id === agent._id;
                  return (
                    <div
                      key={agent._id}
                      onClick={() => setSelectedAgent(agent)}
                      className={`rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 relative border flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-b from-gray-900 to-gray-950 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl shadow-emerald-500/10'
                          : 'bg-gray-900/40 hover:bg-gray-900/80 border-gray-800/80 hover:border-gray-700'
                      }`}
                    >
                      {/* Top Bar with Avatar, Name, Rating */}
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={agent.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'}
                              alt={agent.name}
                              className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-md"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-white">{agent.name}</h3>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  ONLINE
                                </span>
                              </div>
                              <p className="text-xs text-emerald-400 font-medium">{agent.roleTitle || agent.industry}</p>
                              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-semibold text-gray-200">{agent.rating || 4.98}</span>
                                <span>({agent.reviewsCount || 342} verified sessions)</span>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-emerald-500 border-emerald-500 text-black'
                                : 'border-gray-700 bg-gray-900 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-200 mb-1">
                            Service: {agent.serviceType || 'Consultation Call'}
                          </h4>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {agent.description}
                          </p>
                        </div>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {(agent.tags || ['Consultation', 'Direct Outbound Call', 'Calendar Sync']).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] bg-gray-800/80 text-gray-300 px-2.5 py-0.5 rounded-md border border-gray-700/60"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Footer Specs */}
                      <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          {agent.durationMinutes || 30} Mins Duration
                        </span>
                        <span className="flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                          Direct AI Phone Call
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-6">
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                disabled={!selectedAgent}
                onClick={() => setCurrentStep(2)}
                className="px-8 font-semibold shadow-lg shadow-emerald-500/20"
              >
                Proceed to Select Date & Time
              </Button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 2: SELECT DATE & TIME SLOT */}
        {/* ==================================================== */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
              <div>
                <Badge variant="cyan" size="sm" className="mb-1">
                  Step 2 of 4 • Availability Schedule
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Choose Appointment Date & Available Time Slot
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Selected Specialist: <strong className="text-emerald-400">{selectedAgent?.name}</strong> ({selectedAgent?.serviceType})
                </p>
              </div>

              {/* Timezone Selector */}
              <div className="flex items-center gap-2 bg-gray-900/90 border border-gray-800 rounded-xl px-3 py-2 text-xs">
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-gray-400 shrink-0">Timezone:</span>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-2"
                >
                  {POPULAR_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value} className="bg-gray-900 text-white">
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Split layout: Calendar on Left, Time Slots on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Calendar (5 cols) */}
              <div className="lg:col-span-5 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 sm:p-7 shadow-xl">
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-emerald-400" />
                    {monthTitle}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const newD = new Date(currentMonthDate);
                        newD.setMonth(newD.getMonth() - 1);
                        // Prevent moving before current month
                        const now = new Date();
                        if (newD.getFullYear() < now.getFullYear() || (newD.getFullYear() === now.getFullYear() && newD.getMonth() < now.getMonth())) {
                          return;
                        }
                        setCurrentMonthDate(newD);
                      }}
                      className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newD = new Date(currentMonthDate);
                        newD.setMonth(newD.getMonth() + 1);
                        setCurrentMonthDate(newD);
                      }}
                      className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400 mb-2">
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                  <span className="text-gray-600">Su</span>
                </div>

                {/* Day Cells Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {renderCalendarDays()}
                </div>

                {/* Calendar Legend */}
                <div className="mt-6 pt-4 border-t border-gray-800 flex flex-wrap items-center justify-between text-[11px] text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span>Fully Booked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-600" />
                    <span>Sunday Closed</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Time Slots (7 cols) */}
              <div className="lg:col-span-7 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 sm:p-7 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Available Slots for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Sessions run for 30 minutes with instant call dispatch.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={RefreshCw}
                    onClick={() => fetchDateSlots(selectedDate)}
                    className="text-xs"
                  >
                    Refresh
                  </Button>
                </div>

                {loadingSlots ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-10">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-12 bg-gray-800/50 animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm font-medium">No available slots on this date.</p>
                    <p className="text-xs text-gray-500 mt-1">Please select another date from the calendar.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Morning Group */}
                    {availableSlots.some((s) => s.period === 'morning') && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Morning (09:00 AM - 12:00 PM)
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {availableSlots
                            .filter((s) => s.period === 'morning')
                            .map((slot) => {
                              const isSelected = selectedSlot?.timeSlot === slot.timeSlot;
                              return (
                                <button
                                  key={slot.timeSlot}
                                  type="button"
                                  disabled={!slot.isAvailable}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-150 ${
                                    isSelected
                                      ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400'
                                      : slot.isAvailable
                                      ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-700/80 hover:border-emerald-500/50'
                                      : 'bg-black/30 border border-gray-800/50 text-gray-500 cursor-not-allowed opacity-60'
                                  }`}
                                >
                                  <span>{slot.timeSlot}</span>
                                  {isSelected ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  ) : !slot.isAvailable ? (
                                    <span className="text-[10px] text-gray-500 font-normal">
                                      {slot.reason === 'Time Slot Passed' ? 'Passed' : 'Booked'}
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Afternoon Group */}
                    {availableSlots.some((s) => s.period === 'afternoon') && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          Afternoon (12:00 PM - 04:00 PM)
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {availableSlots
                            .filter((s) => s.period === 'afternoon')
                            .map((slot) => {
                              const isSelected = selectedSlot?.timeSlot === slot.timeSlot;
                              return (
                                <button
                                  key={slot.timeSlot}
                                  type="button"
                                  disabled={!slot.isAvailable}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-150 ${
                                    isSelected
                                      ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400'
                                      : slot.isAvailable
                                      ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-700/80 hover:border-emerald-500/50'
                                      : 'bg-black/30 border border-gray-800/50 text-gray-500 cursor-not-allowed opacity-60'
                                  }`}
                                >
                                  <span>{slot.timeSlot}</span>
                                  {isSelected ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  ) : !slot.isAvailable ? (
                                    <span className="text-[10px] text-gray-500 font-normal">
                                      {slot.reason === 'Time Slot Passed' ? 'Passed' : 'Booked'}
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Evening Group */}
                    {availableSlots.some((s) => s.period === 'evening') && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          Evening (04:00 PM - 06:00 PM)
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {availableSlots
                            .filter((s) => s.period === 'evening')
                            .map((slot) => {
                              const isSelected = selectedSlot?.timeSlot === slot.timeSlot;
                              return (
                                <button
                                  key={slot.timeSlot}
                                  type="button"
                                  disabled={!slot.isAvailable}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-150 ${
                                    isSelected
                                      ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400'
                                      : slot.isAvailable
                                      ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-700/80 hover:border-emerald-500/50'
                                      : 'bg-black/30 border border-gray-800/50 text-gray-500 cursor-not-allowed opacity-60'
                                  }`}
                                >
                                  <span>{slot.timeSlot}</span>
                                  {isSelected ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  ) : !slot.isAvailable ? (
                                    <span className="text-[10px] text-gray-500 font-normal">
                                      {slot.reason === 'Time Slot Passed' ? 'Passed' : 'Booked'}
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-800">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setCurrentStep(1)}
              >
                Back to Agent Selection
              </Button>
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                disabled={!selectedSlot}
                onClick={() => setCurrentStep(3)}
                className="px-8 font-semibold shadow-lg shadow-emerald-500/20"
              >
                Proceed to Your Details
              </Button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 3: CUSTOMER DETAILS FORM */}
        {/* ==================================================== */}
        {currentStep === 3 && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-200">
            <div className="text-center">
              <Badge variant="cyan" size="sm" className="mb-2">
                Step 3 of 4 • Contact Information
              </Badge>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Enter Your Contact Details
              </h2>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                Our AI specialist <strong className="text-emerald-400">{selectedAgent?.name}</strong> will initiate the automated phone call directly to your number on{' '}
                <strong className="text-white">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {selectedSlot?.timeSlot}
                </strong>.
              </p>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Full Name <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Vance"
                    value={customerDetails.fullName}
                    onChange={(e) => {
                      setCustomerDetails({ ...customerDetails, fullName: e.target.value });
                      if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: null });
                    }}
                    className={`w-full bg-black/40 border rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition ${
                      formErrors.fullName ? 'border-red-500' : 'border-gray-800 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {formErrors.fullName && (
                  <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.fullName}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Phone Number for Automated Call <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 789-0123"
                    value={customerDetails.phone}
                    onChange={(e) => {
                      setCustomerDetails({ ...customerDetails, phone: e.target.value });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                    }}
                    className={`w-full bg-black/40 border rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition ${
                      formErrors.phone ? 'border-red-500' : 'border-gray-800 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {formErrors.phone ? (
                  <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.phone}
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    Include country code if international. Zero toll charges.
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Email Address for Google Calendar Confirmation <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="marcus@vanceholdings.com"
                    value={customerDetails.email}
                    onChange={(e) => {
                      setCustomerDetails({ ...customerDetails, email: e.target.value });
                      if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                    }}
                    className={`w-full bg-black/40 border rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition ${
                      formErrors.email ? 'border-red-500' : 'border-gray-800 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.email}
                  </p>
                )}
              </div>

              {/* Requirement / Purpose Quick Chips & Textarea */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Requirement / Reason for Appointment
                </label>

                {/* Quick Chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    'Property Inquiry & Showing',
                    'Clinical Intake & Patient Prep',
                    'AI Receptionist Architecture',
                    'Pricing & Custom Package',
                    'Live Telephony Integration',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setCustomerDetails({ ...customerDetails, requirement: chip })}
                      className={`text-xs px-3 py-1 rounded-lg border transition ${
                        customerDetails.requirement === chip
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-medium'
                          : 'bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  placeholder="Share any specific notes or questions you want the AI specialist to address during the call..."
                  value={customerDetails.requirement}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, requirement: e.target.value })}
                  className="w-full bg-black/40 border border-gray-800 rounded-xl p-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 transition"
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setCurrentStep(2)}
              >
                Back to Schedule
              </Button>
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                onClick={() => {
                  if (validateCustomerDetails()) {
                    setCurrentStep(4);
                  }
                }}
                className="px-8 font-semibold shadow-lg shadow-emerald-500/20"
              >
                Review Booking Summary
              </Button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 4: REVIEW BOOKING SUMMARY */}
        {/* ==================================================== */}
        {currentStep === 4 && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-200">
            <div className="text-center">
              <Badge variant="cyan" size="sm" className="mb-2">
                Step 4 of 4 • Final Review
              </Badge>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Review & Confirm Your Appointment
              </h2>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                Please verify all appointment information before confirming. Your session will be automatically synchronized with Google Calendar in the background.
              </p>
            </div>

            {/* Executive Summary Card */}
            <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-emerald-500/30 rounded-3xl p-7 sm:p-9 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-4 pb-6 border-b border-gray-800">
                <img
                  src={selectedAgent?.avatar}
                  alt={selectedAgent?.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{selectedAgent?.name}</h3>
                    <Badge variant="emerald" size="sm">
                      AI Specialist
                    </Badge>
                  </div>
                  <p className="text-xs text-emerald-400 font-semibold">{selectedAgent?.serviceType}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Duration: {selectedAgent?.durationMinutes || 30} Minutes</p>
                </div>
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-gray-800 text-sm">
                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Scheduled Date & Time
                  </span>
                  <p className="font-bold text-white flex items-center gap-2">
                    <CalendarCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">
                    {selectedSlot?.timeSlot} ({timezone})
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Customer Name
                  </span>
                  <p className="font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400 shrink-0" />
                    {customerDetails.fullName}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Phone for Automated Call
                  </span>
                  <p className="font-bold text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    {customerDetails.phone}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Confirmation Email
                  </span>
                  <p className="font-bold text-white flex items-center gap-2 truncate">
                    <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{customerDetails.email}</span>
                  </p>
                </div>
              </div>

              {/* Requirement */}
              <div className="py-6 border-b border-gray-800">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Requirement / Agenda
                </span>
                <p className="text-xs text-gray-300 bg-black/40 p-3 rounded-xl border border-gray-800/80 leading-relaxed">
                  {customerDetails.requirement || 'General AI Receptionist discovery & service discussion.'}
                </p>
              </div>

              {/* What will happen note */}
              <div className="pt-6">
                <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-gray-300">
                    <strong className="text-white block mb-0.5">Commercial Service Guarantee:</strong>
                    At the exact scheduled time, {selectedAgent?.name} will dial{' '}
                    <span className="text-emerald-400 font-semibold">{customerDetails.phone}</span>. Your calendar invite will be generated instantly and no software install is required.
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                size="md"
                disabled={isSubmitting}
                onClick={() => setCurrentStep(3)}
              >
                Back to Details
              </Button>
              <Button
                variant="primary"
                size="lg"
                icon={isSubmitting ? RefreshCw : CalendarCheck2}
                disabled={isSubmitting}
                onClick={handleConfirmBooking}
                className="px-10 font-bold shadow-xl shadow-emerald-500/20 text-base"
              >
                {isSubmitting ? 'Confirming with Google Calendar...' : 'Confirm Appointment'}
              </Button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 5: PROFESSIONAL BOOKING SUCCESS SCREEN */}
        {/* ==================================================== */}
        {currentStep === 5 && confirmedBooking && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-300">
            {/* Header Celebration */}
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-black mx-auto shadow-2xl shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
              <Badge variant="emerald" size="md">
                Confirmed & Synchronized
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Appointment Successfully Booked!
              </h1>
              <p className="text-gray-400 text-sm max-w-lg mx-auto">
                We've locked in your appointment and generated your background Google Calendar sync record.
              </p>
            </div>

            {/* Reference Badge Card */}
            <div className="bg-gradient-to-r from-emerald-950/50 via-gray-900 to-emerald-950/50 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Your Official Booking Reference ID
              </span>
              <div className="inline-flex items-center gap-3 bg-black/60 px-5 py-2.5 rounded-2xl border border-emerald-500/50">
                <span className="text-2xl sm:text-3xl font-mono font-black tracking-wider text-emerald-400">
                  {confirmedBooking.bookingReference}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyReference(confirmedBooking.bookingReference)}
                  className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                  title="Copy Reference ID"
                >
                  {copiedRef ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Save this reference code to lookup, reschedule, or cancel your appointment at any time.
              </p>
            </div>

            {/* Appointment Details Grid */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-base font-bold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
                <CalendarCheck2 className="w-4 h-4 text-emerald-400" />
                Appointment Overview
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-500 font-medium block">Date & Time:</span>
                  <span className="text-white font-bold text-base">
                    {confirmedBooking.date} at {confirmedBooking.timeSlot}
                  </span>
                  <span className="text-gray-400 text-xs block">Timezone: {confirmedBooking.customerTimezone || timezone}</span>
                </div>

                <div>
                  <span className="text-gray-500 font-medium block">Assigned AI Specialist:</span>
                  <span className="text-emerald-400 font-bold text-base">
                    {confirmedBooking.agent?.name || 'Sarah'}
                  </span>
                  <span className="text-gray-400 text-xs block">{confirmedBooking.serviceType}</span>
                </div>

                <div>
                  <span className="text-gray-500 font-medium block">Customer Details:</span>
                  <span className="text-white font-semibold block">{confirmedBooking.customerName}</span>
                  <span className="text-gray-400 text-xs block">{confirmedBooking.customerPhone}</span>
                </div>

                <div>
                  <span className="text-gray-500 font-medium block">Confirmation & Invite:</span>
                  <span className="text-white font-semibold block">{confirmedBooking.customerEmail}</span>
                  <span className="text-emerald-400 text-xs font-semibold block">Notification Dispatched</span>
                </div>
              </div>

              {/* Google Calendar Section */}
              <div className="pt-4 border-t border-gray-800">
                <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Google Calendar Background Sync
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      </h4>
                      <p className="text-xs text-gray-400">
                        Synchronized with calendar system. Add to your personal calendar with one click:
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {confirmedBooking.googleCalendar?.addEventUrl && (
                      <a
                        href={confirmedBooking.googleCalendar.addEventUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Add to Google Calendar
                      </a>
                    )}
                    <a
                      href={`/api/appointments/public/download-ics/${confirmedBooking.bookingReference}`}
                      download
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold border border-gray-700 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download .ICS
                    </a>
                  </div>
                </div>
              </div>

              {/* Interactive Immediate Call Test Feature */}
              <div className="bg-gradient-to-r from-emerald-950/60 via-gray-900 to-emerald-950/60 border border-emerald-500/40 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                      Interactive Evaluation Feature
                    </span>
                    <h4 className="text-base font-bold text-white mt-0.5">
                      Test Outbound AI Call Immediately
                    </h4>
                    <p className="text-xs text-gray-300 mt-1 max-w-lg leading-relaxed">
                      Don't want to wait until your scheduled time? Click below to test the AI agent placing an automated call to your number right now.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    icon={PhoneCall}
                    disabled={isTriggeringCall}
                    onClick={() => handleTriggerInstantCall(confirmedBooking.bookingReference)}
                    className="shrink-0 font-bold shadow-lg shadow-emerald-500/20"
                  >
                    {isTriggeringCall ? 'Initiating Call...' : 'Test AI Call Now'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link to="/app/appointments">
                <Button variant="primary" size="md">
                  View in Appointments Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setCurrentStep(1);
                  setConfirmedBooking(null);
                  setSelectedSlot(null);
                }}
              >
                Book Another Appointment
              </Button>
              <Link to="/">
                <Button variant="ghost" size="md">
                  Return to Homepage
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* INSTANT CALL MODAL / TRANSCRIPT VIEWER */}
      {/* ==================================================== */}
      {instantCallModalOpen && instantCallResult && (
        <Modal
          isOpen={instantCallModalOpen}
          onClose={() => setInstantCallModalOpen(false)}
          title="Automated Outbound Call Session Completed"
          size="lg"
        >
          <div className="space-y-6">
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Call Status: Completed
                </span>
                <p className="text-sm font-semibold text-white">
                  AI Specialist {confirmedBooking?.agent?.name || 'Sarah'} dialed {confirmedBooking?.customerPhone}
                </p>
              </div>
              <Badge variant="emerald" size="md">
                165s Duration
              </Badge>
            </div>

            {/* Transcript turns */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Live Conversational Transcript & Audit Trail
              </h4>
              <div className="bg-black/60 border border-gray-800 rounded-2xl p-4 max-h-64 overflow-y-auto space-y-3">
                {(instantCallResult.transcript || []).map((turn, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      turn.speaker === 'ai'
                        ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                        : 'bg-gray-800/60 border border-gray-700/60 text-gray-200 ml-4'
                    }`}
                  >
                    <span className="font-bold uppercase tracking-wider text-[10px] block mb-1 text-gray-400">
                      {turn.speaker === 'ai' ? `AI Specialist (${confirmedBooking?.agent?.name || 'Sarah'})` : 'Customer'} • {turn.timestamp}
                    </span>
                    {turn.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary notes */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-xs space-y-2">
              <span className="text-gray-400 font-semibold block">CRM Synchronization Status:</span>
              <p className="text-gray-300">
                Lead record updated in Vedanco CRM Dashboard with qualified AI score (96/100). Call audio recording and summary logged.
              </p>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setInstantCallModalOpen(false)}>
                Close Viewer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ==================================================== */}
      {/* LOOKUP / RESCHEDULE / CANCEL MODAL */}
      {/* ==================================================== */}
      {lookupModalOpen && (
        <Modal
          isOpen={lookupModalOpen}
          onClose={() => {
            setLookupModalOpen(false);
            setLookedUpBooking(null);
            setIsRescheduling(false);
          }}
          title="Lookup / Manage Your Appointment"
          size="lg"
        >
          <div className="space-y-6">
            {!lookedUpBooking ? (
              <form onSubmit={handleLookupBooking} className="space-y-4">
                <p className="text-xs text-gray-400">
                  Enter your Booking Reference ID (e.g. <span className="font-mono text-emerald-400">VED-A7X92K</span>) or the phone number you used when booking.
                </p>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Booking Reference or Phone Number..."
                    value={lookupInput}
                    onChange={(e) => setLookupInput(e.target.value)}
                    className="w-full bg-black/50 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {lookupError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {lookupError}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setLookupModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isLookingUp || !lookupInput.trim()}
                  >
                    {isLookingUp ? 'Searching...' : 'Find Appointment'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-emerald-400 font-bold">
                        {lookedUpBooking.bookingReference}
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">
                        {lookedUpBooking.serviceType || 'Consultation Session'}
                      </h4>
                    </div>
                    <Badge
                      variant={
                        lookedUpBooking.status === 'scheduled'
                          ? 'emerald'
                          : lookedUpBooking.status === 'completed'
                          ? 'cyan'
                          : 'rose'
                      }
                    >
                      {lookedUpBooking.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800/80 text-xs">
                    <div>
                      <span className="text-gray-500 block">Date & Time:</span>
                      <strong className="text-white">
                        {lookedUpBooking.date} at {lookedUpBooking.timeSlot}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Customer:</span>
                      <strong className="text-white">{lookedUpBooking.customerName}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Phone:</span>
                      <strong className="text-white">{lookedUpBooking.customerPhone}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Google Calendar:</span>
                      <span className="text-emerald-400 font-medium">Synced in Background</span>
                    </div>
                  </div>
                </div>

                {/* Reschedule UI if active */}
                {isRescheduling ? (
                  <div className="bg-black/40 border border-gray-800 rounded-2xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-white">Select New Date & Time Slot:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">New Date</label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={rescheduleData.newDate}
                          onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">New Time Slot</label>
                        <select
                          value={rescheduleData.newSlot}
                          onChange={(e) => setRescheduleData({ ...rescheduleData, newSlot: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl p-2.5 text-xs text-white"
                        >
                          <option value="">Select Slot...</option>
                          {['09:30 AM', '10:00 AM', '11:00 AM', '01:30 PM', '02:00 PM', '03:30 PM', '04:30 PM'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsRescheduling(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!rescheduleData.newDate || !rescheduleData.newSlot}
                        onClick={async () => {
                          try {
                            const res = await api.post(`/appointments/public/reschedule/${lookedUpBooking.bookingReference}`, {
                              newDate: rescheduleData.newDate,
                              newTimeSlot: rescheduleData.newSlot,
                            });
                            if (res.success) {
                              toast.success('Appointment rescheduled successfully!');
                              setLookedUpBooking(res.data);
                              setIsRescheduling(false);
                            }
                          } catch (err) {
                            toast.error(err.message || 'Rescheduling conflict');
                          }
                        }}
                      >
                        Confirm New Slot
                      </Button>
                    </div>
                  </div>
                ) : (
                  lookedUpBooking.status === 'scheduled' && (
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancelBooking(lookedUpBooking.bookingReference)}
                      >
                        Cancel Appointment
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setIsRescheduling(true);
                          setRescheduleData({
                            newDate: lookedUpBooking.date,
                            newSlot: lookedUpBooking.timeSlot,
                          });
                        }}
                      >
                        Reschedule Appointment
                      </Button>
                    </div>
                  )
                )}

                <div className="flex justify-end pt-2">
                  <Button variant="ghost" onClick={() => setLookedUpBooking(null)}>
                    Search Another
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
