import { create } from 'zustand';
import type { AppSettings, ThemeMode } from '@/types/settings';

interface SettingsStore extends AppSettings {
  setTheme: (theme: ThemeMode) => void;
  setDefaultCurrency: (currency: string) => void;
  applyTheme: () => void;
}

const STORAGE_KEY = 'eventledger_settings';

function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        theme: parsed.theme || 'system',
        defaultCurrency: parsed.defaultCurrency || 'INR',
      };
    }
  } catch {
    // ignore
  }
  return {
    theme: 'dark',
    defaultCurrency: 'INR',
  };
}

function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function resolveEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }
  return mode;
}

export const useSettingsStore = create<SettingsStore>((set, get) => {
  const initial = getStoredSettings();

  return {
    ...initial,

    setTheme: (theme: ThemeMode) => {
      set({ theme });
      saveSettings({ theme, defaultCurrency: get().defaultCurrency });
      get().applyTheme();
    },

    setDefaultCurrency: (defaultCurrency: string) => {
      const formatted = defaultCurrency.trim().toUpperCase();
      set({ defaultCurrency: formatted });
      saveSettings({ theme: get().theme, defaultCurrency: formatted });
    },

    applyTheme: () => {
      if (typeof document === 'undefined') return;
      const effective = resolveEffectiveTheme(get().theme);
      document.documentElement.setAttribute('data-theme', effective);

      // Also update meta theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', effective === 'dark' ? '#191724' : '#faf4ed');
      }
    },
  };
});

// Setup system theme change listener
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useSettingsStore.getState().theme === 'system') {
      useSettingsStore.getState().applyTheme();
    }
  });
}
