/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#09090b",
          subtle: "#121215",
          panel: "#18181b",
          hover: "#222226",
        },
        border: {
          subtle: "#27272a",
          strong: "#3f3f46",
          focus: "#3b82f6",
        },
        zoho: {
          blue: "#0066cc",
          accent: "#2563eb",
          hover: "#1d4ed8",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
