/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Must not be the Tailwind default ('media'): NativeWind's web runtime calls
  // colorScheme.set() when the stylesheet registers, and throws outright if the
  // dark-mode type is 'media'. The app is light-only, so the variant never fires.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand — deep teal, calm and trustworthy for money
        brand: {
          DEFAULT: '#0E6B57',
          dark: '#0A4F41',
          light: '#E6F4F0',
        },
        // Accent — subdued gold, used sparingly (church / giving)
        accent: {
          DEFAULT: '#B58A1B',
          light: '#FBF3D9',
        },
        income: '#15803D',
        expense: '#B42318',
        warning: '#B54708',
        ink: {
          DEFAULT: '#0F1B17',
          muted: '#5F736C',
          faint: '#8A9A94',
        },
        canvas: '#F6F9F8',
        surface: '#FFFFFF',
        line: '#E2EAE6',
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};
