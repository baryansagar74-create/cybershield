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
        // Glossy color mix accents
        neon: {
          teal: '#12D8C4',
          pink: '#FF3D8B',
          orange: '#FF9F2E',
          purple: '#7A4DFF',
          emerald: '#3DDC97',
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': '0.75rem',    // 12px
        'xs': '0.8125rem',   // 13px
        'sm': '0.875rem',    // 14px
        'base': '1rem',      // 16px
        'lg': '1.25rem',     // 20px
        'xl': '1.5rem',      // 24px
        '2xl': '2rem',       // 32px
        '3xl': '2.25rem',
      },
      borderRadius: {
        'input': '12px',
        'chip': '999px',
        'panel': '20px',
        'modal': '24px',
        'dial': '22px',
      },
      boxShadow: {
        'glow-teal': '0 8px 30px rgba(18, 216, 196, 0.45)',
        'glow-pink': '0 10px 30px rgba(255, 61, 139, 0.55)',
        'glow-orange': '0 10px 30px rgba(255, 159, 46, 0.45)',
        'glow-purple': '0 10px 30px rgba(122, 77, 255, 0.45)',
        'glass': '0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4)',
      },
    },
  },
  plugins: [],
}
