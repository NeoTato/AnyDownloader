/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        heading: ["Outfit", "system-ui", "sans-serif"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        playful: {
          cream: "#FFFDF5",
          dark: "#1E293B",
          card: "#FFFFFF",
          muted: "#F8FAFC",
          mutedBorder: "#E2E8F0",
          mutedFg: "#64748B",
          violet: "#8B5CF6",
          violetHover: "#7C3AED",
          pink: "#F472B6",
          yellow: "#FBBF24",
          mint: "#34D399",
          cyan: "#38BDF8",
          orange: "#FB923C",
          red: "#F87171",
        },
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
      },
      boxShadow: {
        "pop-sm": "2px 2px 0px 0px #1E293B",
        pop: "4px 4px 0px 0px #1E293B",
        "pop-hover": "6px 6px 0px 0px #1E293B",
        "pop-lg": "6px 6px 0px 0px #1E293B",
        "pop-xl": "8px 8px 0px 0px #1E293B",
        "pop-pink": "4px 4px 0px 0px #F472B6",
        "pop-violet": "4px 4px 0px 0px #8B5CF6",
        "pop-yellow": "4px 4px 0px 0px #FBBF24",
        "pop-mint": "4px 4px 0px 0px #34D399",
      },
      animation: {
        "bounce-subtle": "bounce-subtle 2s infinite",
        wiggle: "wiggle 0.3s ease-in-out",
      },
      keyframes: {
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(3deg)" },
          "75%": { transform: "rotate(-3deg)" },
        },
      },
    },
  },
  plugins: [],
};
