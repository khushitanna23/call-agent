import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, LogOut, Activity, Users, FileText, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-[#f3f4f6] flex flex-col">
      {/* Top Admin Navbar */}
      <header className="h-16 bg-[#0c0c0e] border-b border-emerald-950/40 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            to="/app/dashboard"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition bg-[#18181c] px-2.5 py-1.5 rounded-lg border border-emerald-950/80"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to App
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white">VEDANCO AI</span>
              <span className="text-[10px] text-amber-400 font-mono ml-2 uppercase px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                Super Admin
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">
            Logged in as <strong className="text-white">{user?.name}</strong>
          </span>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto bg-[#050505]">
        <Outlet />
      </main>
    </div>
  );
};
