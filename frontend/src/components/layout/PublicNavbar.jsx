import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot,
  PhoneCall,
  Sparkles,
  Menu,
  X,
  ArrowRight,
  LayoutDashboard,
  Shield,
  Building2,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';

export const PublicNavbar = ({ onOpenVoiceDemo }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, isAdmin, logout, defaultDashboardPath } = useAuth();

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
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-300">
          <a href="#product" className="hover:text-emerald-400 transition">Product</a>
          <a href="#solutions" className="hover:text-emerald-400 transition">Solutions</a>
          <a href="#how-it-works" className="hover:text-emerald-400 transition">How It Works</a>
          <Link to="/pricing" className="hover:text-emerald-400 transition">Pricing</Link>
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition font-semibold">Log In</Link>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-2.5">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-800 text-gray-300 hover:text-white hover:bg-white/5 font-semibold px-3"
                >
                  Log In
                </Button>
              </Link>

              <Button
                variant="primary"
                size="sm"
                icon={LayoutDashboard}
                onClick={() => navigate(defaultDashboardPath || '/client/dashboard')}
              >
                Dashboard
              </Button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#121215] hover:bg-[#18181f] border border-slate-800 text-xs text-white transition"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-xs max-w-[120px] truncate">{user?.name || user?.email}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl p-2 border border-slate-800 shadow-2xl z-50 animate-in fade-in"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-850">
                      <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        {user?.role || (isAdmin ? 'Admin' : 'Client')}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/client/dashboard"
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition"
                      >
                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                        Client Workspace
                      </Link>
                      <Link
                        to="/admin/dashboard"
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-300 hover:bg-amber-500/10 rounded-xl transition"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        Admin Cockpit
                      </Link>
                      <Link
                        to="/login?switch=true"
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-500/10 rounded-xl transition"
                      >
                        <Bot className="w-3.5 h-3.5 text-cyan-400" />
                        Switch / Google Sign-In
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-850">
                      <button
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Primary, prominent Log In Button */}
              <Link to="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 font-bold px-3.5"
                >
                  Log In
                </Button>
              </Link>

              {/* Admin Portal shortcut */}
              <Link to="/login?role=admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 text-xs px-2.5 font-medium"
                  title="Admin Portal"
                >
                  <Shield className="w-3.5 h-3.5 mr-1 text-amber-400" />
                  Admin
                </Button>
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
                onClick={() => navigate('/signup')}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center gap-2">
          <Link to="/login">
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-2.5 py-1 text-emerald-400 border-emerald-500/40 font-semibold"
            >
              Log In
            </Button>
          </Link>
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
          <Link
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            Log In
          </Link>
          <div className="pt-4 border-t border-emerald-950/60 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(defaultDashboardPath || '/client/dashboard');
                  }}
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold text-gray-300 bg-[#18181c] hover:bg-[#222228] border border-slate-800 rounded-xl"
                >
                  Log In / Switch Account
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold text-emerald-300 bg-[#18181c] hover:bg-[#222228] border border-emerald-500/40 rounded-xl"
                >
                  Log In
                </Link>
                <Link
                  to="/login?role=admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-xs font-semibold text-amber-400/90 hover:bg-amber-500/10 rounded-xl border border-amber-500/20"
                >
                  Admin Portal Login
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
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
