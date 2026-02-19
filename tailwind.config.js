/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'Inter', 'sans-serif'],
      },
      colors: {
        fiverr: {
          green: '#1dbf73',
          'green-dark': '#19a463',
          'green-light': 'var(--fiverr-green-light, #c8f7dc)',
          dark: 'var(--section-bg, #1a1a2e)',
          darker: 'var(--page-bg, #0f0f1a)',
          card: 'var(--fiverr-card, #222236)',
          'card-hover': 'var(--fiverr-card-hover, #2a2a42)',
          border: 'var(--fiverr-border, #333355)',
          text: 'var(--fiverr-text, #f5f5f5)',
          'text-muted': 'var(--fiverr-text-muted, #95959c)',
          'text-dim': 'var(--fiverr-text-dim, #74747a)',
          yellow: 'var(--fiverr-yellow, #ffbe5b)',
          orange: 'var(--fiverr-orange, #ff8c00)',
          red: 'var(--fiverr-red, #ff4444)',
          blue: 'var(--fiverr-blue, #4a90d9)',
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'pulse-green': 'pulse-green 2s infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-green': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(29, 191, 115, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(29, 191, 115, 0)' },
        },
      },
    },
  },
  plugins: [],
}