import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Shield, ArrowRight, Bot } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { getNavSections } from '../../config/navigation';

export const AdminSidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  const navSections = getNavSections('admin');

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Admin Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0c0c0e] border-r border-amber-500/20 flex flex-col transition-all duration-300 text-white ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-amber-500/20 bg-amber-500/5">
          <NavLink to="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-black font-bold shrink-0 shadow-md shadow-amber-500/20">
              <Shield className="w-5 h-5 text-black" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-extrabold text-white tracking-tight leading-none">
                  VEDANCO <span className="text-amber-400">AGENCY</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono tracking-wider uppercase mt-1 truncate">
                  Master Console
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
                  (item.path !== '/admin/dashboard' &&
                    item.path !== '/admin/agents/new' &&
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
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm font-semibold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-amber-400' : 'text-gray-500 group-hover:text-amber-300'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <Badge variant="amber" size="xs">
                        {item.badge}
                      </Badge>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Client Workspace Preview Switcher at bottom */}
        {!isCollapsed && (
          <div className="p-4 border-t border-amber-500/20 bg-[#08080a]">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Workspace Switcher
            </div>
            <NavLink
              to="/client/dashboard"
              className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-semibold transition group"
            >
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>Client View</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
            <div className="mt-2 text-[10px] text-gray-500 flex items-center justify-between">
              <span>Carrier Trunks:</span>
              <span className="text-emerald-400 font-mono">100% Operational</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
