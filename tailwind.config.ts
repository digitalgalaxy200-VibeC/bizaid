import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        waide: {
          50:  "#f0f4ff",
          100: "#dde6ff",
          200: "#c0cfff",
          300: "#93afff",
          400: "#6085ff",
          500: "#3a5cff",
          600: "#1e37f5",
          700: "#1a2fe1",
          800: "#1c2bb6",
          900: "#1c2a8f",
          950: "#141b55",
        },
      },
    },
  },
  plugins: [],
};

export default config;
