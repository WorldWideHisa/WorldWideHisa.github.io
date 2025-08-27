/** @type {import('tailwindcss').Config} */
export default {
  content: ["pages/**/*.vue", "content/**/*.md"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Zen Maru Gothic"', "sans-serif"],
        heading: ['"Zen Maru Gothic"', "sans-serif"],
      },
      typography: {
        DEFAULT: {
          css: {
            fontFamily: '"Zen Maru Gothic", sans-serif',
            h1: {
              fontFamily: '"Zen Maru Gothic", sans-serif',
              fontWeight: "700",
            },
            h2: {
              fontFamily: '"Zen Maru Gothic", sans-serif',
              fontWeight: "700",
            },
            h3: {
              fontFamily: '"Zen Maru Gothic", sans-serif',
              fontWeight: "500",
            },
            h4: {
              fontFamily: '"Zen Maru Gothic", sans-serif',
              fontWeight: "500",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
