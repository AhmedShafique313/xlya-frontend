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
        // Custom Texalya colors
        texalya: {
          orange: "#FFA548",
          gray: "#918C94",
          border: "#FEFEFE",
        },
      },
    },
  },
  plugins: [],
};

export default config;