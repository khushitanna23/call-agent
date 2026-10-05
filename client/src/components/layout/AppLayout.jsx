import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { LiveVoiceCallModal } from '../voice/LiveVoiceCallModal';
import { useToast } from '../../context/ToastContext';

export const AppLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [voiceDemoOpen, setVoiceDemoOpen] = useState(false);
  const [agentOnline, setAgentOnline] = useState(true);
  const toast = useToast();

  const handleToggleAgentStatus = () => {
    setAgentOnline((prev) => {
      const next = !prev;
      toast.info(`AI Receptionist is now ${next ? 'ONLINE' : 'OFFLINE'}`);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f3f4f6] flex">
      {/* Sidebar */}
      <AppSidebar
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
        <AppHeader
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
  );
};
