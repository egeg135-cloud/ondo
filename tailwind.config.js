/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#FFFFFF',  // main bg / text-on-black-buttons
        surface: '#F9FAFB',   // elevated surface — gray-50
        muted: '#6B7280',     // secondary text — gray-500
        cream: '#111827',     // primary text — gray-900
        navy: '#111827',      // same as cream (light-bg contexts)
        offwhite: '#F9FAFB',  // modal bg — gray-50
        sand: '#111827',      // CTA bg → black, text → near-black
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
