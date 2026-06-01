/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0F0F1A',
          mid: '#1A1A2E',
          card: 'rgba(255,255,255,0.03)',
          cardHover: 'rgba(255,255,255,0.06)',
        },
        brand: {
          from: '#6366F1',
          to: '#8B5CF6',
          light: '#818CF8',
        },
        income: '#34D399',
        expense: '#F87171',
        invest: '#A78BFA',
        warn: '#FBBF24',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-bg': 'linear-gradient(180deg, #0F0F1A 0%, #1A1A2E 100%)',
        'gradient-brand': 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      },
    },
  },
  plugins: [],
}
