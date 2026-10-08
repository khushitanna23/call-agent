import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, LogOut, Menu, Bot, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from './AdminSidebar';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-[#f3f4f6] flex">
      {/* Admin Sidebar */}
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-[#050505] transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Admin Navbar */}
        <header className="h-16 bg-[#08080a]/95 backdrop-blur-md border-b border-amber-500/20 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileOpen(!isMobileOpen);
                } else {
                  setIsCollapsed(!isCollapsed);
                }
              }}
              className="p-2 text-gray-400 hover:text-amber-400 rounded-xl hover:bg-white/5 transition"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-white hidden sm:inline">
                Agency Control Center
              </span>
              <span className="text-[10px] text-amber-400 font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                Super Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Link to Client Workspace */}
            <Link
              to="/client/dashboard"
              className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30 font-semibold"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Switch to Client View</span>
            </Link>

            <span className="text-xs text-gray-400 hidden md:inline">
              <strong className="text-white">{user?.name}</strong>
            </span>

            <Link
              to="/login?switch=true"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/20 transition"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Switch User</span>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/20 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto bg-[#050505]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
