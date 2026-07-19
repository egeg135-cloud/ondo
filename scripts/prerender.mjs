// 빌드 후 프리렌더링 — dist를 로컬 서빙해 Puppeteer로 렌더된 HTML 스냅샷을 dist/index.html에 기록.
// 네이버(Yeti)·AI 크롤러는 JS를 실행하지 않으므로 본문이 정적 HTML에 있어야 색인된다.
// createRoot 기반이라 React가 로드되면 스냅샷 위를 통째로 교체 렌더 — hydration 충돌 없음.
// 실패해도 배포가 깨지지 않도록 package.json에서 `|| echo skipped`로 감싼다 (SPA 셸로 폴백).
import { preview } from 'vite'
import puppeteer from 'puppeteer'
import { writeFile } from 'node:fs/promises'

const server = await preview({ preview: { port: 4173, strictPort: true } })
let browser

try {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Vercel 빌드 컨테이너 대응
  })
  const page = await browser.newPage()
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0', timeout: 60000 })
  // 본문이 실제로 렌더됐는지 가드 — 블랭크 스냅샷(빈 키 함정 등) 배포 방지
  await page.waitForFunction(
    () => (document.getElementById('root')?.innerText ?? '').includes('러닝 메이트 매칭'),
    { timeout: 15000 },
  )
  const html = await page.content()
  if (!html.includes('자주 묻는 질문')) throw new Error('prerender guard: FAQ 본문 누락')
  await writeFile('dist/index.html', html)
  console.log(`prerender done: ${(html.length / 1024).toFixed(0)}KB`)
} finally {
  await browser?.close().catch(() => {})
  await new Promise((resolve) => server.httpServer.close(resolve))
}
