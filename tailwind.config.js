/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#1F2937',
          50: '#F3F4F6',
          100: '#E5E7EB',
          200: '#D1D5DB',
          300: '#9CA3AF',
          400: '#6B7280',
          500: '#4B5563',
          600: '#374151',
          700: '#1F2937',
          800: '#111827',
          900: '#0B0F17',
        },
        gold: {
          DEFAULT: '#D4A017',
          light: '#F5D061',
          dark: '#B8860B',
          glow: 'rgba(212, 160, 23, 0.25)',
        },
        onyx: '#111827',
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'Noto Sans Gujarati', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(212, 160, 23, 0.25)',
        'gold-glow-lg': '0 0 25px rgba(212, 160, 23, 0.35)',
      },
    },
  },
  plugins: [],
}
