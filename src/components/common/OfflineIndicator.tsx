import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-gold/90 text-surface px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-2">
      <WifiOff className="w-4 h-4 animate-pulse text-surface" />
      <span>Offline mode — Working completely locally</span>
    </div>
  );
};
