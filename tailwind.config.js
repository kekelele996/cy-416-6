/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Aptos', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#17211b',
        moss: '#2f5d50',
        amberline: '#d8942f',
        cloud: '#f5f7f1',
      },
    },
  },
  plugins: [],
};
