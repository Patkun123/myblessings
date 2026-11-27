/**
 * Design tokens — The Capiz Window.
 *
 * One window, two exposures. `dark` is the lamplit room (the app's default);
 * `light` is the same window at noon. Both keep the five-tone shell ramp:
 * frame (canvas) → ground (surface) → pane → lit pane (brand/lamplight) → ink.
 *
 * Keep these values in sync with `global.css` and `tailwind.config.js`.
 */
export const lightColors = {
  brand: '#8A5410',
  brandDark: '#6B400C',
  brandLight: '#F0E2C6',
  brandInk: '#FBF6EC',
  accent: '#8A5410',
  accentLight: '#F3E7CC',
  income: '#2F6B4F',
  expense: '#A8412B',
  warning: '#8A5A00',
  ink: '#241C16',
  inkMuted: '#5F5449',
  inkFaint: '#8A7C6C',
  canvas: '#F4ECDD',
  surface: '#FBF6EC',
  pane: '#F1E6D2',
  line: '#D9C9AC',
  plate: '#241C16',
  plateInk: '#F4ECDD',
} as const;

export const darkColors = {
  brand: '#E9A94A',
  brandDark: '#C2872E',
  brandLight: '#33261C',
  brandInk: '#241C16',
  accent: '#E9A94A',
  accentLight: '#3A2C1D',
  income: '#6FA98A',
  expense: '#D07A63',
  warning: '#E0A93F',
  ink: '#F4ECDD',
  inkMuted: '#B9B0A2',
  inkFaint: '#8A8073',
  canvas: '#1C1613',
  surface: '#221A15',
  pane: '#2A211B',
  line: '#3B2F26',
  plate: '#F4ECDD',
  plateInk: '#241C16',
} as const;

export type ThemeColors = {
  readonly [K in keyof typeof lightColors]: string;
};

export type ColorScheme = 'light' | 'dark';

/**
 * Accent hues stored in the database (category and wallet seeds). These are
 * mid-tones chosen to clear 3:1 against both the lamplit and daylight panes, so
 * a stored hue never disappears when the scheme changes.
 */
export const accentColors = {
  income: '#3E8F6B',
  expense: '#B5493A',
  giving: '#A9691A',
  neutral: '#7A6A57',
  plum: '#8C5A7D',
} as const;

/** Default light palette for static seeds (category/wallet hex colors). */
export const colors = lightColors;

export function getThemeColors(scheme: ColorScheme): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors;
}

/**
 * Rows seeded before the Capiz Window carry the old palette. Map those exact
 * hexes onto the scheme-independent accents so old records keep their meaning.
 */
const LEGACY_ACCENTS: Record<string, string> = {
  '#1B3B6F': accentColors.giving,
  '#12284D': accentColors.giving,
  '#B58A1B': accentColors.giving,
  '#D4A72C': accentColors.giving,
  '#15803D': accentColors.income,
  '#22C55E': accentColors.income,
  '#B42318': accentColors.expense,
  '#C82B22': accentColors.expense,
  '#F87171': accentColors.expense,
  '#52637A': accentColors.neutral,
  '#9BA8BD': accentColors.neutral,
  '#8494A7': accentColors.neutral,
  '#68778E': accentColors.neutral,
};

export function normalizeAccent(stored: string | null | undefined): string {
  if (!stored) return accentColors.neutral;
  return LEGACY_ACCENTS[stored.toUpperCase()] ?? stored;
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
  pane: 12,
  card: 14,
  window: 20,
  pill: 999,
} as const;

/** Type ramp. Sizes are the shipped mobile sizes, not a web scale. */
export const type = {
  /** The one monumental figure on a screen (the transom total). */
  monumental: 34,
  title: 24,
  heading: 17,
  body: 14,
  small: 12,
  /** Tracked all-caps labels. */
  label: 10,
  micro: 8,
} as const;

/** Minimum tappable size (iOS HIG / Material). */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const MIN_TOUCH_TARGET = 44;
