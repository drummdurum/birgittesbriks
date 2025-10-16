/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'sage-green': '#a4c3a2',
        'dark-gray': '#7a7a7a',
        'light-gray': '#f5f5f5',
        'medium-gray': '#666',
      },
      fontFamily: {
        'sans': ['Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

