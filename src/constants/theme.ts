/**
 * Design tokens shared between TypeScript and Tailwind.
 * Keep these values in sync with `global.css` and `tailwind.config.js`.
 */
export const lightColors = {
  brand: '#1B3B6F',
  brandDark: '#12284D',
  brandLight: '#EBF1FA',
  accent: '#B58A1B',
  accentLight: '#FBF3D9',
  income: '#15803D',
  expense: '#B42318',
  warning: '#B54708',
  ink: '#0F172A',
  inkMuted: '#52637A',
  inkFaint: '#8494A7',
  canvas: '#F5F7FB',
  surface: '#FFFFFF',
  line: '#DCE3EE',
} as const;

export const darkColors = {
  brand: '#3568C4',
  brandDark: '#16325C',
  brandLight: '#172642',
  accent: '#D4A72C',
  accentLight: '#332912',
  income: '#22C55E',
  expense: '#F87171',
  warning: '#FB923C',
  ink: '#EEF2F9',
  inkMuted: '#9BA8BD',
  inkFaint: '#68778E',
  canvas: '#0B111E',
  surface: '#131C2E',
  line: '#23314B',
} as const;

export type ThemeColors = {
  readonly [K in keyof typeof lightColors]: string;
};

export type ColorScheme = 'light' | 'dark';

/** Default light palette for static seeds (category/wallet hex colors). */
export const colors = lightColors;

export function getThemeColors(scheme: ColorScheme): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  card: 16,
  pill: 999,
} as const;

/** Minimum tappable size (iOS HIG / Material). */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const MIN_TOUCH_TARGET = 44;
