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
  Play,
  Bot,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export const PhoneNumbersPage = () => {
  const { user, organization, isAdmin } = useAuth();
  const toast = useToast();

  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState([]);

  // Admin purchase modal
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [searchAreaCode, setSearchAreaCode] = useState('415');
  const [numberType, setNumberType] = useState('local');
  const [isSearchingNumbers, setIsSearchingNumbers] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedClientForAssign, setSelectedClientForAssign] = useState('');

  // Client simulate call state
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetchPhoneNumbers();
    if (isAdmin) {
      fetchClientsList();
    }
  }, [isAdmin]);

  const fetchPhoneNumbers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/phone-numbers');
      if (res?.data) {
        setNumbers(res.data);
      }
    } catch (err) {
      console.warn('Failed to load phone numbers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientsList = async () => {
    try {
      const res = await api.get('/admin/clients');
      if (res?.data) {
        setClients(res.data);
        if (res.data.length > 0) {
          setSelectedClientForAssign(res.data[0].id || res.data[0]._id);
        }
      }
    } catch {}
  };

  const handleSearchAvailableNumbers = () => {
    setIsSearchingNumbers(true);
    setTimeout(() => {
      setIsSearchingNumbers(false);
      const prefix = searchAreaCode || '415';
      setSearchResults([
        { number: `+1 (${prefix}) 482-${Math.floor(1000 + Math.random() * 9000)}`, locality: 'Metropolitan', monthlyFee: 1.15 },
        { number: `+1 (${prefix}) 679-${Math.floor(1000 + Math.random() * 9000)}`, locality: 'Downtown', monthlyFee: 1.15 },
        { number: `+1 (${prefix}) 821-${Math.floor(1000 + Math.random() * 9000)}`, locality: 'Business Park', monthlyFee: 1.15 },
      ]);
    }, 450);
  };

  const handlePurchaseNumber = async (selectedNum) => {
    try {
      const res = await api.post('/phone-numbers/purchase', {
        phoneNumber: selectedNum.number,
        friendlyName: `${searchAreaCode} Direct Business Line`,
        organizationId: selectedClientForAssign || organization?.id || 'org_demo_1',
        provider: 'twilio',
      });
      if (res?.success) {
        toast.success(`Successfully provisioned ${selectedNum.number}!`);
        setPurchaseModalOpen(false);
        fetchPhoneNumbers();
      }
    } catch (err) {
      toast.error('Failed to provision phone number');
    }
  };

  const handleSimulateCall = async (phoneNumber) => {
    try {
      setIsSimulating(true);
      toast.info(`Dialing ${phoneNumber} with AI Receptionist Sarah...`);
      const res = await api.post('/calls/simulate', {
        callerName: 'Test Inbound Caller',
        callerNumber: '+1 (555) 749-3921',
        intent: 'Phone line diagnostic check',
      });
      if (res?.success) {
        toast.success('Inbound test call connected and processed by AI receptionist!');
      }
    } catch (e) {
      toast.error('Simulation error: ' + (e.message || 'Failed'));
    } finally {
      setIsSimulating(false);
    }
  };

  // Filter numbers
  const filteredNumbers = numbers.filter((n) => {
    const num = (n.phoneNumber || '').toLowerCase();
    const name = (n.friendlyName || '').toLowerCase();
    const org = (n.organizationId?.name || '').toLowerCase();
    const query = search.toLowerCase();
    return !query || num.includes(query) || name.includes(query) || org.includes(query);
  });

  // Client view numbers
  const clientAssignedNumbers = numbers.filter((n) => {
    if (isAdmin) return true;
    const orgId = organization?._id || organization?.id;
    const nOrgId = n.organizationId?._id || n.organizationId?.id || n.organizationId;
    return !orgId || String(nOrgId) === String(orgId) || nOrgId === 'org_demo_1';
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                isAdmin
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                  : 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
              }`}
            >
              {isAdmin ? 'Agency Telephony Trunk' : 'Inbound Voice Lines'}
            </span>
            <Badge variant="emerald" size="xs">
              Carrier 100% Operational
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Phone Numbers &amp; Telephony
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {isAdmin
              ? 'Manage master carrier trunks, provision dedicated phone numbers, and inspect global voice pool allocations.'
              : 'Inspect your active inbound business phone numbers, assigned AI receptionists, and call forwarding settings.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={fetchPhoneNumbers}>
            Refresh
          </Button>
          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-md shadow-amber-500/20"
              onClick={() => {
                setSearchResults([]);
                setPurchaseModalOpen(true);
              }}
            >
              Purchase Number
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <span className="text-[11px] text-gray-400 block font-medium">Active Inbound Lines</span>
          <span className="text-2xl font-extrabold text-white mt-1 block font-mono">
            {isAdmin ? numbers.length : clientAssignedNumbers.length}
          </span>
          <span className="text-[10px] text-emerald-400 mt-0.5 block flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live &amp; Provisioned
          </span>
        </Card>

        <Card className="p-3.5 border border-emerald-500/20 bg-gradient-to-br from-[#0c0c0e] to-[#101b14]">
          <span className="text-[11px] text-gray-400 block font-medium">Carrier Response Latency</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block font-mono">
            28 ms
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">SIP trunk nominal</span>
        </Card>

        <Card className="p-3.5 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <span className="text-[11px] text-gray-400 block font-medium">Supported Capabilities</span>
          <span className="text-xl font-extrabold text-cyan-400 mt-1 block font-mono">
            Voice + SMS
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">24/7 AI Receptionist</span>
        </Card>

        <Card className="p-3.5 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <span className="text-[11px] text-gray-400 block font-medium">Master Carrier Gateway</span>
          <span className="text-xl font-extrabold text-indigo-400 mt-1 block font-mono">
            Twilio / Vapi
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">Auto-failover enabled</span>
        </Card>
      </div>

      {/* Main Content Area */}
      {!isAdmin ? (
        /* CLIENT WORKSPACE PHONE NUMBER VIEW */
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader
              title="Your Dedicated Inbound Business Phone Lines"
              subtitle="All inbound calls to these numbers are instantly handled and resolved by your AI Receptionist"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {clientAssignedNumbers.map((num) => (
                <div
                  key={num._id}
                  className="p-5 rounded-2xl bg-gradient-to-br from-[#0c0c0e] to-[#121614] border border-emerald-500/30 flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-lg font-mono font-extrabold text-white">
                          {num.phoneNumber}
                        </h3>
                      </div>
                      <span className="text-xs text-gray-400 mt-1 block">
                        {num.friendlyName || 'Primary Voice Line'}
                      </span>
                    </div>
                    <Badge variant="emerald" size="xs">
                      {num.status?.toUpperCase() || 'ONLINE'}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs py-3 border-y border-slate-800 text-gray-300">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Assigned AI Agent:</span>
                      <span className="font-semibold text-emerald-400">
                        {num.agentId?.name || 'Sarah (AI Receptionist)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Human Escalation Forwarding:</span>
                      <span className="font-mono text-gray-300">
                        {num.forwardToNumber || organization?.settings?.fallbackPhoneNumber || '+1 (555) 789-0123'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Calls Processed This Month:</span>
                      <span className="font-mono text-white font-bold">{num.callsThisMonth || 24}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-[11px] text-gray-500">Carrier: {num.provider?.toUpperCase() || 'TWILIO'}</span>
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Play}
                      loading={isSimulating}
                      onClick={() => handleSimulateCall(num.phoneNumber)}
                    >
                      Test Dial Line
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        /* ADMIN GLOBAL PHONE POOL & TELEPHONY VIEW */
        <div className="space-y-6">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter phone pool by number, label, or assigned workspace..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#121215] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <span className="text-xs text-gray-400">
                {filteredNumbers.length} pool numbers registered
              </span>
            </div>
          </Card>

          <Card className="overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c0c0e] text-gray-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Phone Number &amp; Label</th>
                    <th className="py-3 px-4">Carrier &amp; Type</th>
                    <th className="py-3 px-4">Assigned Client Workspace</th>
                    <th className="py-3 px-4">Assigned Agent</th>
                    <th className="py-3 px-4">Forwarding Route</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredNumbers.map((num) => (
                    <tr key={num._id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white font-mono text-sm">{num.phoneNumber}</div>
                        <span className="text-[10px] text-gray-500">{num.friendlyName || 'Inbound Line'}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="uppercase font-semibold text-gray-300">{num.provider || 'twilio'}</span>
                        <span className="text-[10px] text-gray-500 block">US Local · $1.15/mo</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-semibold text-white">
                            {num.organizationId?.name || 'Vedanco Demo'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-emerald-400 font-medium">
                          {num.agentId?.name || 'Sarah'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px]">
                        {num.forwardToNumber || '+1 (555) 789-0123'}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant="emerald" size="xs">
                          {num.status || 'Active'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleSimulateCall(num.phoneNumber)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold transition"
                        >
                          Test Dial
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: PURCHASE / PROVISION NUMBER */}
      <Modal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        title="Purchase &amp; Provision Phone Number"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-400">
            Search carrier inventory by area code and instantly assign to a client workspace.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">US Area Code</label>
              <input
                type="text"
                maxLength={3}
                value={searchAreaCode}
                onChange={(e) => setSearchAreaCode(e.target.value)}
                placeholder="415"
                className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Assign to Client</label>
              <select
                value={selectedClientForAssign}
                onChange={(e) => setSelectedClientForAssign(e.target.value)}
                className="w-full bg-[#121215] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {clients.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            loading={isSearchingNumbers}
            onClick={handleSearchAvailableNumbers}
            className="w-full"
          >
            Search Carrier Inventory
          </Button>

          {searchResults.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-white block">Available Numbers:</span>
              {searchResults.map((res, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/[0.02] border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-white">{res.number}</span>
                    <span className="text-[10px] text-gray-500 block">
                      {res.locality} · ${res.monthlyFee}/month
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => handlePurchaseNumber(res)}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
                  >
                    Provision
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
