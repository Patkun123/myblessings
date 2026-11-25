import {
  normalizeThemePreference,
  PROFILE_NAME_MAX,
  validateProfileName,
} from '@/domain/profile';

describe('validateProfileName', () => {
  it('trims and collapses extra whitespace', () => {
    expect(validateProfileName('  Grace   Church  ')).toEqual({
      ok: true,
      name: 'Grace Church',
    });
  });

  it('rejects empty or whitespace-only names', () => {
    expect(validateProfileName('')).toEqual({
      ok: false,
      error: 'Enter a name for this profile.',
    });
    expect(validateProfileName('   ')).toEqual({
      ok: false,
      error: 'Enter a name for this profile.',
    });
  });

  it('rejects names exceeding max length', () => {
    const result = validateProfileName('a'.repeat(PROFILE_NAME_MAX + 1));
    expect(result.ok).toBe(false);
  });
});

describe('normalizeThemePreference', () => {
  it.each(['light', 'dark', 'system'] as const)('keeps valid theme %p', (theme) => {
    expect(normalizeThemePreference(theme)).toBe(theme);
  });

  it.each([null, undefined, '', 'sepia', 'auto'])('falls back to light for %p', (value) => {
    expect(normalizeThemePreference(value)).toBe('light');
  });
});
