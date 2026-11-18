/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zoho: {
          blue: "#0070ba",
          red: "#f15a24",
          green: "#009688",
          dark: "#1e293b",
        }
      }
    },
  },
  plugins: [],
}
