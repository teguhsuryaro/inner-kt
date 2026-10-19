import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        brand: {
          dark: "#0F172A",
          accent: "#2563EB",
          subtle: "#F8FAFC",
          border: "#E2E8F0",
        },
        owner: {
          surya: {
            bg: "#EEF2FF",
            text: "#4338CA",
            border: "#C7D2FE",
            accent: "#4F46E5",
          },
          b: {
            bg: "#F0FDFA",
            text: "#0F766E",
            border: "#99F6E4",
            accent: "#0D9488",
          },
          c: {
            bg: "#FFFBEB",
            text: "#B45309",
            border: "#FDE68A",
            accent: "#D97706",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
