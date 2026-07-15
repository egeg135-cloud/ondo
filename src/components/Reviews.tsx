// 랜딩 본문
import { useEffect, useRef, useState } from 'react'
import { BETA_NOTE, COMMON_OPINIONS, TESTIMONIALS } from '../constants/content'
import { DEPOSIT } from '../types'
import { getRecentReviews } from '../lib/api'
import { MemberStats } from './MemberStats'
import { analytics } from '../lib/analytics'

const TIMELINE: { time: string; title: string; desc: string }[] = [
  { time: '19:40', title: '여의나루역 도착', desc: '가벼운 스트레칭, 오늘 뛸 코스를 눈으로 담습니다.' },
  { time: '19:50', title: '첫인사', desc: '페이스 맞는 메이트들과 가볍게 눈인사.' },
  { time: '20:00', title: '러닝 시작', desc: '오버페이스 없이 5km. 숨소리만 기분 좋게 섞입니다.' },
  { time: '20:40', title: '깔끔한 해산', desc: '뒤풀이 없이, 각자의 집으로.' },
]

function TestimonialSlider() {
  const [current, setCurrent] = useState(0)
  const [liveReviews, setLiveReviews] = useState<string[]>([])
  const total = 5
  const startX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getRecentReviews(3).then(setLiveReviews).catch(() => setLiveReviews([]))
  }, [])

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
    <div id="reviews" className="mt-14 scroll-mt-32">
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
              src={`/review${i + 1}.jpeg`}
              alt={`참가 후기 ${i + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ))}
        {/* 좌우 버튼 */}
        {current > 0 && (
          <button
            type="button"
            onClick={() => setCurrent((c) => c - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center text-lg"
          >
            ‹
          </button>
        )}
        {current < total - 1 && (
          <button
            type="button"
            onClick={() => setCurrent((c) => c + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center text-lg"
          >
            ›
          </button>
        )}
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
      {/* 이번 주 참가자 후기 (DB 실시간) */}
      {liveReviews.length > 0 && (
        <div className="mt-4 space-y-3">
          {liveReviews.map((r, i) => (
            <div key={i} className="rounded-2xl bg-white border border-emerald-200 shadow-sm p-4">
              <span className="inline-block text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-800 mb-2">
                최근 참가자
              </span>
              <p className="text-sm text-gray-800 leading-relaxed">💬 "{r}"</p>
            </div>
          ))}
        </div>
      )}

      {/* 텍스트 후기 */}
      <div className="mt-4 space-y-3">
        {TESTIMONIALS.slice(0, 3).map((r) => (
          <div key={r.meta} className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
            {r.pace && (
              <span
                className={
                  'inline-block text-xs px-2 py-1 rounded mb-2 ' +
                  (r.pace === '6분' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800')
                }
              >
                {r.pace} 페이스
              </span>
            )}
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
        <div className="rounded-2xl overflow-hidden mb-5">
          <img
            src="/photos/sofa_procrastinate.jpg"
            alt="퇴근 후 소파에서 러닝을 미루는 모습"
            loading="lazy"
            className="w-full aspect-[4/3] object-cover"
          />
        </div>
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

      {/* 브랜드 문장 */}
      <section className="mt-14">
        <div
          className="relative rounded-3xl overflow-hidden px-6 py-12 text-center"
          style={{
            backgroundImage: 'url(/photos/hangang_night.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10">
            <p className="text-2xl font-bold text-white leading-snug">
              운동은 의지가 아니라<br />약속이 만들어요.
            </p>
            <p className="mt-3 text-sm text-white/70 leading-relaxed">
              혼자서는 미루던 러닝도,<br />함께라면 루틴이 됩니다.
            </p>
          </div>
        </div>
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
              { step: '1', title: '신청', desc: '6분·7분 페이스 고르고 5초면 끝.' },
              { step: '2', title: '페이스 매칭', desc: '기록을 확인해 나와 맞는 3~5명으로 그룹 구성.' },
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
                  <span className="font-semibold text-gray-800">[6:00 페이스]</span> 그룹 매칭이 완료되었습니다.
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
      <section ref={whyRef} id="why-ondo" className="mt-14 scroll-mt-32">
        <div className="rounded-2xl overflow-hidden mb-5">
          <img
            src="/photos/feet_sync.jpg"
            alt="함께 발을 맞춰 달리는 러너들의 러닝화"
            loading="lazy"
            className="w-full aspect-[16/9] object-cover"
          />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">왜 ONDO일까</h2>
        <div className="space-y-3">
          <div className="rounded-2xl bg-[#F5F5F5] p-5">
            <p className="font-bold text-gray-900">꾸준히 뛰게 된다</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              혼자 뛰면 미루기 쉽지만,<br />
              목요일 저녁 <span className="font-semibold text-gray-800">기다리는 사람이 생기면</span> 러닝이 루틴이 됩니다.
            </p>
          </div>
          <div className="rounded-2xl bg-[#F5F5F5] p-5">
            <p className="font-bold text-gray-900">페이스가 맞는다</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              나와 비슷한 속도의 러너와 만나니 <span className="font-semibold text-gray-800">오버페이스도, 뒤처짐도 없어요.</span><br />
              6분·7분 그룹으로 나눠 딱 맞게 연결합니다.
            </p>
          </div>
          <div className="rounded-2xl bg-[#F5F5F5] p-5">
            <p className="font-bold text-gray-900">부담이 없다</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              뒤풀이 없이, 억지 친목 없이.<br />
              3~5명 소규모라 <span className="font-semibold text-gray-800">눈치 볼 일 없이</span> 뛰고 깔끔하게 해산합니다.
            </p>
          </div>
          {/* MBTI 매칭 카드 — 초기 노출 보류, FAQ로 이동 검토 (2차 개편에서 숨김)
          <div className="rounded-2xl bg-[#F5F5F5] p-5">
            <p className="font-bold text-gray-900">MBTI로 결이 맞는 사람과</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              페이스뿐 아니라 MBTI 성향까지 고려해 매칭합니다.<br />
              조용히 집중하고 싶은 사람, 가볍게 대화하며 뛰고 싶은 사람 — 각자의 결에 맞는 그룹으로 연결해드려요.
            </p>
          </div>
          */}
        </div>
      </section>

      {/* 후기 슬라이더 */}
      <TestimonialSlider />

      {/* 신청자 구성 시각화 */}
      <MemberStats />

      {/* 비교표 */}
      <section className="mt-14">
        <h2 className="text-xl font-bold text-gray-900 mb-4">대형 러닝크루와 뭐가 다른가요?</h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-[#F5F5F5]">
                <th className="px-4 py-3 font-semibold text-gray-500 w-[38%]">항목</th>
                <th className="px-3 py-3 font-semibold text-gray-500 w-[31%]">대형 러닝크루</th>
                <th className="px-3 py-3 font-semibold text-gray-900 w-[31%]">ONDO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['인원', '30~100명', '3~5명 소규모'],
                ['페이스 매칭', '✗ 섞임', '✓ 6분·7분 분리'],
                ['처음 오는 사람', '✗ 눈치 보임', '✓ 다 처음 만남'],
                ['참여 부담', '✗ 친목 강요', '✓ 뛰고 깔끔 해산'],
                ['운영자', '✓ 있음', '✗ 없음(가이드만)'],
                ['가격', '✓ 무료', '✓ 무료 (보증금 1만원)'],
              ].map(([label, bad, good]) => (
                <tr key={label} className="bg-white">
                  <td className="px-4 py-3 font-medium text-gray-700">{label}</td>
                  <td className="px-3 py-3 text-gray-400">{bad}</td>
                  <td className="px-3 py-3 font-semibold text-gray-900">{good}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-gray-400">ONDO는 러닝을 이끄는 크루가 아니라, 잘 맞는 러너를 연결합니다.</p>
      </section>

      {/* 가격 — 무료 + 보증금 */}
      <section id="price" className="mt-14 scroll-mt-32">
        <h2 className="text-xl font-bold text-gray-900 leading-snug">
          참가비 0원.<br />약속만 가져오세요.
        </h2>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          ONDO는 이제 <span className="font-semibold text-gray-700">무료</span>입니다. 대신 서로의 목요일을 지키기 위한{' '}
          <span className="font-semibold text-gray-700">보증금 {DEPOSIT.amount}</span>이 있어요.
        </p>
        <div className="mt-5 rounded-2xl bg-white border-2 border-[#FF5A1F] shadow-lg p-5">
          <p className="text-xs font-semibold text-[#FF5A1F] mb-1">이번 주 참여</p>
          <p className="text-3xl font-bold text-gray-900">
            무료{' '}
            <span className="text-base font-semibold text-gray-300 line-through align-middle">5,000원</span>
          </p>
          <p className="mt-1.5 text-sm text-gray-600">페이스 맞는 러너 3~5명과 목요일 저녁 여의도 5km.</p>
          <div className="mt-4 rounded-xl bg-[#F5F5F5] p-3.5">
            <p className="text-xs font-bold text-gray-900 mb-2">🔒 보증금 {DEPOSIT.amount}은 이렇게 움직여요</p>
            <ul className="space-y-1.5">
              {DEPOSIT.rules.map((r) => (
                <li key={r} className="flex gap-1.5 text-xs text-gray-600 leading-relaxed">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400 leading-relaxed">
          기존에 참가비를 결제하신 분들께는 전액 환불을 진행하고 있어요. 개별 카톡으로 안내드립니다.
        </p>
      </section>

      {/* 마감 CTA */}
      <section className="mt-14">
        <div
          className="relative rounded-3xl overflow-hidden flex flex-col justify-end min-h-[300px] p-6"
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
              이번 목요일 함께 뛰기
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
