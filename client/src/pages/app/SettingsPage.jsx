import React, { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const SettingsPage = () => {
  const { user, organization, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const toast = useToast();

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

  const tabs = [
    { id: 'profile', label: 'Profile & Organization', icon: User },
    { id: 'security', label: 'Security & Password', icon: Lock },
    { id: 'phone', label: 'Phone & Call Settings', icon: Phone },
    { id: 'ai', label: 'AI Voice Parameters', icon: Bot },
    { id: 'notifications', label: 'Notifications', icon: Bell },
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
        </div>
      </div>
    </div>
  );
};
