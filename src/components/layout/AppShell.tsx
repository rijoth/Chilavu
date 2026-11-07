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
      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto min-h-screen relative">
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>

        {/* Subtle Footer */}
        <footer
          className="mt-auto pt-6 px-4 text-center border-t border-overlay/40"
          style={{
            paddingBottom: 'calc(56px + 24px + 16px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <p className="text-xs text-muted font-normal tracking-wide select-none">
            ©{' '}
            <a
              href="https://github.com/rijoth"
              target="_blank"
              rel="noopener noreferrer"
              className="text-subtle hover:text-text transition-colors underline underline-offset-2 decoration-muted/60"
            >
              https://github.com/rijoth
            </a>{' '}
            {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
};
