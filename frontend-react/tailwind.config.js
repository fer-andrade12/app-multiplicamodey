/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfeff',
          100: '#cffafe',
          500: '#0f766e',
          600: '#0d5f59',
          700: '#0b4c47'
        },
        success: '#16a34a',
        danger: '#ef4444',
        ink: '#0f172a',
        mist: '#f8fafc',
        sand: '#fff7ed'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(17,24,39,0.08)'
      },
      borderRadius: {
        '3xl': '1.5rem'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.7s ease-out forwards',
        'float-slow': 'float 6s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
