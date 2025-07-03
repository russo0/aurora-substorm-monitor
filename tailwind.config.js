/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        auroraGreen: '#32FF8F',
        auroraPurple: '#9D00FF',
        auroraDark: '#0B1C24',
      },
    },
  },
  plugins: [],
}
