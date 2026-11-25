export const PROFILE_NAME_MAX = 60;

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export type ProfileNameValidation =
  | { ok: true; name: string }
  | { ok: false; error: string };

/** Normalises and validates a local profile name before persisting it. */
export function validateProfileName(raw: string): ProfileNameValidation {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (trimmed.length === 0) {
    return { ok: false, error: 'Enter a name for this profile.' };
  }
  if (trimmed.length > PROFILE_NAME_MAX) {
    return { ok: false, error: `Keep the name under ${PROFILE_NAME_MAX} characters.` };
  }
  return { ok: true, name: trimmed };
}

export function isThemePreference(value: string): value is ThemePreference {
  return (THEME_PREFERENCES as readonly string[]).includes(value);
}

/** Falls back to `'light'` when a stored theme value is missing or unrecognised. */
export function normalizeThemePreference(value: string | null | undefined): ThemePreference {
  if (value && isThemePreference(value)) return value;
  return 'light';
}
