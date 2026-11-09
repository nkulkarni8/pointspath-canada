/** @type {import('tailwindcss').Config} */
// Exposes the same spacing/radius/color tokens defined in src/theme.js as
// Tailwind theme extensions. Most of the six pages still use token-driven
// inline styles (lower risk given how deeply those are embedded today), but
// these utilities are available for new markup and incremental migration.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "20px",
        xl: "32px",
      },
      borderRadius: {
        sm: "8px",
        md: "11px",
        lg: "16px",
      },
      fontSize: {
        xs: ["11px", "1.4"],
        sm: ["13px", "1.5"],
        base: ["14px", "1.5"],
        lg: ["17px", "1.4"],
        xl: ["23px", "1.3"],
        "2xl": ["28px", "1.25"],
        "3xl": ["34px", "1.2"],
      },
      colors: {
        dark: {
          bg: "#0C0A09", surface: "#1C1917", hover: "#292524",
          border: "#44403C", borderL: "#292524",
          text: "#FAFAF9", muted: "#A8A29E", dim: "#8F8984",
          accent: "#D9A441", gold: "#E3B454", green: "#4ADE80", warn: "#FBBF24",
        },
        light: {
          bg: "#FAFAF9", surface: "#FFFFFF", hover: "#F5F5F4",
          border: "#D6D3D1", borderL: "#E7E5E4",
          text: "#1C1917", muted: "#475569", dim: "#6B645F",
          accent: "#1C1917", gold: "#A16207", green: "#15803D", warn: "#B45309",
        },
      },
    },
  },
  plugins: [],
};
