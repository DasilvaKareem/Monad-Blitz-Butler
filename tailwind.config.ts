import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary
        gold: {
          DEFAULT: "#C4A962",
          light: "#D4BC7A",
          dark: "#A89252",
        },
        // Neutral
        noir: "#0A0A0A",
        charcoal: "#1A1A1A",
        "gray-700": "#3A3A3A",
        "gray-600": "#4A4A4A",
        "gray-500": "#6A6A6A",
        "gray-400": "#8A8A8A",
        ivory: "#FAF7F0",
        cream: "#F5F2EB",
        // Accent
        bordeaux: {
          DEFAULT: "#722F37",
          light: "#8A3A44",
          dark: "#5A252C",
        },
        // Semantic
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        border: "var(--border)",
        "border-subtle": "var(--border-subtle)",
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        body: ["Inter", "Arial", "sans-serif"],
      },
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
        "5xl": "3rem",
        "6xl": "3.75rem",
        "7xl": "4.5rem",
      },
      fontWeight: {
        light: "300",
        regular: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      lineHeight: {
        tight: "1.1",
        snug: "1.25",
        normal: "1.5",
        relaxed: "1.625",
        loose: "2",
      },
      letterSpacing: {
        tighter: "-0.025em",
        normal: "0",
        wide: "0.025em",
        wider: "0.05em",
        widest: "0.1em",
        ultra: "0.2em",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
      },
      borderRadius: {
        none: "0",
        sm: "0.125rem",
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.5)",
        DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.5)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
        gold: "0 4px 14px 0 rgba(196, 169, 98, 0.25)",
        "gold-lg": "0 8px 24px 0 rgba(196, 169, 98, 0.35)",
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.5)",
      },
      transitionDuration: {
        fast: "150ms",
        DEFAULT: "200ms",
        slow: "300ms",
        slower: "500ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
        in: "cubic-bezier(0.4, 0, 1, 1)",
        out: "cubic-bezier(0, 0, 0.2, 1)",
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "gold-pulse": "goldPulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        goldPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(196, 169, 98, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(196, 169, 98, 0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
