import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// index.html의 __NEXT_SESSION_DATE__를 다음 목요일(당일 포함) 날짜로 치환
// — Event 스키마 startDate 용. 배포(빌드) 시점 기준으로 계산된다.
function injectNextSessionDate(): Plugin {
  return {
    name: 'inject-next-session-date',
    transformIndexHtml(html) {
      const d = new Date()
      d.setDate(d.getDate() + ((4 - d.getDay() + 7) % 7))
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return html.replaceAll('__NEXT_SESSION_DATE__', `${yyyy}-${mm}-${dd}`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), injectNextSessionDate()],
})
