import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Architectural Obsidian Base Palette
        canvas: "#0F1210",
        "canvas-obsidian": "#0F1210",
        "canvas-graphite": "#141816",
        "canvas-slate": "#1A201D",
        surface: "#141816",
        "surface-elevated": "#1A201D",
        "surface-card": "#1E2522",
        "surface-overlay": "#222A26",

        // Information & Editorial Typography
        ivory: "#F4F0E8",
        parchment: "#D9D2C5",
        stone: "#6F7772",
        "muted-sage": "#77867C",

        // Spatial Accents (Mineral Deep Teal / Jade)
        "mineral-teal": "#176C68",
        "deep-jade": "#23847D",
        "teal-soft": "rgba(23, 108, 104, 0.15)",

        // Architectural Warm Accents (Oxidized Copper / Bronze)
        copper: "#B56E48",
        "copper-hover": "#A35E39",
        bronze: "#C47B50",
        "copper-soft": "rgba(181, 110, 72, 0.15)",

        // Architectural Hairline Borders
        "border-hairline": "rgba(244, 240, 232, 0.08)",
        "border-subtle": "rgba(244, 240, 232, 0.12)",
        "border-muted": "rgba(244, 240, 232, 0.18)",
        "border-copper": "rgba(181, 110, 72, 0.35)",
        "border-teal": "rgba(23, 108, 104, 0.35)",

        // Semantic Brand Alignment
        brand: {
          primary: "#B56E48",
          "primary-hover": "#A35E39",
          secondary: "#176C68",
          "secondary-light": "#23847D",
          "dark-neutral": "#0F1210",
          "medium-neutral": "#77867C",
          "glass-border": "rgba(244, 240, 232, 0.08)",
          "neutral-border": "rgba(244, 240, 232, 0.12)",
        },
        status: {
          connected: "#23847D",
          loading: "#176C68",
          unavailable: "#C47B50",
          error: "#C05646",
        },
      },
      borderRadius: {
        card: "14px",
        btn: "6px",
        tag: "4px",
        pill: "9999px",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        88: "22rem",
        100: "25rem",
        104: "26rem",
      },
      boxShadow: {
        architectural: "0 1px 3px rgba(0,0,0,0.5), 0 16px 40px -8px rgba(0,0,0,0.7)",
        copper: "0 2px 14px rgba(181, 110, 72, 0.25)",
        "copper-hover": "0 4px 22px rgba(181, 110, 72, 0.4)",
        teal: "0 2px 14px rgba(23, 108, 104, 0.25)",
        "glass-card": "0 12px 36px -4px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(244, 240, 232, 0.08)",
        "glass-card-hover": "0 16px 45px -4px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(181, 110, 72, 0.3)",
      },
      backgroundImage: {
        'copper-cta': 'linear-gradient(135deg, #C47B50 0%, #B56E48 100%)',
        'obsidian-gradient': 'linear-gradient(180deg, #0F1210 0%, #141816 50%, #1A201D 100%)',
        'subtle-vignette': 'radial-gradient(circle at 50% 30%, rgba(23,108,104,0.06) 0%, transparent 60%)',
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
