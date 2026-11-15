/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        raised: 'var(--bg-raised)',
        sunken: 'var(--bg-sunken)',
        line: 'var(--line)',
        txt: 'var(--text)',
        'txt-muted': 'var(--text-muted)',
        teal: 'var(--brand-teal)',
        saffron: 'var(--brand-saffron)',
        'risk-high': 'var(--risk-high)',
        'risk-low': 'var(--risk-low)',
        evidence: 'var(--evidence)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': '0.75rem',    // 12px
        'xs': '0.8125rem',   // 13px
        'sm': '0.875rem',    // 14px
        'base': '1rem',      // 16px
        'lg': '1.25rem',     // 20px
        'xl': '1.5rem',      // 24px
        '2xl': '2rem',       // 32px
      },
      borderRadius: {
        'input': '4px',
        'chip': '4px',
        'panel': '8px',
        'modal': '12px',
        'dial': '12px',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
      },
      maxWidth: {
        'content': '1440px',
      },
    },
  },
  plugins: [],
}
