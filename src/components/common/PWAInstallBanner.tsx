import React, { useState } from 'react';
import { Download, Share2, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  if (isInstallable) {
    return (
      <div className="mx-4 mb-4 p-3.5 rounded-2xl bg-surface border border-pine/30 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-pine/15 text-pine flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-text truncate">Install Kanakku</h4>
            <p className="text-xs text-subtle truncate">Fast, offline-ready app on your device</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={install}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pine text-white text-xs font-medium hover:bg-pine/90 transition shadow-xs min-h-[36px]"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 text-muted hover:text-text rounded-lg hover:bg-overlay"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (isIOS) {
    return (
      <>
        <div className="mx-4 mb-4 p-3.5 rounded-2xl bg-surface border border-overlay shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-overlay text-iris flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-text truncate">Install on iPhone / iPad</h4>
              <p className="text-xs text-subtle truncate">Add to Home Screen for offline access</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="px-3 py-1.5 rounded-xl bg-overlay hover:bg-overlay/80 text-text text-xs font-medium transition min-h-[36px]"
            >
              How to
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-1.5 text-muted hover:text-text rounded-lg hover:bg-overlay"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-surface border border-overlay p-6 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-2 text-subtle hover:text-text rounded-lg"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-text mb-2">Install on iOS Safari</h3>
              <ol className="mt-3 space-y-2.5 text-sm text-subtle list-decimal list-inside">
                <li>
                  Tap the <strong className="text-text">Share</strong> button (box with upward arrow) in Safari.
                </li>
                <li>
                  Scroll down and tap <strong className="text-text">Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong className="text-text">Add</strong> in the top right corner.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-pine py-2.5 text-sm font-medium text-white hover:bg-pine/90 transition min-h-[44px]"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
