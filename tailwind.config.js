/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#121212',
        card: '#1E1E1E',
        primary: '#3B82F6',
        warning: '#F59E0B',
        danger: '#EF4444',
        success: '#10B981'
      }
    },
  },
  plugins: [],
}