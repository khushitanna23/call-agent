import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, PhoneCall, Sparkles, Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

export const PublicNavbar = ({ onOpenVoiceDemo }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-[#050505]/95 backdrop-blur-xl border-b border-emerald-950/40 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-700 flex items-center justify-center text-black font-bold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <Bot className="w-6 h-6 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              VEDANCO <span className="text-emerald-400 text-sm font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">AI</span>
            </span>
            <span className="text-[10px] tracking-wider uppercase text-gray-400 font-semibold -mt-1">
              AI Employees
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="#product" className="hover:text-emerald-400 transition">Product</a>
          <a href="#solutions" className="hover:text-emerald-400 transition">Solutions</a>
          <a href="#how-it-works" className="hover:text-emerald-400 transition">How It Works</a>
          <Link to="/pricing" className="hover:text-emerald-400 transition">Pricing</Link>
          <a href="#faq" className="hover:text-emerald-400 transition">Resources</a>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-semibold text-gray-300 hover:text-emerald-400 px-3 py-2 transition"
          >
            Login
          </Link>

          <Button
            variant="secondary"
            size="sm"
            icon={PhoneCall}
            onClick={onOpenVoiceDemo}
          >
            Talk to AI
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const demoSection = document.getElementById('book-demo');
              if (demoSection) {
                demoSection.scrollIntoView({ behavior: 'smooth' });
              } else {
                navigate('/demo');
              }
            }}
          >
            Book a Demo
          </Button>
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={PhoneCall}
            onClick={onOpenVoiceDemo}
            className="text-xs px-2.5 py-1"
          >
            Talk
          </Button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-emerald-400 rounded-lg focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0c0c0e] border-b border-emerald-950/60 shadow-2xl px-6 py-6 flex flex-col gap-4 animate-in slide-in-from-top-4">
          <a
            href="#product"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base text-gray-300 hover:text-emerald-400 font-medium"
          >
            Product
          </a>
          <a
            href="#solutions"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base text-gray-300 hover:text-emerald-400 font-medium"
          >
            Solutions
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base text-gray-300 hover:text-emerald-400 font-medium"
          >
            How It Works
          </a>
          <Link
            to="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base text-gray-300 hover:text-emerald-400 font-medium"
          >
            Pricing
          </Link>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base text-gray-300 hover:text-emerald-400 font-medium"
          >
            Resources
          </a>
          <div className="pt-4 border-t border-emerald-950/60 flex flex-col gap-2.5">
            <Link
              to="/login"
              className="w-full text-center py-2.5 text-sm font-semibold text-white bg-[#18181c] hover:bg-[#222228] border border-emerald-500/20 rounded-xl"
            >
              Login
            </Link>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/signup');
              }}
            >
              Get Started Free <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};
