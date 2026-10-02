/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050505', // Deep Black canvas background
          900: '#0c0c0e', // Near-Black box/card background
          850: '#121215', // Sub-box / active tab background
          800: '#18181c', // Inner container / secondary box
          700: '#232328', // Subtle border & dividers
          600: '#059669', // Deep emerald accent
          500: '#10b981', // Modern vibrant green
          400: '#34d399', // Bright emerald hover
        },
        slate: {
          950: '#030303',
          900: '#ffffff', // Crisp white headings
          800: '#f9fafb',
          700: '#f3f4f6',
          600: '#9ca3af', // Muted gray secondary text
          500: '#6b7280',
          400: '#9ca3af',
          300: '#d1d5db',
          200: '#e5e7eb',
          100: '#f3f4f6',
          50: '#fafafa',
        },
        cyan: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        blue: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        sky: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        brand: {
          cyan: '#10b981', // Modern vibrant green
          indigo: '#059669', // Deep emerald green
          violet: '#047857', // Forest green
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(16, 185, 129, 0.35)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.45)',
        'glow-indigo': '0 0 25px -5px rgba(5, 150, 105, 0.4)',
        card: '0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 4px 10px -2px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
