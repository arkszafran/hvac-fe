import type { Config } from 'tailwindcss';

const config = {
  theme: {
    extend: {
      colors: {
        brand: 'oklch(0.42 0.07 245)',
        action: 'oklch(0.58 0.11 220)',
        'action-contrast': 'oklch(0.555 0.11 220)',
        'action-hover': 'oklch(0.51 0.115 220)',
        'action-soft': 'oklch(0.968 0.018 220)',
        background: 'oklch(0.975 0.004 240)',
        surface: 'oklch(1 0 0)',
        'surface-muted': 'oklch(0.965 0.006 245)',
        'text-main': 'oklch(0.28 0.02 250)',
        'text-secondary': 'oklch(0.58 0.015 250)',
        'text-muted': 'oklch(0.54 0.015 250)',
        border: 'oklch(0.92 0.008 250)',

        // Compatibility aliases used by the existing UI layer.
        primary: 'oklch(0.42 0.07 245)',
        'primary-strong': 'oklch(0.35 0.065 245)',
        'primary-soft': 'oklch(0.968 0.018 220)',
        accent: 'oklch(0.58 0.11 220)',
        'accent-strong': 'oklch(0.51 0.115 220)',
        'accent-soft': 'oklch(0.968 0.018 220)',

        success: 'oklch(0.48 0.105 155)',
        'success-soft': 'oklch(0.94 0.05 155)',
        warning: 'oklch(0.52 0.11 75)',
        'warning-soft': 'oklch(0.96 0.045 75)',
        progress: 'oklch(0.52 0.095 300)',
        'progress-soft': 'oklch(0.95 0.04 300)',
        danger: 'oklch(0.62 0.2 25)',
        'danger-soft': 'oklch(0.97 0.025 25)',
        info: 'oklch(0.51 0.115 220)',
        'info-soft': 'oklch(0.95 0.035 220)',
      },
      fontFamily: {
        sans: ['Geist Variable', 'Geist', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['Geist Mono Variable', 'Geist Mono', 'Cascadia Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        display: [
          '2.75rem',
          { lineHeight: '3.25rem', fontWeight: '600', letterSpacing: '-0.03em' },
        ],
        h1: ['1.875rem', { lineHeight: '2.25rem', fontWeight: '600', letterSpacing: '-0.025em' }],
        h2: ['1.03125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        h3: ['1rem', { lineHeight: '1.375rem', fontWeight: '600' }],
        'body-lg': ['1.03125rem', { lineHeight: '1.625rem', fontWeight: '400' }],
        body: ['0.875rem', { lineHeight: '1.375rem', fontWeight: '400' }],
        small: ['0.78125rem', { lineHeight: '1.125rem', fontWeight: '400' }],
        label: ['0.78125rem', { lineHeight: '1.125rem', fontWeight: '600' }],
        kicker: [
          '0.65625rem',
          { lineHeight: '0.875rem', fontWeight: '600', letterSpacing: '0.08em' },
        ],
        mono: ['0.84375rem', { lineHeight: '1.25rem', fontWeight: '400' }],
      },
      spacing: {
        'ds-1': '0.25rem',
        'ds-2': '0.4375rem',
        'ds-3': '0.625rem',
        'ds-4': '0.875rem',
        'ds-5': '1.25rem',
        'ds-6': '2rem',
        'ds-7': '3.5rem',
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
      },
      borderRadius: {
        button: '0.6875rem',
        field: '0.75rem',
        card: '1rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1rem',
      },
      boxShadow: {
        card: '0 0 0 0 transparent',
        floating: '0 18px 48px -24px rgb(32 43 54 / 0.22)',
      },
      screens: {
        md: '48rem',
        lg: '64rem',
      },
    },
  },
} satisfies Config;

export default config;
