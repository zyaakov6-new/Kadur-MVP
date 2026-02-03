/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#006400", // Deep Green Turf
        secondary: "#FFA500", // Orange
        dark: "#1a1a1a",
        light: "#f5f5f5",
      },
    },
  },
  plugins: [],
};
