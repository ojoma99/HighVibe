import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#020817",
        foreground: "#E5F0FF",
        accent: {
          DEFAULT: "#7C3AED",
          soft: "#A855F7"
        }
      },
      boxShadow: {
        aura: "0 0 40px rgba(124,58,237,0.55)"
      }
    }
  },
  plugins: []
};

export default config;

