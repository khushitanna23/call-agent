import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bot, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { getNavSections } from '../../config/navigation';

export const ClientSidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, organization, isAdmin } = useAuth();
  const location = useLocation();

  const navSections = getNavSections('client');

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0c0c0e] border-r border-emerald-950/40 flex flex-col transition-all duration-300 text-white ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-emerald-950/40">
          <NavLink to="/client/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-700 flex items-center justify-center text-black font-bold shrink-0 shadow-md shadow-emerald-500/20">
              <Bot className="w-5 h-5 text-black" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-extrabold text-white tracking-tight leading-none">
                  VEDANCO <span className="text-emerald-400">AI</span>
                </span>
                <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase mt-1 truncate">
                  {organization?.name || 'Client Workspace'}
                </span>
              </div>
            )}
          </NavLink>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {section.group}
                </div>
              )}
              {section.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/client/dashboard' &&
                    item.path !== '/client/agents/new' &&
                    location.pathname.startsWith(item.path));
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm font-semibold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-white'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <Badge variant="cyan" size="xs">
                        {item.badge}
                      </Badge>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}

          {/* Platform Admin link if user is administrator */}
          {isAdmin && (
            <div className="pt-4 border-t border-emerald-950/60">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-2">
                  Platform Admin
                </div>
              )}
              <NavLink
                to="/admin/dashboard"
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? 'Agency Admin Cockpit' : undefined}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
              >
                <Shield className="w-4 h-4 shrink-0 text-amber-400" />
                {!isCollapsed && (
                  <span className="truncate flex-1 font-semibold">Agency Cockpit</span>
                )}
                {!isCollapsed && <ArrowRight className="w-3.5 h-3.5 ml-auto text-amber-400" />}
              </NavLink>
            </div>
          )}
        </div>

        {/* Organization Voice Minute Usage Summary at bottom */}
        {!isCollapsed && (
          <div className="p-4 border-t border-emerald-950/60 bg-[#08080a]">
            <div className="flex items-center justify-between text-xs text-gray-300 mb-1.5">
              <span>Voice Minutes</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {organization?.minutesUsed || 142} / {organization?.minutesAllowance || 1000}
              </span>
            </div>
            <div className="w-full bg-[#121215] h-1.5 rounded-full overflow-hidden border border-emerald-950/80">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-600 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      ((organization?.minutesUsed || 142) / (organization?.minutesAllowance || 1000)) * 100
                    )
                  )}%`,
                }}
              />
            </div>
            <div className="mt-2 text-[10px] text-gray-400 flex items-center justify-between">
              <span className="capitalize">{organization?.plan || 'Growth'} Plan</span>
              <NavLink to="/client/billing" className="text-emerald-400 hover:underline">
                Upgrade
              </NavLink>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
