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
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          muted: "var(--surface-muted)",
          border: "var(--surface-border)",
        },
        brand: {
          cyan: "#00e5ff",
          blue: "#0284c7",
          navy: "#061124",
          glow: "rgba(0, 229, 255, 0.25)",
        },
        orlen: {
          red: "#e11d48",
          darkRed: "#9f1239",
          gray: "#1e293b",
        },
        spark: {
          routine: "oklch(0.72 0.16 165)", // szmaragdowo-turkusowy
          monitored: "oklch(0.75 0.16 85)", // bursztyn
          sparks: "oklch(0.68 0.20 45)",    // oranż
          critical: "oklch(0.62 0.24 25)",  // szkarłat
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      keyframes: {
        flowPulse: {
          "0%": { strokeDashoffset: "24" },
          "100%": { strokeDashoffset: "0" },
        },
        radarSweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "flow-pulse": "flowPulse 1.4s linear infinite",
        "radar-sweep": "radarSweep 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
