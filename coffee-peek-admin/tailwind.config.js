/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#EAB308',
          hover: '#FACC15',
          dark: '#CA8A04',
          light: '#FEF3C7',
        },
        'gold-warm': {
          DEFAULT: '#D4A84B',
          hover: '#B68A2E',
          soft: '#F8F1DD',
        },
        background: {
          light: '#FAFAF9',
          dark: '#1A1412',
        },
        surface: {
          white: '#FFFFFF',
          dark: '#2D241F',
        },
        text: {
          main: '#1C1917',
          muted: '#78716C',
        },
        border: {
          light: '#E7E5E4',
          dark: '#3D2F28',
        },
        status: {
          pending: '#F59E0B',
          approved: '#10B981',
          rejected: '#EF4444',
        },
      },
      fontFamily: {
        display: ['RF Dewi Expanded', 'Sora', 'sans-serif'],
        body: ['Noto Sans', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
