import React, { useState, useEffect } from 'react';
import {
  Boxes,
  PhoneCall,
  Bot,
  Calendar,
  MessageSquare,
  Mail,
  CheckCircle2,
  Lock,
  ExternalLink,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const IntegrationsPage = () => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [accountSidInput, setAccountSidInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/integrations');
      if (res.data) setIntegrations(res.data);
    } catch (err) {
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfig = (item) => {
    setSelectedIntegration(item);
    setApiKeyInput('');
    setAccountSidInput('');
    setConfigModalOpen(true);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!selectedIntegration) return;

    try {
      setIsSaving(true);
      const credentials = {};
      if (apiKeyInput) credentials.apiKey = apiKeyInput;
      if (accountSidInput) credentials.accountSid = accountSidInput;

      const res = await api.post(`/integrations/${selectedIntegration.serviceKey}`, {
        credentials,
        isConnected: true,
      });

      if (res.success) {
        toast.success(`${selectedIntegration.name} connected successfully!`);
        setConfigModalOpen(false);
        fetchIntegrations();
      }
    } catch (err) {
      toast.error(err.message || 'Connection failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async (serviceKey) => {
    if (!window.confirm('Disconnect this service?')) return;
    try {
      await api.delete(`/integrations/${serviceKey}`);
      toast.info('Integration disconnected');
      fetchIntegrations();
    } catch (e) {
      toast.error('Disconnect failed');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'voice':
        return PhoneCall;
      case 'ai':
        return Bot;
      case 'calendar':
        return Calendar;
      default:
        return MessageSquare;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Integrations & Service Connectors
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Connect production telephony carriers, speech models, calendars, and notification webhooks.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero Frontend Secret Exposure • Masked Server Storage</span>
        </div>
      </div>

      {/* Categories */}
      {['voice', 'ai', 'calendar', 'communication'].map((category) => {
        const catItems = integrations.filter((i) => i.category === category);
        const Icon = getCategoryIcon(category);
        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-300">
              <Icon className="w-4 h-4 text-emerald-400" />
              <span>{category.toUpperCase()} INTEGRATIONS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catItems.map((item) => (
                <Card key={item.serviceKey} className="p-6 flex flex-col justify-between" hover>
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-base font-bold text-white">{item.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 min-h-[32px]">
                          {item.description}
                        </p>
                      </div>
                      <Badge variant={item.isConnected ? 'emerald' : 'default'} size="xs">
                        {item.isConnected ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </div>

                    {item.isConnected && item.maskedCredentials && (
                      <div className="mt-3 p-2.5 rounded-xl bg-navy-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Configured Key:</span>
                        <span className="text-brand-cyan">
                          {Object.values(item.maskedCredentials)[0] || '••••••••'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <Button
                      variant={item.isConnected ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleOpenConfig(item)}
                      className="flex-1"
                    >
                      {item.isConnected ? 'Configure' : 'Connect Service'}
                    </Button>

                    {item.isConnected && (
                      <button
                        onClick={() => handleDisconnect(item.serviceKey)}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition text-xs font-semibold"
                        title="Disconnect"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Integration Config Modal */}
      {selectedIntegration && (
        <Modal
          isOpen={configModalOpen}
          onClose={() => setConfigModalOpen(false)}
          title={`Configure ${selectedIntegration.name}`}
        >
          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs text-left">
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-slate-200">
              <span className="font-bold text-brand-cyan block mb-1">Production Credentials</span>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Enter your {selectedIntegration.name} API credentials. The system automatically masks keys and saves them securely in server environment storage.
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                API Key / Secret Token
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="e.g. sk-prod-••••••••••••"
                  className="w-full bg-navy-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>
            </div>

            {selectedIntegration.serviceKey === 'twilio' && (
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Twilio Account SID
                </label>
                <input
                  type="text"
                  value={accountSidInput}
                  onChange={(e) => setAccountSidInput(e.target.value)}
                  placeholder="AC••••••••••••••••••••"
                  className="w-full bg-navy-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-cyan"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfigModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                Save & Connect
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
