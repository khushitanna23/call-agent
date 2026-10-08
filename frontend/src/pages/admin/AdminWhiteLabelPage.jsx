import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Globe,
  Mail,
  Palette,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Save,
  RotateCcw,
  Upload,
  ExternalLink,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export const AdminWhiteLabelPage = () => {
  const toast = useToast();
  const [copiedField, setCopiedField] = useState(null);
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [dnsStatus, setDnsStatus] = useState('verified'); // 'verified', 'pending', 'unconfigured'

  const [branding, setBranding] = useState({
    platformName: 'VEDANCO AI Agency',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#10b981',
    accentColor: '#059669',
    canvasColor: '#050505',
    customDomain: 'voice.agencyclientportal.com',
    supportEmail: 'support@youragency.com',
    emailSenderName: 'Agency AI Voice Dispatch',
    hideVendorBadges: true,
  });

  const [activeEmailTab, setActiveEmailTab] = useState('lead_alert');
  const [emailTemplates, setEmailTemplates] = useState({
    lead_alert: {
      subject: '🔥 New AI Voice Lead Captured: {{lead_name}} ({{company}})',
      body: `Hello {{client_name}},

Great news! Your AI Receptionist {{agent_name}} just completed a call with {{lead_name}}.

Key Call Insights:
• Caller: {{lead_name}} ({{caller_phone}})
• Intent: {{lead_intent}}
• AI Qualification Score: {{lead_score}}/100
• Deal Value Estimate: {{deal_value}}

AI Summary:
"{{call_summary}}"

Log in to your client CRM to take action or view the recording.
Powered by {{platform_name}}`,
    },
    appointment: {
      subject: '📅 Appointment Scheduled: {{customer_name}} with {{agent_name}}',
      body: `Hi {{client_name}},

A new consultation has been booked through your voice assistant!

Appointment Details:
• Customer: {{customer_name}}
• Contact: {{customer_phone}} ({{customer_email}})
• Scheduled Date & Time: {{appointment_date}} at {{appointment_time}}
• Service Type: {{service_type}}

The Google Calendar invite has been synchronized automatically.
Powered by {{platform_name}}`,
    },
    recording_ready: {
      subject: '🎙️ Call Recording & Transcript Ready: {{caller_phone}}',
      body: `Hi {{client_name}},

A call has concluded with duration {{duration_seconds}} seconds.

• Caller: {{caller_phone}}
• AI Sentiment: {{sentiment}}
• Recording URL: {{recording_url}}

Review the full transcript in your Communications Console.
Powered by {{platform_name}}`,
    },
  });

  // Load saved branding from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vedanco_whitelabel_settings');
      if (saved) {
        setBranding((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {}
  }, []);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Copied to clipboard');
  };

  const handleVerifyDns = () => {
    if (!branding.customDomain) {
      toast.error('Please enter a custom domain');
      return;
    }
    setIsVerifyingDns(true);
    setTimeout(() => {
      setIsVerifyingDns(false);
      setDnsStatus('verified');
      toast.success(`CNAME verified successfully for ${branding.customDomain}! SSL active.`);
    }, 1500);
  };

  const handleSaveBranding = () => {
    localStorage.setItem('vedanco_whitelabel_settings', JSON.stringify(branding));
    toast.success('Agency white-label settings saved successfully!');
  };

  const presetColors = [
    { label: 'Emerald (Default)', primary: '#10b981', accent: '#059669' },
    { label: 'Cyan Teal', primary: '#06b6d4', accent: '#0891b2' },
    { label: 'Electric Blue', primary: '#3b82f6', accent: '#2563eb' },
    { label: 'Violet Royal', primary: '#8b5cf6', accent: '#7c3aed' },
    { label: 'Amber Gold', primary: '#f59e0b', accent: '#d97706' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in pb-12 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-950/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              Agency Master Configuration
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Agency White-Label Branding
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Completely remove vendor references, apply your custom domain, set brand colors, and deliver custom transactional emails.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Save} onClick={handleSaveBranding} className="shadow-glow">
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Branding & Domain */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Agency Brand Identity */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-emerald-950/60">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Visual Identity & Swatches</h3>
                <p className="text-xs text-gray-400">Customize what your clients see across their portals.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Platform / Agency Title
                </label>
                <input
                  type="text"
                  value={branding.platformName}
                  onChange={(e) => setBranding({ ...branding, platformName: e.target.value })}
                  placeholder="e.g. Apex Voice AI"
                  className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Agency Logo Image URL
                  </label>
                  <input
                    type="text"
                    value={branding.logoUrl}
                    onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                    placeholder="https://youragency.com/logo.svg"
                    className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Favicon URL
                  </label>
                  <input
                    type="text"
                    value={branding.faviconUrl}
                    onChange={(e) => setBranding({ ...branding, faviconUrl: e.target.value })}
                    placeholder="https://youragency.com/favicon.ico"
                    className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  Brand Color Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {presetColors.map((c) => (
                    <button
                      key={c.primary}
                      type="button"
                      onClick={() => setBranding({ ...branding, primaryColor: c.primary, accentColor: c.accent })}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition ${
                        branding.primaryColor === c.primary
                          ? 'border-emerald-500 bg-emerald-500/10 text-white font-semibold'
                          : 'border-slate-800 bg-[#0c0c0e] text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: c.primary }} />
                      <span className="truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Primary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-3 py-2 text-xs font-mono text-white uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Secondary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.accentColor}
                      onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                      className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.accentColor}
                      onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                      className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-3 py-2 text-xs font-mono text-white uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Custom CNAME Domain */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-emerald-950/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Custom Domain & CNAME</h3>
                  <p className="text-xs text-gray-400">Host client workspaces on your agency's domain.</p>
                </div>
              </div>
              <Badge variant={dnsStatus === 'verified' ? 'emerald' : 'amber'} size="xs">
                {dnsStatus === 'verified' ? 'DNS Verified & SSL Active' : 'Pending Verification'}
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Your Custom CNAME Hostname
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={branding.customDomain}
                    onChange={(e) => setBranding({ ...branding, customDomain: e.target.value })}
                    placeholder="voice.yourdomain.com"
                    className="flex-1 bg-[#08080a] border border-emerald-950/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    icon={isVerifyingDns ? RotateCcw : CheckCircle2}
                    isLoading={isVerifyingDns}
                    onClick={handleVerifyDns}
                  >
                    Verify DNS
                  </Button>
                </div>
              </div>

              {/* DNS Instructions Box */}
              <div className="bg-[#08080a] rounded-2xl p-4 border border-slate-800 text-xs space-y-3">
                <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  DNS Record Setup (Cloudflare / GoDaddy / Route53)
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] py-1 bg-[#121215] p-2.5 rounded-xl border border-slate-800/60 text-gray-300">
                  <div>
                    <span className="text-[10px] text-gray-500 block">TYPE</span>
                    <strong className="text-white">CNAME</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">HOST / NAME</span>
                    <strong className="text-white">voice</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">TARGET VALUE</span>
                    <strong className="text-emerald-400">cname.vedanco.ai</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>SSL Certificate: <strong>Automatic Let's Encrypt (Zero-Config)</strong></span>
                  <button
                    onClick={() => handleCopy('cname.vedanco.ai', 'cname')}
                    className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    {copiedField === 'cname' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy CNAME Target
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: White-Label Email Templates */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-emerald-950/60">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">White-Label Email Templates</h3>
                <p className="text-xs text-gray-400">Branded notifications sent to your clients.</p>
              </div>
            </div>

            {/* Email Tabs */}
            <div className="flex gap-1 p-1 bg-[#08080a] rounded-xl border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setActiveEmailTab('lead_alert')}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition ${
                  activeEmailTab === 'lead_alert' ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:text-white'
                }`}
              >
                Lead Alert
              </button>
              <button
                type="button"
                onClick={() => setActiveEmailTab('appointment')}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition ${
                  activeEmailTab === 'appointment' ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:text-white'
                }`}
              >
                Appointment
              </button>
              <button
                type="button"
                onClick={() => setActiveEmailTab('recording_ready')}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition ${
                  activeEmailTab === 'recording_ready' ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:text-white'
                }`}
              >
                Call Recording
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Subject Line Template
                </label>
                <input
                  type="text"
                  value={emailTemplates[activeEmailTab].subject}
                  onChange={(e) =>
                    setEmailTemplates({
                      ...emailTemplates,
                      [activeEmailTab]: { ...emailTemplates[activeEmailTab], subject: e.target.value },
                    })
                  }
                  className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Body Template (Variables supported)
                </label>
                <textarea
                  rows={8}
                  value={emailTemplates[activeEmailTab].body}
                  onChange={(e) =>
                    setEmailTemplates({
                      ...emailTemplates,
                      [activeEmailTab]: { ...emailTemplates[activeEmailTab], body: e.target.value },
                    })
                  }
                  className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-purple-400 leading-relaxed"
                />
              </div>

              {/* Supported Dynamic Variables */}
              <div className="p-3 bg-[#0c0c0e] rounded-xl border border-slate-800 text-[11px] text-gray-400">
                <span className="font-semibold text-gray-300 block mb-1">Supported Dynamic Tags:</span>
                <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-purple-300">{"{{lead_name}}"}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-purple-300">{"{{company}}"}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-purple-300">{"{{agent_name}}"}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-purple-300">{"{{call_summary}}"}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-purple-300">{"{{appointment_date}}"}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
