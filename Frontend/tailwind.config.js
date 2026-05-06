/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bgPrimary: '#080F1F',
        bgSecondary: '#0D1B2A',
        bgTertiary: '#1A2744',
        accent: '#00F0FF',
        accentDark: '#007A90',
        highlight: '#E94560',
        textMain: '#F8FAFC',
        textMuted: '#94A3B8',
        textDim: '#475569',
        success: '#10B981',
        warning: '#F59E0B',
        critical: '#EF4444',
        purple: '#8B5CF6',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
      },
    },
  },
  plugins: [],
}
