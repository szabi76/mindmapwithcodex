/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f1419',
        edge: '#4a5568'
      }
    }
  },
  plugins: []
};
