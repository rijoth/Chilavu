import { create } from 'zustand';
import { eventService } from '@/features/events/eventService';
import type { Event } from '@/types/event';

export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'error';
  message: string;
  action?: ToastAction;
}

interface UIStore {
  toasts: ToastMessage[];
  showToast: (
    message: string,
    type?: 'info' | 'success' | 'error',
    action?: ToastAction
  ) => void;
  removeToast: (id: string) => void;
  archiveEvent: (id: string) => Promise<Event>;
  unarchiveEvent: (id: string) => Promise<Event>;
}

export const useUIStore = create<UIStore>((set) => ({
  toasts: [],

  showToast: (message: string, type = 'info', action?: ToastAction) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, action }],
    }));

    // Allow more time to interact when an action like "Undo" is present
    const timeoutMs = action ? 5500 : 3500;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, timeoutMs);
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  archiveEvent: async (id: string) => {
    return await eventService.archiveEvent(id);
  },

  unarchiveEvent: async (id: string) => {
    return await eventService.unarchiveEvent(id);
  },
}));
