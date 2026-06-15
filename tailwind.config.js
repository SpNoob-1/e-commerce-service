/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // 👈 ¡Esto es lo que le faltaba a tu proyecto!
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
