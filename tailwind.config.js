/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF7F2',
        paper: '#FFFFFF',
        ink: '#2A2826',
        muted: '#6E6862',
        line: '#E7E0D6',
        sage: { 50: '#EEF3EF', 100: '#DCE7DF', 300: '#A9BFAF', 500: '#7A9783', 700: '#4E6956', 800: '#3C5243' },
        blush: { 50: '#FBF0EC', 100: '#F4DED7', 300: '#E2B6AA', 600: '#A9645A', 700: '#8C4F46' },
        sand: { 100: '#F1E7D6', 300: '#DCC7A3' },
        alert: '#9E3B30',
      },
      fontFamily: {
        display: ['Gloock', 'Georgia', 'serif'],
        sans: ['Figtree', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: { card: '14px' },
      boxShadow: { soft: '0 1px 2px rgba(42,40,38,.04), 0 6px 20px -10px rgba(42,40,38,.12)' },
    },
  },
  plugins: [],
};
