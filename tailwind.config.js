/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './app/**/*.{js,ts,tsx}', './navigation/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
        colors: {
            background: '#fff',
            'background-alt': '#d8d5b5',
            primary: '#b7e570',
        }
    },
  },
  plugins: [],
};
