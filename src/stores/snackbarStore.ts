import { create } from 'zustand';

export type SnackbarAction = {
  label: string;
  onPress: () => void;
};

export type SnackbarMessage = {
  id: number;
  message: string;
  action?: SnackbarAction;
  durationMs: number;
};

type SnackbarState = {
  current: SnackbarMessage | null;
  show: (message: string, options?: { action?: SnackbarAction; durationMs?: number }) => void;
  dismiss: () => void;
};

let nextId = 1;

/**
 * A single-slot queue: a new message replaces the visible one. Undo actions
 * (Phase 3) rely on this, so the newest message must always win.
 */
export const useSnackbarStore = create<SnackbarState>((set) => ({
  current: null,
  show: (message, options) =>
    set({
      current: {
        id: nextId++,
        message,
        action: options?.action,
        // Undo needs a longer window than a plain confirmation.
        durationMs: options?.durationMs ?? (options?.action ? 6_000 : 3_000),
      },
    }),
  dismiss: () => set({ current: null }),
}));

/** Convenience for non-component call sites (services, mutations). */
export const snackbar = {
  show: (message: string, options?: { action?: SnackbarAction; durationMs?: number }) =>
    useSnackbarStore.getState().show(message, options),
  dismiss: () => useSnackbarStore.getState().dismiss(),
};
