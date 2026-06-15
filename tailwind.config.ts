import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        line: "#E6E2DA",
        paper: "#FAF8F3",
        brand: {
          50: "#FFF4E6",
          100: "#FFE0B8",
          500: "#C86A1D",
          600: "#9F4E14",
          900: "#3A2417"
        },
        mint: {
          100: "#DFF4EA",
          700: "#1F6F55"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(21, 21, 21, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
