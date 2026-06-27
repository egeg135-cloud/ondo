import { useState } from 'react'
import { FAQS, RELATED_ARTICLES } from '../constants/content'
import { analytics } from '../lib/analytics'

export function Faq() {
  const [open, setOpen] = useState<number | null>(null)

  function toggle(i: number) {
    const next = open === i ? null : i
    setOpen(next)
    if (next === i) analytics.faqOpen(FAQS[i].q)
  }

  return (
    <section className="mt-14">
      <h2 className="text-xl font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
      <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200 overflow-hidden">
        {FAQS.map((f, i) => (
          <div key={f.q}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between gap-3 text-left px-4 py-3.5 bg-white"
              aria-expanded={open === i}
            >
              <span className="text-sm font-semibold text-gray-900">{f.q}</span>
              <span className={'text-gray-400 transition-transform ' + (open === i ? 'rotate-180' : '')}>⌄</span>
            </button>
            {open === i && (
              <div className="px-4 pb-4 -mt-1 bg-white">
                <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Related Articles (블로그 연동용) */}
      <div className="mt-8">
        <h3 className="text-sm font-bold text-gray-900 mb-3">더 읽어보기</h3>
        <div className="space-y-2">
          {RELATED_ARTICLES.map((a) => (
            <a
              key={a.title}
              href={a.href}
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
