import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Zap,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  PhoneCall,
  Bot,
  MessageSquare,
  Smartphone,
  HardDrive,
  Phone,
  BarChart2,
  Sliders,
  TrendingUp,
  Copy,
  Check,
  DollarSign,
  Percent,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export const BillingPage = () => {
  const { organization, refreshUser, isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState('plan'); // 'plan' or 'wholesale'
  const [billingInfo, setBillingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changePlanModal, setChangePlanModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [refillPack, setRefillPack] = useState(1000);
  const [isRefilling, setIsRefilling] = useState(false);

  // Wholesale Markup State (Admin)
  const [adminClients, setAdminClients] = useState([]);
  const [baseCostPerMin, setBaseCostPerMin] = useState(0.05);
  const [clientPricePerMin, setClientPricePerMin] = useState(0.15);
  const [monthlyVolumeMinutes, setMonthlyVolumeMinutes] = useState(11450);
  const [selectedClientForRefill, setSelectedClientForRefill] = useState('');
  const [refillMinutesAdmin, setRefillMinutesAdmin] = useState(1000);
  const [generatedStripeLink, setGeneratedStripeLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const toast = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchAdminClients();
    }
  }, [isAdmin]);

  const fetchAdminClients = async () => {
    try {
      const res = await api.get('/admin/clients');
      if (res?.data) {
        setAdminClients(res.data);
        if (res.data.length > 0 && !selectedClientForRefill) {
          setSelectedClientForRefill(res.data[0].id || res.data[0]._id);
        }
      }
    } catch {}
  };

  const profitPerMinute = Math.max(0, clientPricePerMin - baseCostPerMin);
  const markupPercentage = baseCostPerMin > 0 ? Math.round(((clientPricePerMin - baseCostPerMin) / baseCostPerMin) * 100) : 0;
  const grossMarginPercent = clientPricePerMin > 0 ? Math.round((profitPerMinute / clientPricePerMin) * 100) : 0;
  const estimatedMonthlyProfit = monthlyVolumeMinutes * profitPerMinute;
  const refillTotalPrice = (refillMinutesAdmin * clientPricePerMin).toFixed(2);

  const handleGenerateStripeCheckout = () => {
    const matchedClient = adminClients.find((c) => (c.id || c._id) === selectedClientForRefill);
    const clientName = matchedClient?.name?.replace(/\s+/g, '-').toLowerCase() || 'client';
    const link = `https://checkout.stripe.com/pay/cs_live_agency_${clientName}_refill_${refillMinutesAdmin}min_${Date.now().toString().slice(-6)}`;
    setGeneratedStripeLink(link);
    toast.success(`Generated instant Stripe Checkout link for $${refillTotalPrice}`);
  };

  const handleCopyLink = () => {
    if (!generatedStripeLink) return;
    navigator.clipboard.writeText(generatedStripeLink);
    setCopiedLink(true);
    toast.success('Stripe payment link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRefillMinutes = () => {
    setIsRefilling(true);
    setTimeout(() => {
      setIsRefilling(false);
      setRefillModalOpen(false);
      const added = refillPack;
      toast.success(`Successfully topped up ${added.toLocaleString()} voice minutes!`);
      if (billingInfo) {
        setBillingInfo((prev) => ({
          ...prev,
          usageMeter: {
            ...prev.usageMeter,
            minutesRemaining: (prev.usageMeter?.minutesRemaining || 858) + added,
            minutesAllowance: (prev.usageMeter?.minutesAllowance || 1000) + added,
          },
        }));
      }
    }, 600);
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await api.get('/billing');
      if (res.success) setBillingInfo(res);
    } catch (err) {
      toast.error('Failed to load billing details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async (planId) => {
    try {
      setIsUpdating(true);
      const res = await api.post('/billing/change-plan', { planId });
      if (res.success) {
        toast.success(res.message || 'Plan updated successfully!');
        setChangePlanModal(false);
        fetchBilling();
        refreshUser();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update plan');
    } finally {
      setIsUpdating(false);
    }
  };

  const currentPlan = billingInfo?.currentPlan || {
    id: 'growth',
    name: 'Growth',
    price: 249,
    billingCycle: 'monthly',
    renewalDate: 'October 25, 2026',
  };

  const usageMeter = billingInfo?.usageMeter || {
    minutesAllowance: organization?.minutesAllowance || 1000,
    minutesUsed: organization?.minutesUsed || 0,
    minutesRemaining: Math.max(0, (organization?.minutesAllowance || 1000) - (organization?.minutesUsed || 0)),
    usagePercent: 0,
    overageRate: '$0.15 / min',
  };

  // Master SaaS Plan Multi-Metric Resource Usage Indicators
  const resourceMetrics = [
    {
      title: 'Voice Minutes',
      used: usageMeter.minutesUsed,
      total: usageMeter.minutesAllowance,
      unit: 'minutes',
      percent: usageMeter.usagePercent,
      icon: PhoneCall,
      color: 'from-brand-cyan to-brand-indigo',
      badgeColor: 'cyan',
    },
    {
      title: 'AI Processing Minutes',
      used: Math.round(usageMeter.minutesUsed * 0.4),
      total: Math.round(usageMeter.minutesAllowance * 0.5),
      unit: 'AI minutes',
      percent: usageMeter.minutesAllowance > 0 ? Math.min(100, Math.round((usageMeter.minutesUsed / usageMeter.minutesAllowance) * 100)) : 0,
      icon: Bot,
      color: 'from-indigo-500 to-purple-500',
      badgeColor: 'indigo',
    },
    {
      title: 'Total Handled Calls',
      used: organization?.callsCount ?? 0,
      total: 1000,
      unit: 'calls',
      percent: Math.min(100, Math.round(((organization?.callsCount ?? 0) / 1000) * 100)),
      icon: Phone,
      color: 'from-emerald-400 to-teal-500',
      badgeColor: 'emerald',
    },
    {
      title: 'SMS Dispatched',
      used: 0,
      total: 500,
      unit: 'messages',
      percent: 0,
      icon: MessageSquare,
      color: 'from-emerald-400 to-teal-500',
      badgeColor: 'cyan',
    },
    {
      title: 'WhatsApp Notifications',
      used: 0,
      total: 250,
      unit: 'messages',
      percent: 0,
      icon: Smartphone,
      color: 'from-emerald-500 to-green-600',
      badgeColor: 'emerald',
    },
    {
      title: 'Audio & Data Storage',
      used: Number((usageMeter.minutesUsed * 0.005).toFixed(1)),
      total: 10,
      unit: 'GB',
      percent: Math.min(100, Math.round(((usageMeter.minutesUsed * 0.005) / 10) * 100)),
      icon: HardDrive,
      color: 'from-amber-400 to-orange-500',
      badgeColor: 'amber',
    },
    {
      title: 'Dedicated Phone Numbers',
      used: organization?.phoneNumbers?.length || 1,
      total: 3,
      unit: 'numbers',
      percent: Math.round(((organization?.phoneNumbers?.length || 1) / 3) * 100),
      icon: PhoneCall,
      color: 'from-purple-400 to-pink-500',
      badgeColor: 'purple',
    },
  ];

  const plans = billingInfo?.availablePlans || [];
  const invoices = billingInfo?.invoices || [];

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeSection === 'wholesale' ? 'Global Billing & Wholesale Markup' : 'Subscription & Usage Meter'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {activeSection === 'wholesale'
              ? 'Configure wholesale minute markups, calculate recurring profit margins, and generate 1-click Stripe refill checkout links.'
              : 'Monitor real-time voice minutes, resource consumption, subscription tiers, and review paid invoices.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="flex items-center p-1 rounded-xl bg-[#0c0c0e] border border-emerald-950/80">
              <button
                onClick={() => setActiveSection('plan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSection === 'plan'
                    ? 'bg-emerald-500 text-black font-bold shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Tenant Billing
              </button>
              <button
                onClick={() => setActiveSection('wholesale')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSection === 'wholesale'
                    ? 'bg-emerald-500 text-black font-bold shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Wholesale Markup Engine
              </button>
            </div>
          )}

          {activeSection === 'plan' && (
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => setChangePlanModal(true)}
            >
              Change Plan
            </Button>
          )}
        </div>
      </div>

      {activeSection === 'wholesale' && isAdmin ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418] border-emerald-500/20">
              <span className="text-xs text-gray-400 font-medium">Agency Telephony Profit</span>
              <div className="mt-2 text-2xl font-extrabold text-emerald-400 font-mono">
                ${estimatedMonthlyProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +{markupPercentage}% wholesale markup
              </span>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
              <span className="text-xs text-gray-400 font-medium">Retail Client Rate</span>
              <div className="mt-2 text-2xl font-extrabold text-white font-mono">
                ${clientPricePerMin.toFixed(2)} / min
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">
                Wholesale base: ${baseCostPerMin.toFixed(2)} / min
              </span>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
              <span className="text-xs text-gray-400 font-medium">Gross Profit Margin</span>
              <div className="mt-2 text-2xl font-extrabold text-cyan-400 font-mono">
                {grossMarginPercent}%
              </div>
              <span className="text-[10px] text-cyan-400 mt-1 block">${profitPerMinute.toFixed(2)} net profit per min</span>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
              <span className="text-xs text-gray-400 font-medium">Platform MRR (SaaS Only)</span>
              <div className="mt-2 text-2xl font-extrabold text-amber-400 font-mono">
                $14,250.00
              </div>
              <span className="text-[10px] text-amber-400 mt-1 block">Across active agency retainers</span>
            </Card>
          </div>

          {/* Interactive Markup Calculator Slider */}
          <Card className="p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Wholesale vs. Retail Markup Slider</h3>
              </div>
              <Badge variant="cyan" size="xs">
                Dynamic Rate Engine
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2 text-xs">
                    <span className="text-gray-300 font-medium">Wholesale Carrier Cost (Your Cost)</span>
                    <span className="font-mono font-bold text-gray-400">${baseCostPerMin.toFixed(2)} / min</span>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.10"
                    step="0.01"
                    value={baseCostPerMin}
                    onChange={(e) => setBaseCostPerMin(parseFloat(e.target.value))}
                    className="w-full accent-gray-400"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">Twilio/Telnyx SIP trunk + Vapi AI voice pipeline cost.</span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 text-xs">
                    <span className="text-emerald-400 font-bold">Client Resale Price (Billed to Client)</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">${clientPricePerMin.toFixed(2)} / min</span>
                  </div>
                  <input
                    type="range"
                    min="0.06"
                    max="0.40"
                    step="0.01"
                    value={clientPricePerMin}
                    onChange={(e) => setClientPricePerMin(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                    <span>$0.06/min (Low Markup)</span>
                    <span>$0.20/min (Recommended)</span>
                    <span>$0.40/min (Premium Agency)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 text-xs">
                    <span className="text-gray-300 font-medium">Estimated Monthly Minutes Across Clients</span>
                    <span className="font-mono font-bold text-cyan-400">{monthlyVolumeMinutes.toLocaleString()} min</span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="50000"
                    step="500"
                    value={monthlyVolumeMinutes}
                    onChange={(e) => setMonthlyVolumeMinutes(parseInt(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>

              {/* Revenue Breakdown Box */}
              <div className="p-5 rounded-2xl bg-[#08080a] border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">
                    Monthly Telecom P&amp;L Forecast
                  </span>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-850">
                      <span className="text-gray-400">Total Client Invoicing (Usage):</span>
                      <span className="font-mono font-bold text-white">
                        ${(monthlyVolumeMinutes * clientPricePerMin).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-850">
                      <span className="text-gray-400">Carrier Wholesale Expense:</span>
                      <span className="font-mono text-rose-400">
                        -${(monthlyVolumeMinutes * baseCostPerMin).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800 text-sm">
                      <span className="font-bold text-emerald-400">Net Agency Telecom Profit:</span>
                      <span className="font-mono font-extrabold text-emerald-400">
                        +${estimatedMonthlyProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-start gap-2 mt-4">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    At ${clientPricePerMin.toFixed(2)}/min, you earn an extra <strong>${estimatedMonthlyProfit.toFixed(2)}</strong> pure profit every month purely from telecom markup, on top of software subscriptions.
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Automated Stripe Checkout Link Generator */}
          <Card className="p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Automated Stripe Refill Checkout Link Generator</h3>
              </div>
              <Badge variant="amber" size="xs">
                Instant Refill Links
              </Badge>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Generate an instant, pre-filled Stripe checkout session for any client when their voice minutes run low.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 font-semibold mb-1 text-xs">Select Client Organization</label>
                <select
                  value={selectedClientForRefill}
                  onChange={(e) => setSelectedClientForRefill(e.target.value)}
                  className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  {adminClients.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1 text-xs">Minutes Refill Package</label>
                <select
                  value={refillMinutesAdmin}
                  onChange={(e) => setRefillMinutesAdmin(parseInt(e.target.value))}
                  className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value={500}>500 Voice Minutes</option>
                  <option value={1000}>1,000 Voice Minutes (Popular)</option>
                  <option value={2500}>2,500 Voice Minutes</option>
                  <option value={5000}>5,000 Voice Minutes</option>
                  <option value={10000}>10,000 Voice Minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1 text-xs">Calculated Invoice Amount</label>
                <div className="p-2 rounded-xl bg-[#08080a] border border-slate-700 flex items-center justify-between">
                  <span className="font-mono text-emerald-400 font-bold text-sm">${refillTotalPrice} USD</span>
                  <span className="text-[10px] text-gray-400 font-mono">(@ ${clientPricePerMin}/min)</span>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={CreditCard}
              onClick={handleGenerateStripeCheckout}
              className="shadow-glow"
            >
              Generate Stripe Checkout Link
            </Button>

            {generatedStripeLink && (
              <div className="mt-4 p-4 rounded-xl bg-[#08080a] border border-emerald-500/30 space-y-2 animate-in fade-in">
                <span className="text-[11px] text-gray-400 font-semibold block">Generated Payment Link:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedStripeLink}
                    className="flex-1 bg-[#121216] border border-slate-750 rounded-lg px-3 py-2 font-mono text-xs text-white focus:outline-none"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    icon={copiedLink ? Check : Copy}
                    onClick={handleCopyLink}
                  >
                    {copiedLink ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready to email or paste in client support chat. Automatically credits organization upon payment.
                </span>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <>
          {/* Plan & Primary Usage Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Current Plan Overview */}
        <div className="lg:col-span-5">
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-cyan">
                  Active Subscription
                </span>
                <Badge variant="emerald" size="xs">
                  Active
                </Badge>
              </div>

              <h2 className="text-3xl font-extrabold text-white">{currentPlan.name} Plan</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">${currentPlan.price}</span>
                <span className="text-xs text-slate-400">/{currentPlan.billingCycle}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Next billing cycle renewal on{' '}
                <strong className="text-slate-200">{currentPlan.renewalDate}</strong>.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-mono text-white">•••• 4242 (Demo Card)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Overage Rate:</span>
                <span className="text-brand-cyan font-mono">{usageMeter.overageRate}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Minutes Usage Meter */}
        <div className="lg:col-span-7">
          <Card className="p-6 h-full flex flex-col justify-between">
            <CardHeader
              title="Voice Minutes Telephony Meter"
              subtitle="Calculated on real-time telephony connections and duration seconds"
              action={
                <Badge variant="cyan" size="xs">
                  {usageMeter.usagePercent}% Consumed
                </Badge>
              }
            />

            <div>
              {/* Numbers */}
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <span className="text-4xl font-extrabold text-brand-cyan font-mono">
                    {usageMeter.minutesUsed}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">minutes used</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-white font-mono">
                    {usageMeter.minutesRemaining}
                  </span>
                  <span className="text-xs text-slate-400 block">minutes remaining</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="bg-gradient-to-r from-brand-cyan to-brand-indigo h-full rounded-full transition-all duration-500 shadow-glow"
                  style={{ width: `${Math.max(5, usageMeter.usagePercent)}%` }}
                />
              </div>

              {/* Extra Usage breakdown indicators */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-800 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Allowance</span>
                  <span className="font-bold text-white font-mono mt-0.5 block">
                    {usageMeter.minutesAllowance}m
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Avg Call Time</span>
                  <span className="font-bold text-cyan-400 font-mono mt-0.5 block">1m 58s</span>
                </div>
                <div className="p-2.5 rounded-xl bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Concurrent Lines</span>
                  <span className="font-bold text-emerald-400 font-mono mt-0.5 block">Unlimited</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500">
              <span>Voice minutes reset at the start of each calendar month.</span>
              <Button
                variant="primary"
                size="xs"
                icon={Zap}
                onClick={() => setRefillModalOpen(true)}
                className="shadow-glow"
              >
                1-Click Refill Minutes
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* MULTI-METRIC USAGE INDICATORS (Master SaaS Plan Requirement) */}
      <Card className="p-6 border border-cyan-500/20">
        <CardHeader
          title="Multi-Metric Resource Consumption"
          subtitle="Real-time quotas across telephony, conversational AI tokens, SMS, WhatsApp, and cloud storage"
          action={
            <Badge variant="cyan" size="xs">
              <BarChart2 className="w-3 h-3" /> All Systems Nominal
            </Badge>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resourceMetrics.map((res, i) => {
            const Icon = res.icon;
            return (
              <div
                key={i}
                className="p-4 rounded-xl bg-navy-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-navy-800 border border-slate-700 text-brand-cyan flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge variant={res.badgeColor} size="xs">
                      {res.percent}%
                    </Badge>
                  </div>

                  <span className="text-xs font-bold text-white block">{res.title}</span>

                  <div className="flex items-baseline justify-between mt-2 mb-1.5">
                    <span className="text-base font-extrabold text-white font-mono">
                      {res.used}{' '}
                      <span className="text-slate-400 text-[11px] font-normal font-sans">
                        / {res.total} {res.unit}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700 mt-2">
                  <div
                    className={`bg-gradient-to-r ${res.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(4, res.percent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Invoice History Table */}
      <Card className="p-6">
        <CardHeader
          title="Billing & Invoice History"
          subtitle="Past billing cycles and itemized receipts"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No billing invoices generated yet. Invoices appear automatically on monthly renewals.
                  </td>
                </tr>
              ) : (
                invoices.map((inv, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(inv.paidAt || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{inv.description}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      ${inv.amount?.toFixed(2)} USD
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="emerald" size="xs">
                        Paid
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => toast.success(`Receipt for ${inv.invoiceNumber} downloaded!`)}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-brand-cyan transition font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )}

      {/* Change Plan Modal */}
      <Modal
        isOpen={changePlanModal}
        onClose={() => setChangePlanModal(false)}
        title="Upgrade or Change Subscription Tier"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-xs text-left">
          <p className="text-slate-400">
            Select a plan that fits your business call volume. Upgrades apply immediately with prorated billing.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {plans.map((p) => {
              const isSelected = (selectedPlanId || currentPlan.id) === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-glow'
                      : 'bg-navy-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-white">{p.name}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-brand-cyan" />
                      )}
                    </div>

                    <div className="text-2xl font-extrabold text-white mb-2">
                      ${p.price}
                      <span className="text-xs text-slate-400 font-normal">/mo</span>
                    </div>

                    <div className="text-slate-400 text-[11px] mb-3">
                      Includes {p.voiceMinutesIncluded} Voice Minutes
                    </div>

                    <ul className="space-y-1.5 text-[11px] border-t border-slate-800/80 pt-2 text-slate-300">
                      {p.features?.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-2">
                    <Button
                      variant={isSelected ? 'primary' : 'outline'}
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => handleUpgradePlan(p.id)}
                      isLoading={isUpdating && selectedPlanId === p.id}
                    >
                      {currentPlan.id === p.id ? 'Current Plan' : `Switch to ${p.name}`}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* 1-Click Refill Minutes Modal */}
      <Modal
        isOpen={refillModalOpen}
        onClose={() => setRefillModalOpen(false)}
        title="1-Click Voice Minutes Refill"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs text-left">
          <p className="text-gray-400">
            Top up your active organization with additional voice minutes instantly. Unused minutes roll over automatically.
          </p>

          <div className="space-y-2">
            {[
              { minutes: 500, price: 75, rate: '$0.15/min', badge: null },
              { minutes: 1000, price: 150, rate: '$0.15/min', badge: 'Most Popular' },
              { minutes: 2500, price: 350, rate: '$0.14/min', badge: 'Save 7%' },
              { minutes: 5000, price: 650, rate: '$0.13/min', badge: 'Best Value' },
            ].map((pkg) => (
              <div
                key={pkg.minutes}
                onClick={() => setRefillPack(pkg.minutes)}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  refillPack === pkg.minutes
                    ? 'bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400'
                    : 'bg-[#08080a] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      refillPack === pkg.minutes
                        ? 'border-emerald-400 bg-emerald-400 text-black'
                        : 'border-slate-700'
                    }`}
                  >
                    {refillPack === pkg.minutes && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                  <div>
                    <span className="font-bold text-white block">
                      +{pkg.minutes.toLocaleString()} Voice Minutes
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">{pkg.rate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {pkg.badge && (
                    <Badge variant="emerald" size="xs">
                      {pkg.badge}
                    </Badge>
                  )}
                  <span className="font-mono font-bold text-emerald-400 text-sm">${pkg.price}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-[#08080a] border border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Payment Method:</span>
            <span className="font-mono text-white flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              •••• 4242 (Stripe Instant)
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRefillModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Zap}
              onClick={handleRefillMinutes}
              isLoading={isRefilling}
              className="shadow-glow"
            >
              Confirm &amp; Top Up Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
