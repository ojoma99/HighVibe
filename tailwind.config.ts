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
        background: "#0c1222",
        foreground: "#E5F0FF",
        accent: {
          DEFAULT: "#8B5CF6",
          soft: "#A78BFA"
        }
      },
      boxShadow: {
        aura: "0 0 50px rgba(139,92,246,0.6)"
      }
    }
  },
  plugins: []
};

export default config;

