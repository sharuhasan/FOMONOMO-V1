import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
        },
        border: 'hsl(var(--border))',
        coral: 'hsl(var(--coral))',
        purple: 'hsl(var(--purple))',
        teal: 'hsl(var(--teal))',
        orange: 'hsl(var(--orange))',
        yellow: 'hsl(var(--yellow))',
        blue: 'hsl(var(--blue))',
        pink: 'hsl(var(--pink))',
      },
      fontFamily: {
        display: ['LobsterTwo-Regular'],
        'display-bold': ['LobsterTwo-Bold'],
        body: ['Nunito-Regular'],
        'body-semibold': ['Nunito-SemiBold'],
        'body-bold': ['Nunito-Bold'],
        'body-extrabold': ['Nunito-ExtraBold'],
      },
    },
  },
  plugins: [],
} satisfies Config;
