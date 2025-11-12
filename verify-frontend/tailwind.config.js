import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Define our new, soothing color palette
      colors: {
        // Status Colors from your brief
        verified: '#B0DC87',
        questionable: '#F3E788',
        disputed: '#DF8D8D',

        // Brand/UI Colors
        background: colors.slate[50],
        foreground: colors.slate[900],
        card: colors.white,
        'card-foreground': colors.slate[900],
        muted: colors.slate[500],
        'muted-foreground': colors.slate[600],
        primary: colors.blue[600],
        'primary-foreground': colors.white,
      },
      // Define our custom fonts
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Mukta', 'sans-serif'],
      },
      // Define our entry animation
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}