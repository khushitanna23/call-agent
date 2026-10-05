import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, HelpCircle, ShieldCheck, Zap } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LiveVoiceCallModal } from '../../components/voice/LiveVoiceCallModal';

export const PricingPage = () => {
  const [voiceDemoOpen, setVoiceDemoOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: billingCycle === 'monthly' ? 99 : 79,
      minutes: '300 Minutes',
      description: 'Ideal for solopreneurs, individual doctors, and boutique service firms.',
      features: [
        '1 AI Receptionist',
        '300 Included Voice Minutes',
        'Standard Latency (< 650ms)',
        'Lead Capture & Automatic Qualification',
        'Direct Appointment Scheduling',
        'Email Alerts on Every Call',
        'Basic Call Analytics',
      ],
      cta: 'Get Started with Starter',
      popular: false,
    },
    {
      id: 'growth',
      name: 'Growth',
      price: billingCycle === 'monthly' ? 249 : 199,
      minutes: '1,000 Minutes',
      description: 'Best for growing real estate agencies, multi-doctor clinics, and auto dealerships.',
      features: [
        'Up to 3 AI Receptionists',
        '1,000 Included Voice Minutes',
        'Ultra-low Latency (< 450ms)',
        'Custom Knowledge Base & PDF Uploads',
        'Live Warm Transfer to Human Staff',
        'Two-way Google & Outlook Calendar Sync',
        'SMS & WhatsApp Notifications',
        'Priority 24/7 Support',
      ],
      cta: 'Deploy Growth Plan',
      popular: true,
    },
    {
      id: 'business',
      name: 'Business',
      price: billingCycle === 'monthly' ? 599 : 479,
      minutes: '3,000 Minutes',
      description: 'For high call volume teams, franchises, and regional service organizations.',
      features: [
        'Unlimited AI Receptionists',
        '3,000 Included Voice Minutes',
        'Custom Voice Persona Cloning',
        'Rest API & Webhooks Access',
        'Full Audio Recordings & Transcripts',
        'Custom CRM Sync (Salesforce, HubSpot)',
        'Dedicated Technical Onboarding',
      ],
      cta: 'Deploy Business Plan',
      popular: false,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      minutes: 'Volume Minutes',
      description: 'Custom voice solutions for hospital networks, large hotel chains, and enterprise fleets.',
      features: [
        'Dedicated Private Cloud / On-Premise PBX',
        'HIPAA & SOC-2 Type II Compliance',
        'Custom Fine-Tuned Domain LLMs',
        'Unlimited Concurrent Call Channels',
        '99.99% Uptime Service Level Agreement',
        'Dedicated Solutions Architect & 24/7 SLA',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 flex flex-col">
      <PublicNavbar onOpenVoiceDemo={() => setVoiceDemoOpen(true)} />

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="cyan" size="sm" className="mb-3">
              Transparent Pricing
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Invest in Automated Phone Operations
            </h1>
            <p className="text-gray-400 mt-4 text-base sm:text-lg">
              Never let a prospective customer reach voicemail again. Upgrade or change plans as your volume expands.
            </p>

            {/* Toggle */}
            <div className="mt-8 inline-flex items-center p-1 rounded-2xl bg-[#0c0c0e] border border-emerald-950/60">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                  billingCycle === 'monthly' ? 'bg-emerald-500 text-black font-bold shadow-xs' : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  billingCycle === 'annual' ? 'bg-emerald-500 text-black font-bold shadow-xs' : 'text-gray-400 hover:text-white'
                }`}
              >
                Annual Billing <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">Save 20%</span>
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`rounded-3xl p-6 flex flex-col justify-between transition-all ${
                  p.popular
                    ? 'glass-panel border-emerald-500/50 shadow-glow relative scale-105 z-10'
                    : 'glass-card border-emerald-950/70'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge variant="cyan" size="xs">
                      <Sparkles className="w-3 h-3" /> RECOMMENDED
                    </Badge>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white">{p.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 min-h-[32px]">{p.description}</p>

                  <div className="my-6 pb-6 border-b border-emerald-950/70">
                    {typeof p.price === 'number' ? (
                      <div className="flex items-baseline">
                        <span className="text-4xl font-extrabold text-white">${p.price}</span>
                        <span className="text-xs text-gray-400 ml-1.5">/month</span>
                      </div>
                    ) : (
                      <span className="text-3xl font-extrabold text-white">{p.price}</span>
                    )}
                    <span className="text-xs font-semibold text-emerald-400 block mt-1">
                      {p.minutes}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs text-gray-300">
                    {p.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <Link to="/signup">
                    <Button
                      variant={p.popular ? 'primary' : 'outline'}
                      size="md"
                      className="w-full"
                    >
                      {p.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Overage and feature callouts */}
          <div className="mt-16 glass-card rounded-2xl p-6 border border-emerald-950/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>
                Standard overage rate: <strong className="text-white">$0.15 / additional minute</strong> across all plans.
              </span>
            </div>
            <div className="flex items-center gap-4 text-gray-300">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> Cancel Anytime
              </span>
              <span>•</span>
              <span>No Carrier Setup Fees</span>
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
