/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bgPrimary: '#1A1A2E',
        bgSecondary: '#16213E',
        accent: '#00F0FF',
        highlight: '#E94560',
        textMain: '#F8FAFC',
        textMuted: '#94A3B8',
        success: '#10B981',
        warning: '#F59E0B',
        critical: '#EF4444'
      }
    },
  },
  plugins: [],
}
