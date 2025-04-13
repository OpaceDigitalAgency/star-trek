/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'starfleet-blue': '#004C99',
        'starfleet-red': '#CB2400',
        'starfleet-gold': '#E6B800',
        'klingon-red': '#9A1515',
        'space-black': '#080C14',
        'console-green': '#1EFF86',
        'console-blue': '#00B2FF',
      },
      fontFamily: {
        'lcars': ['LCARS', 'sans-serif'],
        'trek': ['Federation', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 178, 255, 0.7), 0 0 20px rgba(0, 178, 255, 0.5), 0 0 30px rgba(0, 178, 255, 0.3)',
        'console': '0 0 5px rgba(30, 255, 134, 0.7), 0 0 10px rgba(30, 255, 134, 0.5)',
      },
      backgroundImage: {
        'space-gradient': 'linear-gradient(to bottom, #0F2027, #203A43, #2C5364)',
        'lcars-gradient': 'linear-gradient(to right, #EC9700, #FFC252)',
      }
    },
  },
  plugins: [],
}