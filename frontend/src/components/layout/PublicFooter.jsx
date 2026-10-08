import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, PhoneCall, ShieldCheck, Cpu, ArrowUpRight } from 'lucide-react';

export const PublicFooter = () => {
  return (
    <footer className="bg-[#030303] border-t border-emerald-950/40 pt-16 pb-12 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-emerald-950/40">
          {/* Brand Column */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-700 flex items-center justify-center text-black font-bold shadow-md shadow-emerald-500/20">
                <Bot className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                VEDANCO <span className="text-emerald-400">AI</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm text-gray-400">
              AI Employees for Your Business. Answer calls, qualify high-intent leads, book appointments into your calendar, and automate customer conversations 24/7.
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-300 pt-2">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> SOC-2 & HIPAA Ready
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Cpu className="w-4 h-4" /> 99.9% Voice Uptime
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="flex flex-col gap-3 text-sm">
            <h4 className="text-white font-semibold tracking-wider text-xs uppercase">Product</h4>
            <a href="#product" className="hover:text-white transition">AI Receptionist</a>
            <a href="#how-it-works" className="hover:text-white transition">Knowledge Base</a>
            <a href="#features" className="hover:text-white transition">Call Analytics</a>
            <a href="#features" className="hover:text-white transition">CRM & Calendars</a>
            <Link to="/pricing" className="hover:text-white transition">Minute Pricing</Link>
          </div>

          {/* Solutions Links */}
          <div className="flex flex-col gap-3 text-sm">
            <h4 className="text-white font-semibold tracking-wider text-xs uppercase">Solutions</h4>
            <a href="#solutions" className="hover:text-white transition">Real Estate</a>
            <a href="#solutions" className="hover:text-white transition">Healthcare Clinics</a>
            <a href="#solutions" className="hover:text-white transition">Hotels & Hospitality</a>
            <a href="#solutions" className="hover:text-white transition">Automobile Dealers</a>
            <a href="#solutions" className="hover:text-white transition">Home Services</a>
          </div>

          {/* Company & Resources */}
          <div className="flex flex-col gap-3 text-sm">
            <h4 className="text-white font-semibold tracking-wider text-xs uppercase">Platform</h4>
            <Link to="/login?role=client" className="hover:text-emerald-400 transition">Client Workspace Portal</Link>
            <Link to="/login?role=admin" className="hover:text-amber-400 transition text-amber-400/90 font-medium">Super Admin Cockpit</Link>
            <Link to="/demo" className="hover:text-white transition">Book Live Demo</Link>
            <a href="#faq" className="hover:text-white transition">Platform FAQ</a>
            <Link to="/signup" className="hover:text-white transition">Deploy AI in 5 Mins</Link>
            <span className="text-xs text-slate-500 pt-2">API & Webhooks V1</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} VEDANCO AI Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300 transition">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition">Security</a>
            <a href="#" className="hover:text-slate-300 transition">Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
