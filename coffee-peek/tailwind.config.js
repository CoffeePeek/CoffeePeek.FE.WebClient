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
          DEFAULT: "#B48C4B",
          hover: "#8E6F3A",
          light: "#F5EFE6",
        },
        background: {
          light: "#FCFBFA",
        },
        surface: {
          white: "#FFFFFF",
        },
        text: {
          main: "#2D2926",
          muted: "#6B6661",
        },
        border: {
          light: "#E8E4E1",
        },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Noto Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}





