/**
 * Design tokens shared between TypeScript and Tailwind.
 * Keep these values in sync with `tailwind.config.js`.
 */
export const colors = {
  brand: '#0E6B57',
  brandDark: '#0A4F41',
  brandLight: '#E6F4F0',
  accent: '#B58A1B',
  accentLight: '#FBF3D9',
  income: '#15803D',
  expense: '#B42318',
  warning: '#B54708',
  ink: '#0F1B17',
  inkMuted: '#5F736C',
  inkFaint: '#8A9A94',
  canvas: '#F6F9F8',
  surface: '#FFFFFF',
  line: '#E2EAE6',
} as const;

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
