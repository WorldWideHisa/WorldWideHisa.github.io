/** @type {import('tailwindcss').Config} */
export default {
  content: ["pages/**/*.vue", "content/**/*.md"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};
