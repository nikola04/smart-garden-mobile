const colors = require('./constants/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './app/**/*.{js,ts,tsx}', './navigation/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
        colors: {
            'background': colors.background,
            'background-alt': colors.backgroundAlt,
            'foreground': colors.foreground,
            'primary': colors.primary,
        }
    },
  },
  plugins: [],
};
