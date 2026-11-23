/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        appBg: "#F1F3F5",
        card: "#FFFFFF",
        elevated: "#F7F9FB",
        line: "#E3E7EB",
        primary: "#3F566E",
        secondary: "#6F8FAE",
        risk: "#D9917F",
        warning: "#E0C492",
        textPrimary: "#2C3640",
        textSecondary: "#76828E"
      },
      boxShadow: {
        panel: "0 1px 2px rgba(44, 54, 64, 0.06)",
        glow: "0 1px 2px rgba(44, 54, 64, 0.06)"
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(22px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseGrid: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" }
        }
      },
      animation: {
        rise: "rise 0.65s ease-out forwards",
        pulseGrid: "pulseGrid 2.4s ease-in-out infinite"
      },
      fontFamily: {
        display: ['"Aptos Display"', '"Segoe UI Variable Display"', "sans-serif"],
        sans: ['"Aptos"', '"Segoe UI Variable Text"', "sans-serif"]
      }
    }
  },
  plugins: []
};
