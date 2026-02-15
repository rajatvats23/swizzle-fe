/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0da04d',
          dark: '#0a803d',
          light: '#e7f6ed',
        },
        error: '#ef4444',
        success: '#0da04d',
        info: '#333333',
        background: {
          light: '#f6f8f7',
          dark: '#102218',
        },
        text: {
          primary: '#111814',
          secondary: '#618973',
        },
      },
      fontFamily: {
        display: ['Work Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        'primary': '0 10px 15px -3px rgba(13, 160, 77, 0.2)',
      },
    },
  },
  plugins: [],
}