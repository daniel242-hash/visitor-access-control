/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // ✅ Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F7F6',
          100: '#CCEFED',
          200: '#99DFDB',
          300: '#66CFC9',
          400: '#33BFB7',
          500: '#1A8B87',
          600: '#0F5F5C',
          700: '#0C4C49',
          800: '#093936',
          900: '#062623',
        },
        accent: {
          50: '#E6FFF9',
          100: '#CCFFF3',
          200: '#99FFE7',
          300: '#66FFDB',
          400: '#33FFCF',
          500: '#00E5B0',
          600: '#00D9A3',
          700: '#00B386',
          800: '#008D69',
          900: '#00664C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}