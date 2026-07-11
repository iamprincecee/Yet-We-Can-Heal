import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        ember: "#FF4D3D",
        tidewater: "#0A6E6B",
        marigold: "#F4B400",
        plum: "#6A2C70",
        skyburst: "#2E6BE6",
        blush: "rgb(var(--color-blush) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        card: "1.25rem",
      },
      boxShadow: {
        card: "0 12px 40px -12px rgba(26,26,26,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
