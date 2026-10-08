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
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export const BillingPage = () => {
  const { organization, refreshUser } = useAuth();
  const [billingInfo, setBillingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changePlanModal, setChangePlanModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [refillPack, setRefillPack] = useState(1000);
  const [isRefilling, setIsRefilling] = useState(false);
  const toast = useToast();

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
            Subscription & Usage Meter
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Monitor real-time voice minutes, resource consumption, subscription tiers, and review paid invoices.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Sparkles}
          onClick={() => setChangePlanModal(true)}
        >
          Change Plan
        </Button>
      </div>

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
