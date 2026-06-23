import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f8f5',
          600: '#9de9c7',  /* Primary deep green */
          700: '#16c079',
        },
        petal: {
          pink: '#E8A0BF', /* Accent color for Bougainvilleas */
          rose: '#C9184A', /* Vibrant accent for Rose bushes */
        },
        cream: '#FEFAE0',  /* Background base tint */
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config