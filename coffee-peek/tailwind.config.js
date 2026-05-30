/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#EAB308",
          hover: "#FACC15",
          dark: "#CA8A04",
          light: "#FEF3C7",
        },
        "gold-warm": {
          DEFAULT: "#D4A84B",
          hover: "#B68A2E",
          soft: "#F8F1DD",
        },
        background: {
          light: "#FAFAF9",
          dark: "#1A1412",
        },
        surface: {
          white: "#FFFFFF",
          dark: "#2D241F",
        },
        text: {
          main: "#1C1917",
          muted: "#78716C",
        },
        border: {
          light: "#E7E5E4",
          dark: "#3D2F28",
        },
      },
      fontFamily: {
        display: ["RF Dewi Expanded", "Sora", "sans-serif"],
        body: ["Noto Sans", "Inter", "sans-serif"],
      },
      letterSpacing: {
        wordmark: "-0.045em",
        hero: "-0.01em",
        heading: "-0.02em",
      },
      lineHeight: {
        hero: "0.92",
        stamp: "0.84",
      },
    },
  },
  safelist: [
    // Dynamic bg classes from getThemeClasses (hex arbitrary values)
    'bg-[#1A1412]', 'bg-[#2D241F]', 'bg-[#3D2F28]',
    'bg-[#FAFAF9]', 'bg-[#FFFFFF]', 'bg-[#F9F8F6]', 'bg-[#F3F4F6]',
    'bg-[#EAB308]', 'bg-[#FACC15]',
    // With opacity
    'bg-[#1A1412]/90', 'bg-[#FAFAF9]/90', 'bg-[#2D241F]/60',
    'bg-[#EAB308]/10', 'bg-[#EAB308]/5',
    // Hover bg
    'hover:bg-[#FACC15]', 'hover:bg-[#3D2F28]',
    // Dynamic text classes
    'text-[#FFFFFF]', 'text-[#A39E93]', 'text-[#A8A8A8]', 'text-[#5C544F]',
    'text-[#1C1917]', 'text-[#78716C]', 'text-[#75706B]', 'text-[#6B7280]',
    'text-[#EAB308]', 'text-[#1A1412]',
    // Hover text
    'hover:text-[#EAB308]', 'hover:text-[#FFFFFF]',
    // Dynamic border classes
    'border-[#3D2F28]', 'border-[#4A3D35]',
    'border-[#E7E5E4]', 'border-[#E5E1DA]', 'border-[#D1D5DB]',
    'border-[#EAB308]',
    // With opacity
    'border-[#EAB308]/30', 'border-[#EAB308]/20',
    // Hover border
    'hover:border-[#EAB308]', 'hover:border-[#EAB308]/30',
    // Focus ring
    'focus:ring-[#EAB308]/10', 'focus:ring-[3px]',
  ],
  plugins: [],
  darkMode: 'class',
}





