import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  PhoneCall,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Building,
  Key,
  ShieldCheck,
  Globe,
  Radio,
  ExternalLink,
  ChevronDown,
  Activity,
  Layers,
  Sparkles,
  PhoneForwarded,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const AdminTelephonyPage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [searchAreaCode, setSearchAreaCode] = useState('415');
  const [numberType, setNumberType] = useState('local');
  const [isSearchingNumbers, setIsSearchingNumbers] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [clients, setClients] = useState([]);

  // Telephony Master State
  const [telephonyConfig, setTelephonyConfig] = useState({
    accountSid: 'AC8f7b329482701ab49921c54e',
    authToken: '••••••••••••••••••••••••••••••••',
    masterNumber: '+1 (855) 833-2626',
    balance: 348.5,
    autoRechargeThreshold: 50.0,
    autoRechargeAmount: 100.0,
    activeConcurrentChannels: 14,
    maxChannels: 100,
    sipLatencyMs: 32,
    webhookUrl: 'https://api.vedanco.ai/api/vapi/webhook',
  });

  // Global Phone Pool Inventory
  const [phonePool, setPhonePool] = useState([
    {
      id: 'num-1',
      number: '+1 (415) 800-4123',
      formatted: '+1 (415) 800-4123',
      type: 'Local',
      region: 'San Francisco, CA',
      monthlyFee: 1.15,
      carrier: 'Twilio Master',
      assignedTo: { id: 'cust-1', name: 'Vedanco Demo' },
      status: 'active',
      capabilities: ['Voice', 'SMS'],
      callsThisMonth: 142,
    },
    {
      id: 'num-2',
      number: '+1 (212) 555-0199',
      formatted: '+1 (212) 555-0199',
      type: 'Local',
      region: 'New York, NY',
      monthlyFee: 1.15,
      carrier: 'Twilio Master',
      assignedTo: { id: 'cust-2', name: 'Premier Realty Advisors' },
      status: 'active',
      capabilities: ['Voice', 'SMS'],
      callsThisMonth: 480,
    },
    {
      id: 'num-3',
      number: '+1 (312) 429-8811',
      formatted: '+1 (312) 429-8811',
      type: 'Local',
      region: 'Chicago, IL',
      monthlyFee: 1.15,
      carrier: 'Twilio Master',
      assignedTo: { id: 'cust-3', name: 'Sterling Health Clinics' },
      status: 'active',
      capabilities: ['Voice', 'SMS'],
      callsThisMonth: 890,
    },
    {
      id: 'num-4',
      number: '+1 (800) 419-7700',
      formatted: '+1 (800) 419-7700',
      type: 'Toll-Free',
      region: 'United States',
      monthlyFee: 2.15,
      carrier: 'Twilio Master',
      assignedTo: { id: 'cust-4', name: 'Apex Hotel & Suites' },
      status: 'active',
      capabilities: ['Voice', 'SMS'],
      callsThisMonth: 310,
    },
    {
      id: 'num-5',
      number: '+1 (512) 990-3344',
      formatted: '+1 (512) 990-3344',
      type: 'Local',
      region: 'Austin, TX',
      monthlyFee: 1.15,
      carrier: 'Twilio Master',
      assignedTo: null,
      status: 'available',
      capabilities: ['Voice', 'SMS'],
      callsThisMonth: 0,
    },
  ]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/admin/clients');
      if (res?.data) {
        setClients(res.data);
      }
    } catch {}
  };

  const handleSearchAvailableNumbers = () => {
    setIsSearchingNumbers(true);
    setTimeout(() => {
      setSearchResults([
        { number: `+1 (${searchAreaCode}) 349-${Math.floor(1000 + Math.random() * 9000)}`, region: 'Local Metro Area', fee: '$1.15/mo' },
        { number: `+1 (${searchAreaCode}) 482-${Math.floor(1000 + Math.random() * 9000)}`, region: 'Local Metro Area', fee: '$1.15/mo' },
        { number: `+1 (${searchAreaCode}) 691-${Math.floor(1000 + Math.random() * 9000)}`, region: 'Local Metro Area', fee: '$1.15/mo' },
        { number: `+1 (${searchAreaCode}) 815-${Math.floor(1000 + Math.random() * 9000)}`, region: 'Local Metro Area', fee: '$1.15/mo' },
      ]);
      setIsSearchingNumbers(false);
    }, 600);
  };

  const handlePurchaseNumber = (numItem) => {
    const newEntry = {
      id: `num-${Date.now()}`,
      number: numItem.number,
      formatted: numItem.number,
      type: numberType === 'local' ? 'Local' : 'Toll-Free',
      region: numItem.region,
      monthlyFee: 1.15,
      carrier: 'Twilio Master',
      assignedTo: null,
      status: 'available',
      capabilities: ['Voice', 'SMS'],
      callsThisMonth: 0,
    };
    setPhonePool((prev) => [newEntry, ...prev]);
    toast.success(`Successfully provisioned ${numItem.number} into Agency Pool!`);
    setPurchaseModalOpen(false);
  };

  const handleAssignNumber = (numberId, orgId) => {
    setPhonePool((prev) =>
      prev.map((item) => {
        if (item.id === numberId) {
          if (!orgId) {
            return { ...item, assignedTo: null, status: 'available' };
          }
          const matchedClient = clients.find((c) => (c.id || c._id) === orgId);
          return {
            ...item,
            assignedTo: { id: orgId, name: matchedClient?.name || 'Assigned Client' },
            status: 'active',
          };
        }
        return item;
      })
    );
    toast.success('Phone routing assignment saved');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-500/30">
              Telephony Control Plane
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Carrier &amp; Global Voice Pool</h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage agency master Twilio SIP trunks, acquire DID phone numbers, and assign dedicated lines to client sub-accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setPurchaseModalOpen(true);
              handleSearchAvailableNumbers();
            }}
            className="shadow-glow"
          >
            Purchase Number
          </Button>
        </div>
      </div>

      {/* Telemetry & Balance Monitoring Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418] border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Twilio Balance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-400 font-mono">
            ${telephonyConfig.balance.toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Auto-refill active at ${telephonyConfig.autoRechargeThreshold}
          </span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Active Voice Channels</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">
            {telephonyConfig.activeConcurrentChannels}{' '}
            <span className="text-xs text-gray-500 font-normal">/ {telephonyConfig.maxChannels} max</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">Concurrent SIP capacity</span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">SIP Trunk Latency</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-cyan-400 font-mono">
            {telephonyConfig.sipLatencyMs} ms
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">Tier-1 Direct Carrier Routing</span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Total Provisioned DIDs</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">{phonePool.length}</div>
          <span className="text-[10px] text-purple-400 mt-1 block">
            {phonePool.filter((p) => p.assignedTo).length} assigned • {phonePool.filter((p) => !p.assignedTo).length} unallocated
          </span>
        </Card>
      </div>

      {/* Master Telephony Credentials & Webhook Gateway */}
      <Card className="p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Master Carrier Configuration</h3>
          </div>
          <Badge variant="emerald" size="xs">
            Trunk Operational
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-[#08080a] border border-slate-850">
            <span className="text-gray-400 font-medium block mb-1">Twilio Account SID</span>
            <span className="font-mono text-white text-xs block truncate">{telephonyConfig.accountSid}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#08080a] border border-slate-850">
            <span className="text-gray-400 font-medium block mb-1">Master Outbound DID</span>
            <span className="font-mono text-emerald-400 font-bold text-xs block">{telephonyConfig.masterNumber}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#08080a] border border-slate-850">
            <span className="text-gray-400 font-medium block mb-1">Inbound Webhook Endpoint</span>
            <span className="font-mono text-cyan-400 text-xs block truncate">{telephonyConfig.webhookUrl}</span>
          </div>
        </div>
      </Card>

      {/* Global Phone Inventory & Sub-Account Assignment Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#08080a]">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-400" /> Agency Voice Pool Inventory
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Assign purchased phone numbers to client organizations. Calls route straight to their Sarah AI agent.
            </p>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            Monthly Pool Cost: ${phonePool.reduce((sum, p) => sum + p.monthlyFee, 0).toFixed(2)}/mo
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c0c0e] border-b border-slate-800 text-gray-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Type / Region</th>
                <th className="py-3 px-4">Carrier</th>
                <th className="py-3 px-4">Monthly Fee</th>
                <th className="py-3 px-4">Assigned Client Sub-Account</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {phonePool.map((item) => (
                <tr key={item.id} className="hover:bg-[#101014] transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>{item.formatted}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-gray-300">
                    <span className="font-medium text-white block">{item.type}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{item.region}</span>
                  </td>

                  <td className="py-3.5 px-4 text-gray-300 font-mono text-[11px]">
                    {item.carrier}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-amber-400">
                    ${item.monthlyFee.toFixed(2)}/mo
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={item.assignedTo?.id || ''}
                      onChange={(e) => handleAssignNumber(item.id, e.target.value)}
                      className="bg-[#08080a] border border-slate-750 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-400 font-medium"
                    >
                      <option value="">-- Unassigned (Hold in Pool) --</option>
                      {clients.length > 0 ? (
                        clients.map((c) => (
                          <option key={c.id || c._id} value={c.id || c._id}>
                            {c.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="cust-1">Vedanco Demo</option>
                          <option value="cust-2">Premier Realty Advisors</option>
                          <option value="cust-3">Sterling Health Clinics</option>
                          <option value="cust-4">Apex Hotel & Suites</option>
                        </>
                      )}
                    </select>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={item.assignedTo ? 'emerald' : 'cyan'} size="xs">
                      {item.assignedTo ? 'Routed to Agent' : 'Pool Standby'}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {item.assignedTo ? (
                      <button
                        onClick={() => handleAssignNumber(item.id, '')}
                        className="text-[11px] text-gray-400 hover:text-rose-400 transition"
                      >
                        Unassign
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-mono">Ready to Route</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Number Purchasing Search Modal */}
      <Modal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        title="Acquire New Carrier Phone Number"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-left text-xs">
          <p className="text-gray-400">
            Search real-time Twilio DID inventory to procure new local or toll-free numbers directly for your agency voice pool.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Number Type</label>
              <select
                value={numberType}
                onChange={(e) => setNumberType(e.target.value)}
                className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="local">Local DID</option>
                <option value="tollfree">Toll-Free (+1 800)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Area Code</label>
              <input
                type="text"
                value={searchAreaCode}
                onChange={(e) => setSearchAreaCode(e.target.value)}
                placeholder="415"
                maxLength={3}
                className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSearchAvailableNumbers}
            isLoading={isSearchingNumbers}
            className="w-full"
          >
            Search Available Numbers
          </Button>

          <div className="pt-2">
            <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] block mb-2">
              Available Numbers ({searchResults.length})
            </span>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {searchResults.map((resItem, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#08080a] border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-white text-xs block">{resItem.number}</span>
                    <span className="text-[10px] text-gray-500">{resItem.region}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-amber-400">{resItem.fee}</span>
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => handlePurchaseNumber(resItem)}
                    >
                      Buy &amp; Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
