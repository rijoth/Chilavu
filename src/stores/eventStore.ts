import { create } from 'zustand';
import { eventService } from '@/features/events/eventService';
import type { Event } from '@/types/event';

export interface EventStore {
  archiveEvent: (id: string) => Promise<Event>;
  unarchiveEvent: (id: string) => Promise<Event>;
}

export const useEventStore = create<EventStore>(() => ({
  archiveEvent: async (id: string) => {
    return await eventService.archiveEvent(id);
  },
  unarchiveEvent: async (id: string) => {
    return await eventService.unarchiveEvent(id);
  },
}));

export const archiveEvent = (id: string) => useEventStore.getState().archiveEvent(id);
export const unarchiveEvent = (id: string) => useEventStore.getState().unarchiveEvent(id);
