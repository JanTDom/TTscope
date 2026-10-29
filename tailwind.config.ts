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
        orlen: {
          red: "#d32f2f",
          darkRed: "#9a0007",
          gray: "#2c3437",
        },
        spark: {
          routine: "oklch(0.68 0.14 150)", // szmaragd
          monitored: "oklch(0.75 0.16 85)", // bursztyn
          sparks: "oklch(0.65 0.20 40)",    // oranż
          critical: "oklch(0.60 0.24 25)",  // szkarłat
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
    },
  },
  plugins: [],
};

export default config;
