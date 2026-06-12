import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        tech: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        ink: {
          DEFAULT: "#1f2937",
          soft: "#4b5563",
          mute: "#9ca3af",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(16 24 40 / 0.06), 0 1px 3px rgb(16 24 40 / 0.10)",
        lift: "0 8px 24px rgb(16 24 40 / 0.12)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #10b981 0%, #2563eb 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, #ecfdf5 0%, #eff6ff 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
