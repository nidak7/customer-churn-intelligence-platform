/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        appBg: "#080B12",
        card: "#111827",
        elevated: "#172033",
        line: "#263244",
        primary: "#A3E635",
        secondary: "#38BDF8",
        risk: "#FB7185",
        warning: "#FBBF24",
        textPrimary: "#F8FAFC",
        textSecondary: "#94A3B8"
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(38, 50, 68, 0.45), 0 24px 60px rgba(3, 7, 18, 0.48)",
        glow: "0 0 0 1px rgba(163, 230, 53, 0.12), 0 18px 42px rgba(3, 7, 18, 0.45)"
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
