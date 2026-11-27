/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Must not be 'media': NativeWind's web runtime calls colorScheme.set()
  // when the stylesheet registers, which requires 'class' mode.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Lamplight. The one accent the window is lit by.
        brand: {
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          dark: 'rgb(var(--color-brand-dark) / <alpha-value>)',
          light: 'rgb(var(--color-brand-light) / <alpha-value>)',
          ink: 'rgb(var(--color-brand-ink) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          light: 'rgb(var(--color-accent-light) / <alpha-value>)',
        },
        income: 'rgb(var(--color-income) / <alpha-value>)',
        expense: 'rgb(var(--color-expense) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--color-ink-faint) / <alpha-value>)',
        },
        // Shell ramp: frame → ground → pane → plate.
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        pane: 'rgb(var(--color-pane) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        plate: {
          DEFAULT: 'rgb(var(--color-plate) / <alpha-value>)',
          ink: 'rgb(var(--color-plate-ink) / <alpha-value>)',
        },
      },
      fontFamily: {
        // One face, four weights. React Native needs a family per weight.
        body: ['Archivo_400Regular'],
        'body-medium': ['Archivo_500Medium'],
        'body-semibold': ['Archivo_600SemiBold'],
        'body-bold': ['Archivo_700Bold'],
      },
      borderRadius: {
        pane: '12px',
        card: '14px',
        window: '20px',
      },
      letterSpacing: {
        label: '0.14em',
        wide2: '0.18em',
      },
    },
  },
  plugins: [],
};
