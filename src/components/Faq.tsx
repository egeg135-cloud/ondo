import { useState } from 'react'
import { FAQS, RELATED_ARTICLES } from '../constants/content'
import { analytics } from '../lib/analytics'

export function Faq() {
  const [open, setOpen] = useState<Set<number>>(new Set())

  function toggle(i: number) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else {
        next.add(i)
        analytics.faqOpen(FAQS[i].q)
      }
      return next
    })
  }

  return (
    <section id="faq" className="mt-14 scroll-mt-32">
      <h2 className="text-xl font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
      <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200 overflow-hidden">
        {FAQS.map((f, i) => (
          <div key={f.q}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between gap-3 text-left px-4 py-3.5 bg-white"
              aria-expanded={open.has(i)}
            >
              <span className="text-sm font-semibold text-gray-900">{f.q}</span>
              <span className={'text-gray-400 transition-transform ' + (open.has(i) ? 'rotate-180' : '')}>⌄</span>
            </button>
            {open.has(i) && (
              <div className="px-4 pb-4 -mt-1 bg-white">
                <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Related Articles — 인스타그램 카드뉴스 */}
      <div className="mt-8">
        <h3 className="text-sm font-bold text-gray-900 mb-3">더 읽어보기</h3>
        <p className="text-xs text-gray-400 mb-3">인스타그램(@ondo.pm)에서 카드뉴스로 볼 수 있어요.</p>
        <div className="space-y-2">
          {RELATED_ARTICLES.map((a) => (
            <a
              key={a.title}
              href={a.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 rounded-xl bg-[#F5F5F5] px-4 py-3 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {a.title}
              <span className="text-gray-400">→</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
