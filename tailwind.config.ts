import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.08)",
        "glass-lg": "0 16px 48px rgba(0, 0, 0, 0.1)",
        "glass-dark": "0 8px 32px rgba(0, 0, 0, 0.35)",
      },
      transitionDuration: {
        250: "250ms",
        350: "350ms",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "spring-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "orb-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(4%, -3%) scale(1.06)" },
          "66%": { transform: "translate(-3%, 4%) scale(0.96)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.55" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "xp-pop": {
          "0%": { opacity: "0", transform: "scale(0.88) translateY(16px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "level-celebrate": {
          "0%": { opacity: "0", transform: "scale(0.75)" },
          "55%": { opacity: "1", transform: "scale(1.08)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "xp-glow": {
          "0%, 100%": { boxShadow: "0 0 40px rgba(251, 191, 36, 0.35)" },
          "50%": { boxShadow: "0 0 72px rgba(251, 191, 36, 0.55)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.45s ease-out forwards",
        "spring-up": "spring-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "float-slow": "float 8s ease-in-out infinite",
        "orb-drift": "orb-drift 22s ease-in-out infinite",
        "pulse-soft": "pulse-soft 5s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
        "xp-pop": "xp-pop 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "level-celebrate": "level-celebrate 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "xp-glow": "xp-glow 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
