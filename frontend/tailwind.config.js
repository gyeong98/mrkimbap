/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#fbf9f3",
        "cream-100": "#ffffff",
        "cream-200": "#f1ece0",
        herb: {
          DEFAULT: "#eaf4ec",
          200: "#dcebdf",
        },
        forest: {
          DEFAULT: "#15503a",
          600: "#1c6b4a",
          500: "#238a5e",
          400: "#3fa877",
        },
        gold: {
          DEFAULT: "#e0982e",
          400: "#eeb44f",
          200: "#f7e2ad",
        },
        clay: "#d15b3b",
        ink: "#22271f",
        "ink-soft": "#5c6357",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Fraunces", "Georgia", "serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgba(34, 39, 31, 0.06), 0 8px 30px -6px rgba(34, 39, 31, 0.08)",
        lift: "0 20px 50px -18px rgba(21, 80, 58, 0.22)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
