import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        action: "#0066cc",
        actionFocus: "#0071e3",
        skyLink: "#2997ff",
        canvas: "#ffffff",
        parchment: "#f5f5f7",
        ink: "#1d1d1f",
        hairline: "#e0e0e0",
        tile: "#272729"
      },
      fontFamily: {
        sans: ["SF Pro Text", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["SF Pro Display", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"]
      },
      borderRadius: {
        apple: "18px"
      }
    }
  },
  plugins: []
};

export default config;
