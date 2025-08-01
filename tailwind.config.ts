import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#05070a",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#00f0ff",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#00ff88",
          foreground: "#000000",
        },
        destructive: {
          DEFAULT: "#ff007c",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#0a0f1a",
          foreground: "#64748b",
        },
        accent: {
          DEFAULT: "#1a2332",
          foreground: "#00f0ff",
        },
        popover: {
          DEFAULT: "#05070a",
          foreground: "#00f0ff",
        },
        card: {
          DEFAULT: "#0a0f1a",
          foreground: "#00f0ff",
        },
        "hud-bg": "#05070a",
        "hud-primary": "#00f0ff",
        "hud-secondary": "#00ff88",
        "hud-accent": "#ff007c",
        "hud-border": "#1a2332",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px #00f0ff33",
            transform: "scale(1)",
          },
          "50%": {
            boxShadow: "0 0 30px #00f0ff77",
            transform: "scale(1.02)",
          },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        scanline: "scanline 3s linear infinite",
        flicker: "flicker 0.15s ease-in-out infinite alternate",
      },
      fontFamily: {
        futuristic: [
          "ui-monospace",
          "SFMono-Regular",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
