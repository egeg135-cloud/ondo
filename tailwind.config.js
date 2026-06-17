/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ONDO 브랜드 컬러 (밝고 고급스러운 Quiet Luxury 톤)
        navy: '#1C3A5C', // 딥네이비 — 메인 텍스트/CTA
        sand: '#C9A87C', // 웜샌드 — 포인트
        offwhite: '#F5F0EB', // 오프화이트 — 배경
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
