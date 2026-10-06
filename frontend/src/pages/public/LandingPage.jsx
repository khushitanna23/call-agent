import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PhoneCall,
  Calendar,
  Sparkles,
  Bot,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Volume2,
  Mic,
  BarChart3,
  Clock,
  Layers,
  Building2,
  Stethoscope,
  Hotel,
  UtensilsCrossed,
  Car,
  GraduationCap,
  Wrench,
  Globe,
  Headphones,
  Check,
  Zap,
} from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { LiveVoiceCallModal } from '../../components/voice/LiveVoiceCallModal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const LandingPage = () => {
  const [voiceDemoOpen, setVoiceDemoOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState('Real Estate');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);
  const [demoFormData, setDemoFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
    preferredDateTime: '',
  });

  const toast = useToast();
  const navigate = useNavigate();

  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    if (!demoFormData.name || !demoFormData.email || !demoFormData.phone) {
      toast.error('Please fill in your name, email, and phone number.');
      return;
    }

    try {
      setIsSubmittingDemo(true);
      const res = await api.post('/demo/book', demoFormData);
      if (res.success) {
        toast.success(res.message || 'Demo request submitted successfully!');
        setDemoFormData({
          name: '',
          email: '',
          company: '',
          phone: '',
          message: '',
          preferredDateTime: '',
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit demo request');
    } finally {
      setIsSubmittingDemo(false);
    }
  };

  const industriesData = [
    {
      name: 'Real Estate',
      icon: Building2,
      headline: 'Capture High-Value Buyers & Schedule Property Showings 24/7',
      desc: 'Never miss an evening or weekend buyer inquiry. Sarah qualifies pre-approval status, captures property preferences, and books private showings directly onto agent calendars.',
      bullets: ['Automated pre-approval check', 'Calendar sync for open houses', 'Instant SMS lead alerts to brokers'],
    },
    {
      name: 'Healthcare',
      icon: Stethoscope,
      headline: 'HIPAA-Ready Patient Intake & Discovery Consultations',
      desc: 'Triage patient inquiries seamlessly. Automate appointment bookings, verify insurance questions, and route urgent medical emergencies to human nurses immediately.',
      bullets: ['Doctor schedule synchronization', 'Triage questionnaire routing', 'Reduces front-desk phone overload by 80%'],
    },
    {
      name: 'Hotel',
      icon: Hotel,
      headline: '24/7 Concierge, Amenity Inquiries & Room Booking',
      desc: 'Offer multi-lingual round-the-clock telephone concierge. Sarah answers check-in policies, amenities, dining reservations, and direct booking inquiries.',
      bullets: ['Direct PMS calendar integration', 'Instant answers on check-in & parking', 'Upsells spa & dining packages'],
    },
    {
      name: 'Restaurant',
      icon: UtensilsCrossed,
      headline: 'Table Reservations & Event Catering Inquiries',
      desc: 'Handle peak dinner rush phone calls without disturbing the dining room. Take table bookings, answer dietary questions, and qualify large private banquet requests.',
      bullets: ['Table reservation automation', 'Allergen & menu explanations', 'Private dining lead capture'],
    },
    {
      name: 'Automobile',
      icon: Car,
      headline: 'Test Drive Bookings & Service Department Routing',
      desc: 'Route prospective buyers to sales consultants and vehicle maintenance calls to service bays, capturing customer VIN numbers and test drive slots.',
      bullets: ['Weekend test drive scheduling', 'Service bay callback automation', 'Trade-in value qualification'],
    },
    {
      name: 'Education',
      icon: GraduationCap,
      headline: 'Student Admissions & Campus Tour Booking',
      desc: 'Guide prospective students through enrollment criteria, degree tracks, tuition details, and schedule campus visitation tours automatically.',
      bullets: ['Course prerequisite lookup', 'Campus tour reservations', 'Financial aid hotline triage'],
    },
    {
      name: 'Home Services',
      icon: Wrench,
      headline: 'Emergency Dispatch & Quote Requests',
      desc: 'Plumbing, HVAC, and roofing companies receive calls at all hours. Sarah identifies the emergency severity, captures the service address, and dispatches technicians.',
      bullets: ['Emergency dispatch triage', 'Service address & zip qualification', 'Quote request scheduling'],
    },
  ];

  const currentIndustry = industriesData.find((i) => i.name === selectedIndustry) || industriesData[0];

  const faqs = [
    {
      q: 'What is an AI Receptionist?',
      a: 'An AI Receptionist is an intelligent voice employee powered by advanced speech AI and LLMs that answers incoming telephone calls in natural, human-like voice, understands customer requests, searches your company knowledge base, qualifies prospective leads, and schedules appointments 24/7.',
    },
    {
      q: 'Can the AI answer real phone calls?',
      a: 'Yes! VEDANCO AI can be assigned a dedicated phone number (via Twilio or Vapi carrier integrations) or connected directly to your existing PBX or mobile phone number via conditional call forwarding.',
    },
    {
      q: 'Can it book appointments?',
      a: 'Absolutely. The AI Receptionist connects directly to Google Calendar, Microsoft Outlook, Calendly, and Cal.com to check real-time availability and confirm booking slots with callers.',
    },
    {
      q: 'Can it transfer calls to humans?',
      a: 'Yes. If a caller requests a human specialist or if a complex situation arises, the AI instantly executes a live telephone transfer to your designated phone number with zero dropped calls.',
    },
    {
      q: 'Can I train it with my website?',
      a: 'Yes. Simply enter your business website URL, and our system extracts your services, opening hours, pricing, and FAQs to train your AI in seconds.',
    },
    {
      q: 'Can I upload documents?',
      a: 'Yes. You can upload PDF, DOCX, and TXT files containing product manuals, price lists, contracts, and company policies to your private Knowledge Base.',
    },
    {
      q: 'Can I see call transcripts?',
      a: 'Every call generates a full speaker-attributed transcript, audio recording playback, AI summary, detected customer intent, and lead qualification score.',
    },
    {
      q: 'Can I connect my own phone number?',
      a: 'Yes. You can keep your existing phone number and set up call forwarding to your VEDANCO AI Receptionist, or purchase a dedicated local/toll-free number.',
    },
    {
      q: 'Is the AI available 24/7?',
      a: 'Yes. Your AI Receptionist never takes sick leave, sleeps, or puts callers on hold, ensuring 100% of your business inquiries are answered instantly.',
    },
    {
      q: 'How does pricing work?',
      a: 'Pricing is based on included monthly voice minutes (Starter at $99 for 300 min, Growth at $249 for 1,000 min, Business at $599 for 3,000 min). There are no long-term lock-in contracts.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#f3f4f6] flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      <PublicNavbar onOpenVoiceDemo={() => setVoiceDemoOpen(true)} />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-[#050505]">
        {/* Glow ambient background orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-xs font-semibold text-emerald-400 mb-6 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen AI Employee Platform</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
                Your AI Receptionist.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-teal-300">
                  Never Miss
                </span>{' '}
                a Customer Call.
              </h1>

              <p className="text-lg sm:text-xl text-gray-400 font-normal leading-relaxed mb-8 max-w-xl">
                Answer calls, qualify leads, book appointments and automate customer conversations with an AI receptionist that works 24/7.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  icon={PhoneCall}
                  onClick={() => setVoiceDemoOpen(true)}
                  className="shadow-md shadow-emerald-500/25 hover:scale-105 transition-transform"
                >
                  Talk to AI
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  icon={Calendar}
                  onClick={() => navigate('/book')}
                >
                  Schedule Appointment
                </Button>

                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center text-sm font-semibold text-gray-400 hover:text-emerald-400 px-3 py-2 transition"
                >
                  Deploy in 5 min <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 pt-6 border-t border-emerald-950/40 flex flex-wrap items-center gap-6 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Answer in 1 second
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Call Answering
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Two-Way Calendar Sync
                </span>
              </div>
            </div>

            {/* Right Column: Premium AI Receptionist & Dashboard Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md glass-panel rounded-3xl p-6 border border-emerald-500/20 shadow-2xl shadow-emerald-950/20">
                {/* Floating active call badge */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-emerald-950/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Sarah (AI Receptionist)</h4>
                      <p className="text-[11px] text-gray-400">+1 (800) 555-0199 • Inbound Call</p>
                    </div>
                  </div>
                  <Badge variant="emerald" size="xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live
                  </Badge>
                </div>

                {/* Dialogue Visual */}
                <div className="space-y-3 text-xs mb-5">
                  <div className="bg-[#08080a] rounded-2xl p-3 border border-emerald-950/60 text-gray-200">
                    <span className="font-semibold text-emerald-400 text-[10px] block mb-1">
                      SARAH (AI RECEPTIONIST)
                    </span>
                    "Hello! Thank you for calling. How can I assist you with scheduling today?"
                  </div>

                  <div className="bg-emerald-950/30 rounded-2xl p-3 border border-emerald-500/20 text-emerald-100 ml-4">
                    <span className="font-semibold text-emerald-400 text-[10px] block mb-1">
                      CALLER (DR. CHEN)
                    </span>
                    "I want to book an appointment for tomorrow morning."
                  </div>

                  <div className="bg-[#08080a] rounded-2xl p-3 border border-emerald-950/60 text-gray-200">
                    <span className="font-semibold text-emerald-400 text-[10px] block mb-1">
                      SARAH (AI RECEPTIONIST)
                    </span>
                    "Absolutely. I have 10:30 AM open on the calendar. Shall I lock that in?"
                  </div>
                </div>

                {/* Real-time stats mini strip */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-emerald-950/60 text-center">
                  <div className="bg-[#08080a] p-2.5 rounded-xl border border-emerald-950/60">
                    <span className="text-[10px] text-gray-400 block">AI Resolution</span>
                    <span className="text-sm font-bold text-emerald-400">96.8%</span>
                  </div>
                  <div className="bg-[#08080a] p-2.5 rounded-xl border border-emerald-950/60">
                    <span className="text-[10px] text-gray-400 block">Lead Score</span>
                    <span className="text-sm font-bold text-emerald-400">94 / 100</span>
                  </div>
                  <div className="bg-[#08080a] p-2.5 rounded-xl border border-emerald-950/60">
                    <span className="text-[10px] text-gray-400 block">Calendar</span>
                    <span className="text-sm font-bold text-emerald-400">Synced</span>
                  </div>
                </div>

                {/* Action button inside card */}
                <button
                  onClick={() => setVoiceDemoOpen(true)}
                  className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-black text-xs font-bold shadow-md shadow-emerald-500/25 hover:opacity-95 transition flex items-center justify-center gap-2"
                >
                  <Volume2 className="w-4 h-4" /> Test Voice Demo in Browser
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE AI DEMO SECTION */}
      <section id="demo-section" className="py-20 bg-[#0a0a0c] border-y border-emerald-950/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-xs font-semibold text-emerald-400 mb-3">
            <Mic className="w-3.5 h-3.5" /> TALK TO OUR AI
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Experience the Future of Telephone Answering
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-base mb-8">
            Click below to start an interactive browser voice call with Sarah. Test her tone, ability to understand requests, and see live transcription in real time.
          </p>

          <div className="inline-block p-1 rounded-3xl bg-gradient-to-r from-emerald-500/30 via-green-500/30 to-teal-500/30 shadow-glow">
            <div className="glass-panel rounded-3xl p-8 sm:p-10 max-w-xl mx-auto text-center flex flex-col items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-green-700 flex items-center justify-center text-black font-bold shadow-md shadow-emerald-500/25">
                <Bot className="w-10 h-10 text-black" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Browser Voice Sandbox</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Ready to test with speech recognition & smart receptionist reasoning
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                icon={PhoneCall}
                onClick={() => setVoiceDemoOpen(true)}
                className="w-full sm:w-auto px-8 py-3.5 text-base shadow-md shadow-emerald-500/25"
              >
                Launch Voice Call Demo
              </Button>

              <span className="text-[11px] text-gray-400">
                🔒 Safe Demo Mode • No carrier fees or registration needed
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (5 STEPS) */}
      <section id="how-it-works" className="py-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
              Simple 5-Step Setup
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              From Zero to Live AI Receptionist in Minutes
            </h3>
            <p className="text-gray-400 mt-4 text-base">
              No complex telephony equipment, coding, or long training cycles required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { step: '01', title: 'Create Your AI', desc: 'Choose a name, industry persona, and friendly female or male voice.' },
              { step: '02', title: 'Train Your AI', desc: 'Import website URLs, upload PDF/DOCX files, and define custom FAQs.' },
              { step: '03', title: 'Connect Your Phone', desc: 'Pick a toll-free number or forward calls from your existing business line.' },
              { step: '04', title: 'Test Your AI', desc: 'Dial in or test directly in your browser with our interactive test sandbox.' },
              { step: '05', title: 'Go Live', desc: 'Turn on 24/7 call answering, lead qualification, and calendar bookings.' },
            ].map((s, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 border border-emerald-950/80 hover:border-emerald-500/40 transition-all flex flex-col relative group"
              >
                <span className="text-3xl font-extrabold text-emerald-500/30 group-hover:text-emerald-400 transition font-mono mb-4">
                  {s.step}
                </span>
                <h4 className="text-base font-bold text-white mb-2">{s.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID (10 CARDS) */}
      <section id="features" className="py-24 bg-[#0a0a0c] border-y border-emerald-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
              Comprehensive Capabilities
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for Complete Customer Automation
            </h3>
            <p className="text-gray-400 mt-4 text-base">
              Everything your front-desk needs to deliver five-star phone experiences on every ring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Bot,
                title: 'AI Call Agent',
                desc: 'Understands complex accents and spoken intent, answering queries naturally with under 500ms latency.',
              },
              {
                icon: Layers,
                title: 'Knowledge Base',
                desc: 'Upload PDFs, Word docs, websites, and FAQs to give your receptionist deep company context.',
              },
              {
                icon: Volume2,
                title: 'Call Recording',
                desc: 'Full HD playback of every call with audio speed controls and secure encrypted storage.',
              },
              {
                icon: Clock,
                title: 'Call Transcript',
                desc: 'Speaker-labeled transcripts with timestamps, instant search, copy, and export capabilities.',
              },
              {
                icon: Zap,
                title: 'Lead Capture',
                desc: 'Automatically extracts caller name, phone number, company, email, and requirements.',
              },
              {
                icon: ShieldCheck,
                title: 'Lead Qualification',
                desc: 'Evaluates budget, urgency, and fit with an instant 0-100 AI Qualification Score.',
              },
              {
                icon: Calendar,
                title: 'Appointment Booking',
                desc: 'Two-way integration with Google Calendar, Outlook, and Calendly to lock in meetings.',
              },
              {
                icon: Headphones,
                title: 'Call Transfer',
                desc: 'Seamless live warm transfer to human staff when caller demands a specialist.',
              },
              {
                icon: BarChart3,
                title: 'Call Analytics',
                desc: 'Track call volumes, answer rates, resolution efficiency, and cost per minute over time.',
              },
              {
                icon: Globe,
                title: '24/7 Availability',
                desc: 'Never let another customer reach voicemail. Zero downtime, zero queue delays.',
              },
            ].map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="glass-card rounded-2xl p-6 border border-emerald-950/80 hover:border-emerald-500/30 transition-all flex flex-col gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-white">{f.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* INDUSTRIES SHOWCASE */}
      <section id="solutions" className="py-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
              Industry Tailored
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Pre-Trained for Your Specific Business Vertical
            </h3>
          </div>

          {/* Industry tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
            {industriesData.map((ind) => (
              <button
                key={ind.name}
                onClick={() => setSelectedIndustry(ind.name)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedIndustry === ind.name
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-black font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-[#0e0e11] border border-emerald-950/60 text-gray-300 hover:text-emerald-400 hover:border-emerald-500/30'
                }`}
              >
                <ind.icon className="w-4 h-4" />
                {ind.name}
              </button>
            ))}
          </div>

          {/* Industry active card */}
          <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-emerald-500/20 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <currentIndustry.icon className="w-4 h-4" />
                  {currentIndustry.name} Solutions
                </div>
                <h4 className="text-2xl font-bold text-white mb-4 leading-tight">
                  {currentIndustry.headline}
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">
                  {currentIndustry.desc}
                </p>
                <div className="space-y-2.5">
                  {currentIndustry.bullets.map((b, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-200">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#08080a] rounded-2xl p-6 border border-emerald-950/60 text-xs">
                <span className="text-[11px] font-mono text-emerald-400/80 block mb-3 uppercase">
                  Live Reception Simulation
                </span>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#121215] border border-emerald-950/70 text-gray-200">
                    <strong className="text-emerald-400 block text-[11px] mb-1">AI Receptionist</strong>
                    "Welcome to {currentIndustry.name} Support! I can assist with booking or urgent requests. How may I direct your call?"
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-100 ml-4">
                    <strong className="text-emerald-400 block text-[11px] mb-1">Customer</strong>
                    "I want to book an initial appointment."
                  </div>
                  <div className="p-3 rounded-xl bg-[#121215] border border-emerald-950/70 text-gray-200">
                    <strong className="text-emerald-400 block text-[11px] mb-1">AI Receptionist</strong>
                    "Certainly. Checking our real-time calendar... I have tomorrow at 10:30 AM or 2:00 PM available."
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REALISTIC CALL EXAMPLE SECTION */}
      <section className="py-24 bg-[#0a0a0c] border-y border-emerald-950/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="cyan" size="sm" className="mb-3">
            Real Dialogue Flow
          </Badge>
          <h3 className="text-3xl font-extrabold text-white tracking-tight mb-8">
            Natural Conversations That Convert
          </h3>

          <div className="glass-panel rounded-3xl p-8 border border-emerald-500/25 text-left space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 text-xs font-bold">
                C
              </div>
              <div className="flex-1 bg-[#0c0c0e] rounded-2xl p-4 border border-emerald-950/70">
                <span className="text-[11px] text-emerald-400 font-bold block mb-1">Customer</span>
                <p className="text-sm text-gray-200">"Hi, I want to know about your services."</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 text-xs font-bold">
                AI
              </div>
              <div className="flex-1 bg-[#121215] rounded-2xl p-4 border border-emerald-500/30 shadow-md">
                <span className="text-[11px] text-emerald-400 font-bold block mb-1">AI Receptionist (Sarah)</span>
                <p className="text-sm text-gray-200">
                  "Sure. I'd be happy to help. What service are you interested in?"
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 text-xs font-bold">
                C
              </div>
              <div className="flex-1 bg-[#0c0c0e] rounded-2xl p-4 border border-emerald-950/70">
                <span className="text-[11px] text-emerald-400 font-bold block mb-1">Customer</span>
                <p className="text-sm text-gray-200">"I want to book an appointment."</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 text-xs font-bold">
                AI
              </div>
              <div className="flex-1 bg-[#121215] rounded-2xl p-4 border border-emerald-500/30 shadow-md">
                <span className="text-[11px] text-emerald-400 font-bold block mb-1">AI Receptionist (Sarah)</span>
                <p className="text-sm text-gray-200">
                  "Absolutely. Let me check the available times."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
              Simple, Predictable Plans
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Invest in Scalable Customer Operations
            </h3>
            <p className="text-gray-400 mt-4 text-base">
              Choose the package that fits your current call volume. Upgrade or downgrade anytime.
            </p>

            {/* Billing Toggle */}
            <div className="mt-6 inline-flex items-center p-1 rounded-xl bg-[#0c0c0e] border border-emerald-950/60 shadow-xs">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  billingCycle === 'monthly' ? 'bg-emerald-500 text-black font-bold shadow-xs' : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  billingCycle === 'annual' ? 'bg-emerald-500 text-black font-bold shadow-xs' : 'text-gray-400 hover:text-white'
                }`}
              >
                Annual <span className="text-[10px] text-emerald-400 font-bold">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* STARTER */}
            <div className="glass-card rounded-3xl p-6 border border-emerald-950/70 flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-white">Starter</h4>
                <p className="text-xs text-gray-400 mt-1">For solopreneurs & small clinics</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-white">$99</span>
                  <span className="text-xs text-gray-400">/month</span>
                  <div className="text-xs text-emerald-400 font-semibold mt-1">300 Included Minutes</div>
                </div>
                <div className="space-y-3 text-xs text-gray-300">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 1 AI Receptionist</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 300 voice minutes</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Lead qualification</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Appointment scheduling</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Email alerts</div>
                </div>
              </div>
              <Link to="/signup" className="mt-8">
                <Button variant="outline" size="md" className="w-full">
                  Deploy Starter
                </Button>
              </Link>
            </div>

            {/* GROWTH */}
            <div className="glass-panel rounded-3xl p-6 border border-emerald-500/40 shadow-glow relative flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="cyan" size="xs">MOST POPULAR</Badge>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Growth</h4>
                <p className="text-xs text-gray-400 mt-1">For growing teams & multi-agent firms</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-white">$249</span>
                  <span className="text-xs text-gray-400">/month</span>
                  <div className="text-xs text-emerald-400 font-semibold mt-1">1,000 Included Minutes</div>
                </div>
                <div className="space-y-3 text-xs text-gray-300">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Up to 3 AI Receptionists</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 1,000 voice minutes</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Knowledge base & doc upload</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Live human call transfer</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Google / Outlook sync</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Priority support</div>
                </div>
              </div>
              <Link to="/signup" className="mt-8">
                <Button variant="primary" size="md" className="w-full">
                  Deploy Growth
                </Button>
              </Link>
            </div>

            {/* BUSINESS */}
            <div className="glass-card rounded-3xl p-6 border border-emerald-950/70 flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-white">Business</h4>
                <p className="text-xs text-gray-400 mt-1">For high call volume businesses</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-white">$599</span>
                  <span className="text-xs text-gray-400">/month</span>
                  <div className="text-xs text-emerald-400 font-semibold mt-1">3,000 Included Minutes</div>
                </div>
                <div className="space-y-3 text-xs text-gray-300">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unlimited AI Employees</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 3,000 voice minutes</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Custom voice cloning</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Webhooks & REST API</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Advanced analytics & exports</div>
                </div>
              </div>
              <Link to="/signup" className="mt-8">
                <Button variant="outline" size="md" className="w-full">
                  Deploy Business
                </Button>
              </Link>
            </div>

            {/* ENTERPRISE */}
            <div className="glass-card rounded-3xl p-6 border border-emerald-950/70 flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-white">Enterprise</h4>
                <p className="text-xs text-gray-400 mt-1">Tailored for franchise & large networks</p>
                <div className="my-6">
                  <span className="text-3xl font-extrabold text-white">Custom</span>
                  <div className="text-xs text-emerald-400 font-semibold mt-1">Volume Minute Pricing</div>
                </div>
                <div className="space-y-3 text-xs text-gray-300">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Custom PBX SIP Trunking</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> HIPAA & SOC-2 compliance</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Custom LLM fine-tuning</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Dedicated account manager</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 99.99% SLA</div>
                </div>
              </div>
              <button
                onClick={() => document.getElementById('book-demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-8"
              >
                <Button variant="secondary" size="md" className="w-full">
                  Contact Sales
                </Button>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 bg-[#0a0a0c] border-y border-emerald-950/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
              Frequently Asked Questions
            </h2>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              Everything You Need to Know
            </h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl border border-emerald-950/70 overflow-hidden transition-all hover:border-emerald-500/30"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-white hover:text-emerald-400 transition"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-emerald-400/80 shrink-0 transition-transform duration-200 ${
                      activeFaq === idx ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-emerald-950/70 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOK DEMO SECTION */}
      <section id="book-demo" className="py-24 relative bg-[#050505]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-emerald-500/25 shadow-2xl relative overflow-hidden">
            <div className="text-center max-w-xl mx-auto mb-10">
              <Badge variant="cyan" size="sm" className="mb-2">
                Personalized Consultation
              </Badge>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                Schedule a 1-on-1 AI Walkthrough
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-2">
                See how VEDANCO AI can replace dropped calls with confirmed appointments for your business.
              </p>
            </div>

            <form onSubmit={handleDemoSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={demoFormData.name}
                    onChange={(e) => setDemoFormData({ ...demoFormData, name: e.target.value })}
                    placeholder="e.g. Alex Johnson"
                    className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={demoFormData.email}
                    onChange={(e) => setDemoFormData({ ...demoFormData, email: e.target.value })}
                    placeholder="alex@company.com"
                    className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={demoFormData.company}
                    onChange={(e) => setDemoFormData({ ...demoFormData, company: e.target.value })}
                    placeholder="e.g. Acme Properties"
                    className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={demoFormData.phone}
                    onChange={(e) => setDemoFormData({ ...demoFormData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Preferred Date & Time
                </label>
                <input
                  type="text"
                  value={demoFormData.preferredDateTime}
                  onChange={(e) => setDemoFormData({ ...demoFormData, preferredDateTime: e.target.value })}
                  placeholder="e.g. Tomorrow at 2:00 PM EST"
                  className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  How can we help your business?
                </label>
                <textarea
                  rows={3}
                  value={demoFormData.message}
                  onChange={(e) => setDemoFormData({ ...demoFormData, message: e.target.value })}
                  placeholder="Estimated daily inbound call volume, existing CRM, or current telephony setup..."
                  className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmittingDemo}
                  className="w-full shadow-glow py-3.5"
                >
                  Confirm Demo Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <PublicFooter />

      {/* Interactive voice call demo modal */}
      <LiveVoiceCallModal
        isOpen={voiceDemoOpen}
        onClose={() => setVoiceDemoOpen(false)}
        agentName="Sarah"
      />
    </div>
  );
};
