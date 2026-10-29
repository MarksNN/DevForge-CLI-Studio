/** @type {import('tailwindcss').Config} */
export default {
  // Explicitly disable media-query dark mode; default strictly to light mode styles
  darkMode: ['selector', '[data-theme="never-dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FAF8F5',
        surface: '#FFFDF9',
        recessed: '#F3EFE6',
        line: '#E5E0D8',
        neon: {
          blue: '#0284C7',
          gold: '#B45309',
          pink: '#E11D74',
          red: '#B83314',
          gray: '#57534E',
        },
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
