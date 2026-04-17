/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    './App.{js,jsx,ts,tsx}',
    './index.{js,jsx,ts,tsx}',
    './global.css',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Surface Hierarchy ───────────────────────────────────────────
        'surface':                    '#faf9fd',
        'surface-bright':             '#faf9fd',
        'surface-dim':                '#dad9dd',
        'surface-container-lowest':   '#ffffff',
        'surface-container-low':      '#f4f3f7',
        'surface-container':          '#efedf1',
        'surface-container-high':     '#e9e7eb',
        'surface-container-highest':  '#e3e2e6',
        'surface-variant':            '#e3e2e6',
        // ── Primary (Deep Warm Brown) ────────────────────────────────────
        'primary':                    '#371800',
        'primary-container':          '#572900',
        'on-primary':                 '#ffffff',
        'on-primary-container':       '#e98633',
        'primary-fixed':              '#ffdcc5',
        'primary-fixed-dim':          '#ffb783',
        'on-primary-fixed':           '#301400',
        'on-primary-fixed-variant':   '#703700',
        'inverse-primary':            '#ffb783',
        'surface-tint':               '#944b00',
        // ── Secondary (Calm Blue) ────────────────────────────────────────
        'secondary':                  '#455f88',
        'secondary-container':        '#b6d0ff',
        'on-secondary':               '#ffffff',
        'on-secondary-container':     '#3f5882',
        'secondary-fixed':            '#d6e3ff',
        'secondary-fixed-dim':        '#adc7f7',
        'on-secondary-fixed':         '#001b3c',
        'on-secondary-fixed-variant': '#2d476f',
        // ── Tertiary (Calming Green) ─────────────────────────────────────
        'tertiary':                   '#002715',
        'tertiary-container':         '#003f25',
        'on-tertiary':                '#ffffff',
        'on-tertiary-container':      '#5caf81',
        'tertiary-fixed':             '#9ff5c1',
        'tertiary-fixed-dim':         '#83d8a6',
        'on-tertiary-fixed':          '#002111',
        'on-tertiary-fixed-variant':  '#005231',
        // ── On-Surface & Outlines ────────────────────────────────────────
        'background':                 '#faf9fd',
        'on-background':              '#1a1c1e',
        'on-surface':                 '#1a1c1e',
        'on-surface-variant':         '#43474e',
        'inverse-surface':            '#2f3033',
        'inverse-on-surface':         '#f1f0f4',
        'outline':                    '#74777f',
        'outline-variant':            '#c4c6cf',
        // ── Error ────────────────────────────────────────────────────────
        'error':                      '#ba1a1a',
        'error-container':            '#ffdad6',
        'on-error':                   '#ffffff',
        'on-error-container':         '#93000a',
      },
      borderRadius: {
        // The design system overrides (lg / xl become large pill-like curves)
        DEFAULT: '1rem',
        sm:      '0.5rem',
        md:      '1.5rem',
        lg:      '2rem',
        xl:      '3rem',
        full:    '9999px',
      },
    },
  },
  plugins: [],
};
