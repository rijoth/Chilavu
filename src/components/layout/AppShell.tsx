import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Settings, Sparkles, BookOpen } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { initStoragePersistence } from '@/db/database';
import { ToastContainer } from '@/components/common/ToastContainer';
import { OfflineIndicator } from '@/components/common/OfflineIndicator';

export const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const applyTheme = useSettingsStore((s) => s.applyTheme);

  useEffect(() => {
    applyTheme();
    initStoragePersistence();
  }, [applyTheme]);

  const isSettingsPage = location.pathname === '/settings';

  return (
    <div className="min-h-screen bg-base text-text flex flex-col font-sans selection:bg-iris/25">
      {/* Toast Feedback */}
      <ToastContainer />

      {/* Offline Status */}
      <OfflineIndicator />

      {/* Primary App Shell Container */}
      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto min-h-screen relative pb-16">
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
