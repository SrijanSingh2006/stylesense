import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfcf9',
          100: '#faf9f6',
          200: '#f3f1ea',
          300: '#e7e4d8',
          400: '#cfc9b6',
        },
        charcoal: {
          900: '#111213',
          800: '#1c1e21',
          700: '#2b2e33',
          600: '#43474f',
          500: '#646973',
          400: '#9196a1',
        },
        brand: {
          DEFAULT: '#144233', // Editorial forest emerald
          dark: '#0c2c22',
          light: '#235f4b',
          muted: '#e8efe9',
          accent: '#c8a27a', // Warm champagne gold
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
} satisfies Config
