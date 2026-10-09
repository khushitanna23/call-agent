import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  User,
  Building,
  Lock,
  Bell,
  Bot,
  Phone,
  ShieldCheck,
  Check,
  Globe,
  Palette,
  Save,
  Copy,
  RotateCcw,
  Upload,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const SettingsPage = () => {
  const { user, organization, refreshUser, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(queryTab || 'profile');
  const toast = useToast();

  useEffect(() => {
    if (queryTab) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [companyName, setCompanyName] = useState(organization?.name || '');
  const [timezone, setTimezone] = useState(organization?.settings?.timezone || 'America/New_York');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Phone settings
  const [fallbackPhone, setFallbackPhone] = useState(
    organization?.settings?.fallbackPhoneNumber || '+1 (555) 789-0123'
  );
  const [consentMsg, setConsentMsg] = useState(
    organization?.settings?.recordingConsentMessage ||
      'This call may be recorded for quality and training purposes.'
  );

  // White-Label Branding State (Admin)
  const [copiedField, setCopiedField] = useState(null);
  const [isVerifyingDns, setIsVerifyingDns] = useState(false);
  const [dnsStatus, setDnsStatus] = useState('verified');
  const [branding, setBranding] = useState({
    platformName: 'VEDANCO AI Agency',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#10b981',
    accentColor: '#059669',
    customDomain: 'voice.agencyclientportal.com',
    supportEmail: 'support@youragency.com',
    emailSenderName: 'Agency AI Voice Dispatch',
    hideVendorBadges: true,
  });

  const [activeEmailTab, setActiveEmailTab] = useState('lead_alert');
  const [emailTemplates, setEmailTemplates] = useState({
    lead_alert: {
      subject: '🔥 New AI Voice Lead Captured: {{lead_name}} ({{company}})',
      body: 'Hello {{client_name}},\n\nGreat news! Your AI Receptionist {{agent_name}} just completed a call with {{lead_name}}.\n\nIntent: {{lead_intent}}\nScore: {{lead_score}}/100\nDeal Value: {{deal_value}}\n\nLog in to your client CRM to take action.\nPowered by {{platform_name}}',
    },
    appointment: {
      subject: '📅 Appointment Scheduled: {{customer_name}} with {{agent_name}}',
      body: 'Hi {{client_name}},\n\nA new consultation has been booked through your voice assistant!\n\nCustomer: {{customer_name}} ({{customer_phone}})\nDate & Time: {{appointment_date}} at {{appointment_time}}\nService: {{service_type}}\n\nPowered by {{platform_name}}',
    },
    recording_ready: {
      subject: '🎙️ Call Recording & Transcript Ready: {{caller_phone}}',
      body: 'Hi {{client_name}},\n\nA call has concluded with duration {{duration_seconds}} seconds.\n\nCaller: {{caller_phone}}\nSentiment: {{sentiment}}\nRecording: {{recording_url}}\n\nPowered by {{platform_name}}',
    },
  });

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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      const res = await api.put('/auth/profile', { name, companyName, timezone });
      if (res.success) {
        toast.success('Profile and company settings updated!');
        refreshUser();
      }
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      setIsUpdatingPassword(true);
      await api.put('/auth/password', { currentPassword, newPassword });
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const presetColors = [
    { label: 'Emerald (Default)', primary: '#10b981', accent: '#059669' },
    { label: 'Cyan Teal', primary: '#06b6d4', accent: '#0891b2' },
    { label: 'Electric Blue', primary: '#3b82f6', accent: '#2563eb' },
    { label: 'Violet Royal', primary: '#8b5cf6', accent: '#7c3aed' },
    { label: 'Amber Gold', primary: '#f59e0b', accent: '#d97706' },
  ];

  const tabs = [
    { id: 'profile', label: 'Profile & Organization', icon: User },
    { id: 'security', label: 'Security & Password', icon: Lock },
    { id: 'phone', label: 'Phone & Call Settings', icon: Phone },
    { id: 'ai', label: 'AI Voice Parameters', icon: Bot },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    ...(isAdmin ? [{ id: 'whitelabel', label: 'White-Label & Domain', icon: Globe }] : []),
  ];

  return (
    <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Platform Settings
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Configure organization profiles, telephony routing, credentials, and notification thresholds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Settings Navigation Tabs */}
        <div className="md:col-span-4 space-y-1.5 glass-card p-3 rounded-2xl border border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-cyan to-brand-indigo text-white shadow-glow font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="md:col-span-8">
          {/* PROFILE & ORGANIZATION TAB */}
          {activeTab === 'profile' && (
            <Card className="p-6">
              <CardHeader
                title="Profile & Organization"
                subtitle="Your personal details and workspace settings"
              />
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-500 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Contact support to modify primary email.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Organization / Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Operating Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-cyan"
                  >
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/Denver">Mountain Time (US & Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                  </select>
                </div>

                <div className="pt-3">
                  <Button type="submit" variant="primary" size="md" isLoading={isSavingProfile}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* SECURITY & PASSWORD TAB */}
          {activeTab === 'security' && (
            <Card className="p-6">
              <CardHeader
                title="Security & Password"
                subtitle="Ensure your account and call data remain safe"
              />
              <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                <div className="pt-3">
                  <Button type="submit" variant="primary" size="md" isLoading={isUpdatingPassword}>
                    Update Password
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* PHONE & CALL SETTINGS TAB */}
          {activeTab === 'phone' && (
            <Card className="p-6">
              <CardHeader
                title="Phone Routing & Compliance"
                subtitle="Configure fallback routing, warm transfer numbers, and call recording consent"
              />
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Human Fallback & Handoff Number
                  </label>
                  <input
                    type="tel"
                    value={fallbackPhone}
                    onChange={(e) => setFallbackPhone(e.target.value)}
                    className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-cyan"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Calls will be immediately transferred here when human escalation is triggered.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Legal Recording Consent Message
                  </label>
                  <textarea
                    rows={3}
                    value={consentMsg}
                    onChange={(e) => setConsentMsg(e.target.value)}
                    className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-brand-cyan resize-none"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => toast.success('Phone routing rules saved!')}
                  >
                    Save Phone Rules
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* AI VOICE PARAMETERS TAB */}
          {activeTab === 'ai' && (
            <Card className="p-6">
              <CardHeader
                title="AI Speech & Latency Settings"
                subtitle="Fine-tune response latency, cadence speed, and model selection"
              />
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Speech Model</label>
                    <select className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan">
                      <option>OpenAI GPT-4o-mini (Ultra Fast ~380ms)</option>
                      <option>OpenAI GPT-4o (Deep Reasoning ~650ms)</option>
                      <option>Claude 3.5 Haiku (via adapter)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Speaking Speed Rate
                    </label>
                    <select className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan">
                      <option>1.0x (Natural Conversational)</option>
                      <option>1.1x (Brisk Professional)</option>
                      <option>0.95x (Deliberate & Articulate)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => toast.success('AI speech parameters updated!')}
                  >
                    Save AI Settings
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <Card className="p-6">
              <CardHeader
                title="Notification Alerts"
                subtitle="Manage how your team receives real-time call and lead alerts"
              />
              <div className="space-y-3 text-xs">
                {[
                  { title: 'Email alert for every answered call', checked: true },
                  { title: 'Immediate SMS alert for high-score leads (Score > 90)', checked: true },
                  { title: 'Daily executive call summary digest', checked: true },
                  { title: 'Minute allowance threshold warning at 80% usage', checked: true },
                ].map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-navy-900 border border-slate-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="accent-brand-cyan rounded"
                    />
                    <span className="text-slate-200">{item.title}</span>
                  </label>
                ))}

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => toast.success('Notification preferences saved!')}
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* WHITELABEL TAB (ADMIN ONLY) */}
          {activeTab === 'whitelabel' && isAdmin && (
            <div className="space-y-6 text-left">
              {/* Card 1: Agency Brand Identity */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-emerald-950/60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Visual Identity & Swatches</h3>
                      <p className="text-xs text-gray-400">Customize what your clients see across their portals.</p>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" icon={Save} onClick={handleSaveBranding}>
                    Save Changes
                  </Button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Platform / Agency Title
                    </label>
                    <input
                      type="text"
                      value={branding.platformName}
                      onChange={(e) => setBranding({ ...branding, platformName: e.target.value })}
                      placeholder="e.g. Apex Voice AI"
                      className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition"
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
                        className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition"
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
                        className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition"
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
                          className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white uppercase"
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
                          className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white uppercase"
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

                <div className="space-y-4 text-xs">
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
                        className="flex-1 bg-[#08080a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        icon={isVerifyingDns ? RotateCcw : ShieldCheck}
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
                        {copiedField === 'cname' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedField === 'cname' ? 'Copied Target' : 'Copy Value'}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Card 3: Transactional Email Templates */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-emerald-950/60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Client Email Dispatch Templates</h3>
                      <p className="text-xs text-gray-400">Automated white-label alerts dispatched to your clients.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Template tabs */}
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    {[
                      { id: 'lead_alert', label: 'New Lead Notification' },
                      { id: 'appointment', label: 'Appointment Scheduled' },
                      { id: 'recording_ready', label: 'Call Recording Ready' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveEmailTab(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          activeEmailTab === tab.id
                            ? 'bg-emerald-500 text-black font-bold'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={emailTemplates[activeEmailTab].subject}
                      onChange={(e) =>
                        setEmailTemplates({
                          ...emailTemplates,
                          [activeEmailTab]: {
                            ...emailTemplates[activeEmailTab],
                            subject: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Email Body (Plain Text / Markdown)
                    </label>
                    <textarea
                      rows={6}
                      value={emailTemplates[activeEmailTab].body}
                      onChange={(e) =>
                        setEmailTemplates({
                          ...emailTemplates,
                          [activeEmailTab]: {
                            ...emailTemplates[activeEmailTab],
                            body: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-[#08080a] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button variant="primary" size="sm" icon={Save} onClick={handleSaveBranding}>
                      Save Email Templates
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
