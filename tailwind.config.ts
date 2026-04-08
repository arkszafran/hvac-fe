import type { Config } from 'tailwindcss';

const config = {
  theme: {
    extend: {
      colors: {
        background: 'oklch(0.983 0.003 264)',
        surface: 'oklch(0.998 0.001 264)',
        'surface-muted': 'oklch(0.973 0.004 264)',
        'text-main': 'oklch(0.255 0.01 264)',
        'text-muted': 'oklch(0.557 0.012 264)',
        border: 'oklch(0.904 0.006 264)',
        primary: 'oklch(0.6 0.168 258)',
        'primary-strong': 'oklch(0.556 0.171 258)',
        'primary-soft': 'oklch(0.953 0.024 258)',
        accent: 'oklch(0.627 0.144 240)',
        'accent-strong': 'oklch(0.575 0.15 240)',
        'accent-soft': 'oklch(0.948 0.022 240)',
        success: 'oklch(0.69 0.108 161)',
        'success-soft': 'oklch(0.964 0.026 161)',
        warning: 'oklch(0.799 0.102 74)',
        'warning-soft': 'oklch(0.974 0.026 74)',
        danger: 'oklch(0.636 0.17 25)',
        'danger-soft': 'oklch(0.963 0.032 25)',
        info: 'oklch(0.647 0.117 245)',
        'info-soft': 'oklch(0.958 0.021 245)',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        display: ['1.875rem', { lineHeight: '2.25rem', fontWeight: '600' }],
        h1: ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        h2: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        h3: ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.625rem', fontWeight: '500' }],
        body: ['0.875rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        small: ['0.75rem', { lineHeight: '1.125rem', fontWeight: '400' }],
        label: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
      },
      borderRadius: {
        xl: '1.125rem',
        '2xl': '1.5rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        card: '0 24px 60px -36px rgb(15 23 42 / 0.24), 0 8px 18px -14px rgb(15 23 42 / 0.14), inset 0 1px 0 rgb(255 255 255 / 0.72)',
        floating:
          '0 34px 90px -42px rgb(15 23 42 / 0.3), 0 14px 32px -24px rgb(15 23 42 / 0.18), inset 0 1px 0 rgb(255 255 255 / 0.72)',
      },
      screens: {
        md: '48rem',
        lg: '64rem',
      },
    },
  },
} satisfies Config;

export default config;
