import { colorScheme, useColorScheme } from 'nativewind';
import { create } from 'zustand';

import { getThemeColors, type ThemeColors } from '@/constants/theme';
import type { ThemePreference } from '@/domain/profile';

type ThemeState = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

export function applyNativeWindTheme(preference: ThemePreference): void {
  try {
    colorScheme.set(preference);
  } catch {
    // Non-browser SSR or Jest environments without window ignore DOM class updates.
  }
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'light',
  setPreference: (preference) => {
    applyNativeWindTheme(preference);
    set({ preference });
  },
}));

/** Reactive theme palette matching NativeWind's resolved light/dark scheme. */
export function useThemeColors(): ThemeColors {
  const { colorScheme: activeScheme } = useColorScheme();
  return getThemeColors(activeScheme === 'dark' ? 'dark' : 'light');
}
