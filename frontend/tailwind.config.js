/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FAFAF9",
        surface: "#FFFFFF",
        ink: {
          900: "#14181B",
          700: "#2B3238",
          500: "#5B6670",
          300: "#9AA4AB",
        },
        line: "#E6E8E6",
        brand: {
          50: "#ECFBF3",
          100: "#D4F5E2",
          200: "#A9EBC6",
          400: "#2FB673",
          500: "#188A54",
          600: "#0F6E42",
          700: "#0B5735",
        },
      },
      fontFamily: {
        sans: [
          "'Inter'",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "sans-serif",
        ],
        display: [
          "'Source Serif 4'",
          "'Georgia'",
          "serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 24, 27, 0.04), 0 1px 0 rgba(20, 24, 27, 0.03)",
        raised: "0 4px 16px rgba(20, 24, 27, 0.08)",
        modal: "0 24px 64px rgba(20, 24, 27, 0.24)",
      },
      borderRadius: {
        card: "10px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "slide-up": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
        "slide-up": "slide-up 0.22s ease-out",
      },
    },
  },
  plugins: [],
};
