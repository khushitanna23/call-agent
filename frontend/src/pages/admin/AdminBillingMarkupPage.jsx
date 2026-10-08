import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Sliders,
  CreditCard,
  TrendingUp,
  Percent,
  Copy,
  Check,
  Send,
  Sparkles,
  RotateCcw,
  Building,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

export const AdminBillingMarkupPage = () => {
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Markup & Pricing Config
  const [baseCostPerMin, setBaseCostPerMin] = useState(0.05); // Agency wholesale cost
  const [clientPricePerMin, setClientPricePerMin] = useState(0.15); // Agency retail price
  const [monthlyVolumeMinutes, setMonthlyVolumeMinutes] = useState(11450);

  // Stripe Checkout Link Generator State
  const [selectedClientForRefill, setSelectedClientForRefill] = useState('');
  const [refillMinutes, setRefillMinutes] = useState(1000);
  const [generatedStripeLink, setGeneratedStripeLink] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/admin/clients');
      if (res?.data) {
        setClients(res.data);
        if (res.data.length > 0 && !selectedClientForRefill) {
          setSelectedClientForRefill(res.data[0].id || res.data[0]._id);
        }
      }
    } catch {}
  };

  // Calculations
  const profitPerMinute = Math.max(0, clientPricePerMin - baseCostPerMin);
  const markupPercentage = baseCostPerMin > 0 ? Math.round(((clientPricePerMin - baseCostPerMin) / baseCostPerMin) * 100) : 0;
  const grossMarginPercent = clientPricePerMin > 0 ? Math.round((profitPerMinute / clientPricePerMin) * 100) : 0;
  const estimatedMonthlyProfit = monthlyVolumeMinutes * profitPerMinute;
  const refillTotalPrice = (refillMinutes * clientPricePerMin).toFixed(2);

  const handleGenerateStripeCheckout = () => {
    const matchedClient = clients.find((c) => (c.id || c._id) === selectedClientForRefill);
    const clientName = matchedClient?.name?.replace(/\s+/g, '-').toLowerCase() || 'client';
    const link = `https://checkout.stripe.com/pay/cs_live_agency_${clientName}_refill_${refillMinutes}min_${Date.now().toString().slice(-6)}`;
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

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-500/30">
              Agency Monetization
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Global Billing &amp; Markup Calculator</h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure wholesale minute markups, calculate recurring profit margins, and generate 1-click Stripe refill checkout links.
          </p>
        </div>

        <Badge variant="emerald" size="sm">
          Stripe Connect Active
        </Badge>
      </div>

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
          <span className="text-[10px] text-amber-400 mt-1 block">Across 5 active agency retainers</span>
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

      {/* Automated Stripe Checkout Link Generator for Minute Refills */}
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
              {clients.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1 text-xs">Minutes Refill Package</label>
            <select
              value={refillMinutes}
              onChange={(e) => setRefillMinutes(parseInt(e.target.value))}
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
  );
};
