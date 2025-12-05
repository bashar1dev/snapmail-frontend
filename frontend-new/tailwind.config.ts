import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf3',
          100: '#d1fae7',
          200: '#a7f3cf',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#0a8f62',
          700: '#0b6c4d',
          800: '#0f513b',
          900: '#0e3b2d'
        }
      },
      fontFamily: {
        sans: ['"Inter var"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Spline Sans Mono"', '"SFMono-Regular"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        card: '0 12px 40px rgba(15, 23, 42, 0.12)',
        soft: '0 6px 18px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
