/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        /** Marca Cuponía — #2097A9 */
        primary: {
          50: '#e8f6f8',
          100: '#d1eef2',
          200: '#a3dde4',
          300: '#75ccd3',
          400: '#47bbc2',
          500: '#2aa4b3',
          600: '#2097A9',
          700: '#1a7a89',
          800: '#166b78',
          900: '#0f4d57',
        },
      },
      boxShadow: {
        'card': '0 1px 2px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px rgb(0 0 0 / 0.06)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'float': {
          '0%': { transform: 'translateY(2px)' },
          '50%': { transform: 'translateY(-3px)' },
          '100%': { transform: 'translateY(1px)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out both',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'float': 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
