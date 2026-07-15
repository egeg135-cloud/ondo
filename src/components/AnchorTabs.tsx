// 스티키 앵커 탭 — 섹션 점프 + 현재 위치 하이라이트 (트레바리 탭 패턴)
import { useEffect, useState } from 'react'

const TABS: { id: string; label: string }[] = [
  { id: 'intro', label: '소개' },
  { id: 'why-ondo', label: '왜 ONDO' },
  { id: 'reviews', label: '후기' },
  { id: 'price', label: '가격' },
  { id: 'faq', label: 'FAQ' },
]

export function AnchorTabs() {
  const [active, setActive] = useState<string>('intro')

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        // 화면에 들어온 섹션 중 가장 위의 것을 활성으로
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -60% 0px' },
    )
    TABS.forEach((t) => {
      const el = document.getElementById(t.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="sticky top-[86px] z-20 -mx-4 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="flex overflow-x-auto px-4 gap-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => jump(t.id)}
            className={
              'shrink-0 px-3 py-3 text-sm font-semibold border-b-2 transition-colors ' +
              (active === t.id
                ? 'text-gray-900 border-gray-900'
                : 'text-gray-400 border-transparent')
            }
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
