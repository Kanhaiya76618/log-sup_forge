/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#16224a",
        red: {
          DEFAULT: "#d62828",
          deep: "#a81e1e",
        },
        cream: {
          DEFAULT: "#faf4ec",
          deep: "#f3e9da",
        },
        sakura: {
          DEFAULT: "#efb0bc",
          soft: "#f7d3da",
        },
        gold: "#c8993f",
        "ink-soft": "#3a4571",
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["Hanken Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
