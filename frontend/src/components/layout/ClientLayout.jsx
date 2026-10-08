import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ClientSidebar } from './ClientSidebar';
import { ClientHeader } from './ClientHeader';
import { LiveVoiceCallModal } from '../voice/LiveVoiceCallModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export const ClientLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [voiceDemoOpen, setVoiceDemoOpen] = useState(false);
  const [agentOnline, setAgentOnline] = useState(true);
  const toast = useToast();
  const { isImpersonating, impersonatingOrg, stopImpersonation } = useAuth();
  const navigate = useNavigate();

  const handleToggleAgentStatus = () => {
    setAgentOnline((prev) => {
      const next = !prev;
      toast.info(`AI Receptionist is now ${next ? 'ONLINE' : 'OFFLINE'}`);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f3f4f6] flex flex-col">
      {/* Impersonation Mode Top Bar */}
      {isImpersonating && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black px-4 py-2 text-xs font-bold flex items-center justify-between sticky top-0 z-50 shadow-lg border-b border-black/20">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-black animate-pulse" />
            <span>
              Agency Support Mode: Currently viewing workspace as{' '}
              <strong className="underline">{impersonatingOrg?.name}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              stopImpersonation();
              navigate('/admin/clients');
            }}
            className="bg-black hover:bg-zinc-900 text-amber-400 hover:text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit to Agency Cockpit
          </button>
        </div>
      )}

      <div className="flex flex-1">
        {/* Client Sidebar */}
      <ClientSidebar
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
        <ClientHeader
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setIsMobileOpen(!isMobileOpen);
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }}
          onOpenVoiceDemo={() => setVoiceDemoOpen(true)}
          agentOnline={agentOnline}
          onToggleAgentStatus={handleToggleAgentStatus}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto bg-[#050505]">
          <Outlet context={{ agentOnline, onOpenVoiceDemo: () => setVoiceDemoOpen(true) }} />
        </main>
      </div>

      {/* Voice Demo Simulation Modal */}
      <LiveVoiceCallModal
        isOpen={voiceDemoOpen}
        onClose={() => setVoiceDemoOpen(false)}
        agentName="Sarah"
      />
      </div>
    </div>
  );
};
