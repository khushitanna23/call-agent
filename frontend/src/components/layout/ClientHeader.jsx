import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Shield,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

export const ClientHeader = ({
  onToggleSidebar,
  onOpenVoiceDemo,
  agentOnline = true,
  onToggleAgentStatus,
}) => {
  const { user, organization, logout, isAdmin } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-[#08080a]/95 backdrop-blur-md border-b border-emerald-950/40 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left items */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-gray-400 hover:text-emerald-400 rounded-xl hover:bg-white/5 transition"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Live AI Receptionist status pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30">
          <span
            className={`w-2 h-2 rounded-full ${
              agentOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-xs font-semibold text-white">
            Sarah: {agentOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
          <button
            onClick={onToggleAgentStatus}
            className="text-[11px] text-emerald-400 hover:underline ml-1 font-medium"
          >
            {agentOnline ? 'Pause' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Right items */}
      <div className="flex items-center gap-3">
        {/* Quick Voice Demo Simulation button */}
        <button
          onClick={onOpenVoiceDemo}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition shadow-xs"
        >
          <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
          <span>Test Call</span>
        </button>

        {/* Client Organization Badge */}
        <div className="hidden md:flex items-center">
          <Badge variant="default" size="sm">
            {organization?.name || 'Client Workspace'}
          </Badge>
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/5 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-green-700 flex items-center justify-center text-black font-bold text-xs uppercase overflow-hidden shadow-xs">
              {user?.name ? user.name.charAt(0) : 'C'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">{user?.name}</span>
              <span className="text-[10px] text-emerald-400 font-mono capitalize">
                {user?.role === 'admin' ? 'Admin' : 'Client'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {profileDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl p-2 border border-emerald-500/30 shadow-2xl z-50 animate-in fade-in zoom-in-95 text-white"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b border-emerald-950/60">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => navigate('/client/settings')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Account Settings
                </button>
                <button
                  onClick={() => navigate('/client/billing')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Plan & Invoices
                </button>
                {isAdmin ? (
                  <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-300 hover:bg-amber-500/10 rounded-xl transition"
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    Admin Cockpit
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/login?role=admin')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10 rounded-xl transition"
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    Admin Portal (Google)
                  </button>
                )}
                <button
                  onClick={() => navigate('/login?switch=true')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-500/10 rounded-xl transition"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Switch User / Google Login
                </button>
              </div>

              <div className="pt-1 border-t border-emerald-950/60">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
