import type { Config } from 'tailwindcss';

/**
 * Os valores brutos vivem em app/globals.css como custom properties.
 * Aqui apenas os expomos ao Tailwind — uma única fonte da verdade.
 * Ver docs/STYLE_GUIDE.md §2 e §3.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-line': 'var(--accent-line)',
        hairline: 'var(--hairline)',
        glass: 'var(--glass)',
        'glass-edge': 'var(--glass-edge)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        sans: 'var(--font-ui)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        /**
         * Escala própria da primeira tela.
         *
         * O teto é mais baixo que o do `display-xl` porque aqui a headline
         * divide a largura com a fotografia. E o piso é baixo de propósito:
         * ele só entra abaixo de ~293px de tela, onde um piso confortável
         * faria a linha mais longa ("e a calma existe") quebrar em duas e
         * desmontar o ritmo de três linhas. Verificado de 320px a 1920px.
         */
        'display-hero': ['clamp(1.9rem, 10.4vw, 4.9rem)', { lineHeight: '0.94', letterSpacing: '-0.035em', fontWeight: '500' }],
        'display-xl': ['clamp(3rem, 7.2vw, 6.75rem)', { lineHeight: '0.92', letterSpacing: '-0.035em', fontWeight: '500' }],
        'display-l': ['clamp(2.5rem, 6.5vw, 6rem)', { lineHeight: '0.96', letterSpacing: '-0.03em', fontWeight: '500' }],
        'display-m': ['clamp(2rem, 4.5vw, 3.75rem)', { lineHeight: '1.02', letterSpacing: '-0.025em', fontWeight: '500' }],
        'body-l': ['clamp(1.0625rem, 1.35vw, 1.375rem)', { lineHeight: '1.6', letterSpacing: '-0.005em' }],
        'body-m': ['1rem', { lineHeight: '1.65' }],
        label: ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.18em', fontWeight: '500' }],
      },
      spacing: {
        gutter: 'var(--gutter)',
        margin: 'var(--margin-x)',
      },
      maxWidth: {
        content: '1440px',
        measure: '62ch',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        cine: 'cubic-bezier(0.65, 0, 0.35, 1)',
        'out-soft': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'in-quiet': 'cubic-bezier(0.55, 0, 1, 0.45)',
      },
      transitionDuration: {
        micro: '120ms',
        fast: '240ms',
        base: '480ms',
        slow: '800ms',
        cine: '1400ms',
      },
    },
  },
  plugins: [],
};

export default config;
