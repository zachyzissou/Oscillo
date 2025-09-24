import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'
import plugin from 'tailwindcss/plugin'

const neonUtilities = plugin(({ addUtilities }) => {
  addUtilities({
    '.text-shadow-neon': {
      textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
    },
    '.backdrop-blur-glass': {
      backdropFilter: 'blur(20px) saturate(180%)',
    },
    '.glass-morphism': {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
    },
  })
})

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          foreground: 'hsl(var(--surface-contrast))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        neon: {
          cyan: 'hsl(var(--neon-cyan))',
          pink: 'hsl(var(--neon-pink))',
          green: 'hsl(var(--neon-green))',
          purple: 'hsl(var(--neon-purple))',
          orange: 'hsl(var(--neon-orange))',
          blue: 'hsl(var(--neon-blue))',
          violet: 'hsl(var(--neon-violet))',
        },
        glass: {
          white: 'var(--glass-white)',
          dark: 'var(--glass-dark)',
          backdrop: 'var(--glass-backdrop)',
        },
        oscillo: {
          bg: 'hsl(var(--oscillo-bg))',
          surface: 'hsl(var(--oscillo-surface))',
          accent: 'hsl(var(--oscillo-accent))',
          secondary: 'hsl(var(--oscillo-secondary))',
          warning: 'hsl(var(--oscillo-warning))',
          danger: 'hsl(var(--oscillo-danger))',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-geist-mono)', ...defaultTheme.fontFamily.mono],
        display: ['var(--font-orbitron)', ...defaultTheme.fontFamily.sans],
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        float: 'float 6s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        liquid: 'liquid 10s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          from: {
            textShadow: '0 0 20px #4ade80, 0 0 30px #4ade80, 0 0 40px #4ade80',
          },
          to: {
            textShadow: '0 0 10px #4ade80, 0 0 20px #4ade80, 0 0 30px #4ade80',
          },
        },
        'pulse-neon': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)',
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 40px rgba(74, 222, 128, 0.8)',
          },
        },
        'gradient-x': {
          '0%, 100%': {
            backgroundSize: '200% 200%',
            backgroundPosition: 'left center',
          },
          '50%': {
            backgroundSize: '200% 200%',
            backgroundPosition: 'right center',
          },
        },
        'gradient-y': {
          '0%, 100%': {
            backgroundSize: '400% 400%',
            backgroundPosition: 'center top',
          },
          '50%': {
            backgroundSize: '200% 200%',
            backgroundPosition: 'center bottom',
          },
        },
        'gradient-xy': {
          '0%, 100%': {
            backgroundSize: '400% 400%',
            backgroundPosition: 'left center',
          },
          '25%': {
            backgroundSize: '400% 400%',
            backgroundPosition: 'right center',
          },
          '50%': {
            backgroundSize: '400% 400%',
            backgroundPosition: 'center bottom',
          },
          '75%': {
            backgroundSize: '400% 400%',
            backgroundPosition: 'center top',
          },
        },
        liquid: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cyber-grid': `
          linear-gradient(rgba(74, 222, 128, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(74, 222, 128, 0.1) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        grid: '20px 20px',
      },
      boxShadow: {
        neon: '0 0 20px rgba(74, 222, 128, 0.5)',
        'neon-lg': '0 0 40px rgba(74, 222, 128, 0.8)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [
    forms({
      strategy: 'class',
    }),
    typography,
    neonUtilities,
  ],
} satisfies Config
