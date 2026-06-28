// 랜딩 본문
import { useEffect, useRef, useState } from 'react'
import { BETA_NOTE, COMMON_OPINIONS, TESTIMONIALS } from '../constants/content'
import { analytics } from '../lib/analytics'

const TIMELINE: { time: string; title: string; desc: string }[] = [
  { time: '19:40', title: '여의나루역 도착', desc: '가벼운 스트레칭, 오늘 뛸 코스를 눈으로 담습니다.' },
  { time: '19:50', title: '첫인사', desc: '페이스 맞는 메이트들과 가볍게 눈인사.' },
  { time: '20:00', title: '러닝 시작', desc: '오버페이스 없이 5km. 숨소리만 기분 좋게 섞입니다.' },
  { time: '20:40', title: '깔끔한 해산', desc: '뒤풀이 없이, 각자의 집으로.' },
]

function TestimonialSlider() {
  const [current, setCurrent] = useState(0)
  const total = 5
  const startX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX
  }
  function onPointerUp(e: React.PointerEvent) {
    const diff = startX.current - e.clientX
    if (Math.abs(diff) < 30) return
    if (diff > 0) setCurrent((c) => Math.min(c + 1, total - 1))
    else setCurrent((c) => Math.max(c - 1, 0))
  }

  return (
    <div className="mt-14">
      <h2 className="text-xl font-bold text-gray-900 mb-4">실제 참가 후기</h2>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl aspect-square select-none cursor-grab"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-300"
            style={{ opacity: current === i ? 1 : 0, pointerEvents: current === i ? 'auto' : 'none' }}
          >
            <img
              src={`/후기${i + 1}.jpeg`}
              alt={`참가 후기 ${i + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>
      {/* 인디케이터 */}
      <div className="flex justify-center gap-1.5 mt-3">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className={'w-1.5 h-1.5 rounded-full transition-colors ' + (i === current ? 'bg-gray-900' : 'bg-gray-300')}
          />
        ))}
      </div>
      {/* 텍스트 후기 */}
      <div className="mt-4 space-y-3">
        {TESTIMONIALS.slice(0, 3).map((r) => (
          <div key={r.meta} className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
            <p className="text-sm text-gray-800 leading-relaxed">💬 "{r.quote}"</p>
            <p className="mt-2 text-xs text-gray-400">{r.meta}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-[#F5F5F5] p-4">
        <ul className="space-y-1.5">
          {COMMON_OPINIONS.map((o) => (
            <li key={o} className="flex gap-2 text-sm text-gray-600">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-xs text-gray-400 leading-relaxed">{BETA_NOTE}</p>
    </div>
  )
}

export function Reviews({ onApply, ddayLabel }: { onApply: () => void; ddayLabel: string }) {
  const whyRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = whyRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) { analytics.whyOndoView(); io.disconnect() } },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <>
      {/* 섹션 2: 경험 공감 */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 leading-snug">혹시, 이런 적 없으세요?</h2>
        <div className="mt-4 space-y-2.5">
          {[
            '"페이스가 안 맞아서 혼자 처지거나, 무리하다 지쳤어요."',
            '"이미 다들 친한 분위기라, 끼기가 너무 부담스러웠어요."',
          ].map((p) => (
            <div key={p} className="rounded-2xl bg-[#F5F5F5] px-4 py-3.5">
              <p className="text-sm text-gray-700 leading-relaxed">{p}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-500 leading-relaxed">
          그래서 ONDO는 <span className="font-semibold text-gray-700">처음 보는 사람끼리</span>,{' '}
          <span className="font-semibold text-gray-700">페이스를 딱 맞춰</span> 연결합니다.
        </p>
      </section>

      {/* 섹션 3: 매칭 방식 */}
      <section className="mt-14">
        <p className="text-xs font-semibold tracking-wide text-gray-400">신청하면 이렇게 돼요</p>
        <h2 className="mt-2 text-xl font-bold text-gray-900 leading-snug">
          신청 → 페이스 매칭 → 목요일, 맞는 사람과 러닝
        </h2>
        <div className="mt-5 relative pl-2">
          <div className="absolute left-[18px] top-3 bottom-3 w-px bg-gray-200" />
          <div className="space-y-5">
            {[
              { step: '1', title: '신청', desc: '페이스(6:00/7:00) 고르고 5초면 끝.' },
              { step: '2', title: '페이스 매칭', desc: '기록을 확인해 비슷한 3~5명으로 그룹 구성.' },
              { step: '3', title: '목요일, 러닝메이트', desc: '여의도 한강 저녁 8시. 부담 없이 5km.' },
            ].map((r) => (
              <div key={r.step} className="relative flex gap-4">
                <div className="relative z-10 w-9 h-9 shrink-0 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center">
                  {r.step}
                </div>
                <div className="pt-1">
                  <p className="font-bold text-gray-900">{r.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 섹션 4: 타임라인 */}
      <section className="mt-14">
        <h2 className="text-xl font-bold text-gray-900 mb-5">목요일 밤, 이렇게 흘러가요</h2>
        <div className="relative pl-2">
          <div className="absolute left-[52px] top-3 bottom-3 w-px bg-gray-200" />
          <div className="space-y-5">
            {TIMELINE.map((t) => (
              <div key={t.time} className="relative flex gap-4">
                <div className="w-[52px] shrink-0 text-xs font-bold text-gray-400 pt-1 text-right pr-3">{t.time}</div>
                <div className="relative z-10 w-2.5 h-2.5 mt-1.5 shrink-0 rounded-full bg-gray-900" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 섹션 5: 카카오 목업 */}
      <section className="mt-14">
        <h2 className="text-xl font-bold text-gray-900 mb-4">신청만 하세요, 나머지는 ONDO가 챙길게요.</h2>
        <div className="rounded-2xl bg-[#F5F5F5] p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 shrink-0 rounded-full bg-[#FAE100] flex items-center justify-center text-sm font-bold text-[#3A1D1D]">O</div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-700 mb-1.5">ONDO</p>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[280px]">
                <p className="text-xs font-bold text-gray-900 mb-1">[ONDO 매칭 완료 안내]</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  OOO님, 내일 저녁 8시<br />
                  <span className="font-semibold text-gray-800">[6:30 페이스]</span> 그룹 매칭이 완료되었습니다.
                  <br /><br />
                  내일 여의나루역 2번 출구 앞에서 만나요! 🏃
                </p>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 ml-1">오후 6:00</p>
            </div>
          </div>
        </div>
      </section>

      {/* 왜 ONDO일까 */}
      <section ref={whyRef} className="mt-14">
        <h2 className="text-xl font-bold text-gray-900 mb-4">왜 ONDO일까</h2>
        <div className="space-y-3">
          <div className="rounded-2xl bg-[#F5F5F5] p-5">
            <p className="font-bold text-gray-900">3~5명, 딱 좋은 인원</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              20명이 모이면 '나 하나쯤 안 뛰어도 되겠지.'<br />
              3~5명은 눈치 볼 필요 없이, 페이스를 기분 좋게 지켜주는 최적의 숫자입니다.
            </p>
          </div>
          <div className="rounded-2xl bg-[#F5F5F5] p-5">
            <p className="font-bold text-gray-900">달리기만, 깔끔하게</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              뒤풀이 없이, 억지 친목 없이.<br />
              뛰고 싶은 사람끼리 만나 <span className="font-semibold text-gray-800">달리고 깔끔하게 해산</span>합니다.
            </p>
          </div>
          <div className="rounded-2xl bg-[#F5F5F5] p-5">
            <p className="font-bold text-gray-900">MBTI로 결이 맞는 사람과</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              페이스뿐 아니라 MBTI 성향까지 고려해 매칭합니다.<br />
              조용히 집중하고 싶은 사람, 가볍게 대화하며 뛰고 싶은 사람 — 각자의 결에 맞는 그룹으로 연결해드려요.
            </p>
          </div>
        </div>
      </section>

      {/* 후기 슬라이더 */}
      <TestimonialSlider />

      {/* 가격 + 지인 추천 */}
      <section className="mt-14">
        <h2 className="text-xl font-bold text-gray-900">커피 한 잔 값으로,<br />이번 주 목요일을 바꾸세요.</h2>
        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-2xl bg-[#F5F5F5] p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">1회권</p>
            <p className="text-2xl font-bold text-gray-900">5,000원</p>
          </div>
          <div className="flex-1 rounded-2xl bg-[#F5F5F5] p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">4주 시즌권</p>
            <p className="text-2xl font-bold text-gray-900">10,000원</p>
            <p className="text-xs text-gray-400 mt-0.5">회당 2,500원</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-bold text-gray-900 mb-1">🎁 친구 추천 할인</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            신청 시 친구 이름을 입력하면 <span className="font-semibold text-gray-800">두 분 모두 1,000원 환급</span>해드려요.<br />
            <span className="text-xs text-gray-400">단, 두 분 모두 참가 확인 후 환급됩니다. 매칭은 각자 페이스 기준으로 진행돼요.</span>
          </p>
        </div>
      </section>

      {/* 마감 CTA */}
      <section className="mt-14">
        <div
          className="relative rounded-3xl overflow-hidden flex flex-col justify-end min-h-[320px] p-6"
          style={{ backgroundImage: 'url(/cta.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative z-10">
            <span className="inline-block rounded-full bg-white/15 backdrop-blur text-white text-xs font-semibold px-3 py-1.5">
              🔥 {ddayLabel}
            </span>
            <p className="mt-3 text-white text-xl font-bold leading-snug">
              이번 주 목요일,<br />당신 자리 하나 비어 있어요.
            </p>
            <button
              type="button"
              onClick={onApply}
              className="mt-4 w-full rounded-2xl bg-white text-gray-900 font-bold py-4 active:scale-[0.99] transition-transform"
            >
              5초 만에 신청하기
            </button>
            <p className="mt-2 text-center text-xs text-white/50">(번거로운 회원가입 절차를 싹 뺐어요!)</p>
          </div>
        </div>
      </section>
    </>
  )
}
