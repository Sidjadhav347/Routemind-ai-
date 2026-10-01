/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // StinPort Emerald / Global Trade Green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        trade: {
          bg: '#040907',
          surface: '#08140f',
          card: '#0a1812',
          border: 'rgba(34, 197, 94, 0.16)',
          glow: 'rgba(34, 197, 94, 0.25)',
        },
        gold: {
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
        },
        mobility: {
          cyan: '#06b6d4',
          emerald: '#22c55e',
          amber: '#f59e0b',
          rose: '#f43f5e',
          violet: '#8b5cf6',
          slate: '#0f172a',
          dark: '#040907',
          card: '#0a1812',
          border: '#153123',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace'],
      },
      boxShadow: {
        'primary-glow': '0 6px 24px -2px rgba(34, 197, 94, 0.6), 0 2px 10px -1px rgba(34, 197, 94, 0.4), 0 0 24px 0 rgba(34, 197, 94, 0.35)',
        'primary-glow-hover': '0 10px 35px -2px rgba(34, 197, 94, 0.85), 0 4px 16px -2px rgba(34, 197, 94, 0.6), 0 0 35px 4px rgba(34, 197, 94, 0.5)',
        'emerald-glow': '0 6px 24px -2px rgba(34, 197, 94, 0.6), 0 2px 10px -1px rgba(34, 197, 94, 0.4), 0 0 24px 0 rgba(34, 197, 94, 0.35)',
        'emerald-glow-hover': '0 10px 35px -2px rgba(34, 197, 94, 0.85), 0 4px 16px -2px rgba(34, 197, 94, 0.6), 0 0 35px 4px rgba(34, 197, 94, 0.5)',
        'gold-glow': '0 6px 24px -2px rgba(234, 179, 8, 0.6), 0 2px 10px -1px rgba(234, 179, 8, 0.35), 0 0 24px 0 rgba(234, 179, 8, 0.35)',
        'gold-glow-hover': '0 10px 35px -2px rgba(234, 179, 8, 0.85), 0 0 35px 4px rgba(234, 179, 8, 0.5)',
        'amber-glow': '0 4px 20px -2px rgba(245, 158, 11, 0.5), 0 2px 8px -1px rgba(245, 158, 11, 0.3)',
        'rose-glow': '0 4px 20px -2px rgba(244, 63, 94, 0.55), 0 2px 8px -1px rgba(244, 63, 94, 0.35)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}

