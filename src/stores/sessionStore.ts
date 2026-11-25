import { create } from 'zustand';

import { hasPin } from '@/services/pinService';
import {
  forgetActiveUserId,
  loadActiveUserId,
  saveActiveUserId,
} from '@/services/sessionStorage';

/**
 * Session/UI state only — the ledger is never mirrored here.
 *
 * `hydrated` must be true before routing decisions are made, otherwise a
 * re-launch briefly renders onboarding for an existing profile.
 */
type SessionState = {
  activeUserId: string | null;
  hydrated: boolean;
  locked: boolean;
  /** Non-null when SecureStore could not be read at launch. */
  hydrateError: string | null;
  hydrate: () => Promise<void>;
  retryHydrate: () => Promise<void>;
  setActiveUser: (userId: string) => Promise<void>;
  clearActiveUser: () => Promise<void>;
  lock: () => void;
  unlock: () => void;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  activeUserId: null,
  hydrated: false,
  locked: false,
  hydrateError: null,

  hydrate: async () => {
    if (get().hydrated) return;

    try {
      const userId = await loadActiveUserId();
      if (!userId) {
        set({ hydrated: true, activeUserId: null, locked: false, hydrateError: null });
        return;
      }

      // A profile with no PIN goes straight in; the lock gate only exists once
      // a PIN has been set.
      const pinExists = await hasPin(userId);
      set({ hydrated: true, activeUserId: userId, locked: pinExists, hydrateError: null });
    } catch (cause) {
      // Never fall through to the app shell: an unreadable lock state must not
      // silently unlock the ledger.
      set({
        hydrated: true,
        hydrateError:
          cause instanceof Error ? cause.message : 'Could not read the app lock state.',
      });
    }
  },

  retryHydrate: async () => {
    set({ hydrated: false, hydrateError: null });
    await get().hydrate();
  },

  setActiveUser: async (userId) => {
    await saveActiveUserId(userId);
    set({ activeUserId: userId, hydrated: true, locked: false });
  },

  clearActiveUser: async () => {
    await forgetActiveUserId();
    set({ activeUserId: null, locked: false });
  },

  lock: () => {
    if (get().activeUserId) set({ locked: true });
  },

  unlock: () => set({ locked: false }),
}));
