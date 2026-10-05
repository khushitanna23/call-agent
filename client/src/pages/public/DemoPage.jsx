import React, { useState } from 'react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { LiveVoiceCallModal } from '../../components/voice/LiveVoiceCallModal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { PhoneCall, Bot, Sparkles, CheckCircle2, ShieldCheck, Calendar } from 'lucide-react';
import api from '../../api/client';

export const DemoPage = () => {
  const [voiceDemoOpen, setVoiceDemoOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
    preferredDateTime: '',
  });

  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await api.post('/demo/book', formData);
      toast.success(res.message || 'Demo scheduled! Check your email for confirmation.');
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        message: '',
        preferredDateTime: '',
      });
    } catch (err) {
      toast.error(err.message || 'Error scheduling demo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 flex flex-col">
      <PublicNavbar onOpenVoiceDemo={() => setVoiceDemoOpen(true)} />

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Live Audio Demo Trigger & Benefits */}
            <div className="lg:col-span-6 space-y-8">
              <div>
                <Badge variant="cyan" size="sm" className="mb-3">
                  Interactive AI Sandbox
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  Speak with our AI Receptionist Right Now
                </h1>
                <p className="text-gray-400 mt-4 text-base leading-relaxed">
                  Experience how Sarah responds with natural human cadence, understands business inquiries, and books consultations in seconds.
                </p>
              </div>

              {/* Sandbox Card */}
              <div className="glass-panel rounded-3xl p-8 border border-emerald-500/30 shadow-glow relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-black shadow-glow">
                    <Bot className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Live Voice Call Test</h3>
                    <p className="text-xs text-gray-400">Browser Audio & Speech Synthesis Ready</p>
                  </div>
                </div>

                <p className="text-xs text-gray-300 mb-6 leading-relaxed">
                  Click below to begin speaking. You can ask about our service plans, test appointment booking, or request a call transfer.
                </p>

                <Button
                  variant="primary"
                  size="lg"
                  icon={PhoneCall}
                  onClick={() => setVoiceDemoOpen(true)}
                  className="w-full py-4 text-base"
                >
                  Start Browser Voice Call
                </Button>

                <div className="mt-4 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Microphone optional (supports typing)</span>
                  <span>Zero carrier charges</span>
                </div>
              </div>

              {/* What you will experience */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Key Capabilities Demonstrated
                </h4>
                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Real-time voice turn-taking and conversational interruptions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Smart Knowledge Base retrieval for pricing & policies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Calendar availability checking and mock appointment booking</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Book a Personalized Guided Walkthrough */}
            <div className="lg:col-span-6">
              <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-emerald-500/25 shadow-2xl">
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <Calendar className="w-4 h-4" /> 1-on-1 Guided Demo
                  </div>
                  <h3 className="text-2xl font-bold text-white">Book a Live Implementation Session</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Meet with our AI voice engineers to see your custom knowledge base and phone setup in action.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Sarah Connor"
                        className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">Work Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="sarah@enterprise.com"
                        className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">Company</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Connor Group"
                        className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 234-5678"
                        className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">Preferred Date/Time</label>
                    <input
                      type="text"
                      value={formData.preferredDateTime}
                      onChange={(e) => setFormData({ ...formData, preferredDateTime: e.target.value })}
                      placeholder="e.g. Wednesday at 11:00 AM EST"
                      className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">Notes / Call Volume</label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your team size, expected call volumes, or desired CRM integrations..."
                      className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    className="w-full shadow-glow py-3.5"
                  >
                    Confirm Walkthrough Request
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />

      <LiveVoiceCallModal
        isOpen={voiceDemoOpen}
        onClose={() => setVoiceDemoOpen(false)}
        agentName="Sarah"
      />
    </div>
  );
};
