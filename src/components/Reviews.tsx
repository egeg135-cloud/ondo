// 랜딩 본문 — 면죄부 · 로드맵 · 타임라인 · 시각적증거 · 이유 · 후기 · 가격 · 마감 CTA.
import { useEffect, useRef } from 'react'
import { BETA_NOTE, COMMON_OPINIONS, TESTIMONIALS } from '../constants/content'
import { analytics } from '../lib/analytics'

const TIMELINE: { time: string; title: string; desc: string }[] = [
  { time: '19:40', title: '여의나루역 도착', desc: '가벼운 스트레칭과 함께 오늘 뛸 코스를 눈으로 담습니다.' },
  { time: '19:50', title: '어색함 없는 첫인사', desc: '나이트 러닝에 최적화된 메이트들과 가볍게 눈인사를 나눕니다.' },
  { time: '20:00', title: '쿨(Cool)하게 러닝 시작', desc: '페이스가 맞는 사람들과 오버페이스 없이 5km를 달립니다.' },
  { time: '20:40', title: '깔끔한 해산', desc: '뒤풀이 없이, 각자의 집으로 개운하게 돌아갑니다.' },
]

export function Reviews({ onApply, ddayLabel }: { onApply: () => void; ddayLabel: string }) {
  const whyRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = whyRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          analytics.whyOndoView()
          io.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <>
      {/* 섹션 2: 고객 면죄부 */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 leading-snug">
          의지가 약해서가 아닙니다.
          <br />
          <span className="text-gray-500">나를 꺼내줄 '환경'이 없었을 뿐입니다.</span>
        </h2>
        <div className="mt-5 rounded-2xl bg-[#F5F5F5] p-5">
          <p className="text-sm text-gray-600 leading-relaxed">
            퇴근 후 지친 몸을 이끌고 밖으로 나가는 건 개인의 억지 노력으로 버틸 수 없습니다.
            <br /><br />
            <span className="font-semibold text-gray-800">'나를 기다려주는 3명의 동료'</span>라는 환경이 세팅될 때,
            달리기는 결심해야 하는 숙제가 아니라 자연스러운 루틴이 됩니다.
            <br /><br />
            개인의 의지로 버티지 마세요. ONDO가 완벽한 러닝 환경을 세팅해 드립니다.
          </p>
        </div>
      </section>

      {/* 섹션 3: 매칭 방식 */}
      <section className="mt-14">
        <p className="text-xs font-semibold tracking-wide text-gray-400">신청하면 이렇게 돼요</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 leading-snug">
          처음 보는 사람끼리,
          <br />
          페이스와 온도를 딱 맞춰 연결해요.
        </h2>
        <div className="mt-6 relative pl-2">
          <div className="absolute left-[18px] top-3 bottom-3 w-px bg-gray-200" />
          <div className="space-y-5">
            {[
              { step: '1', title: '나의 온도 입력 (신청)', desc: '페이스(6:00/7:00) 고르고 5초면 끝.' },
              { step: '2', title: '적정 온도 매칭 (페이스 매칭)', desc: '최근 기록을 확인해 페이스가 비슷한 3~5명으로 그룹 구성.' },
              { step: '3', title: '목요일, 러닝메이트', desc: '여의도 한강 저녁 8시. 숨소리와 발소리만 기분 좋게 섞이는 5km.' },
            ].map((r) => (
              <div key={r.step} className="relative flex gap-4">
                <div className="relative z-10 w-9 h-9 shrink-0 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center">
                  {r.step}
                </div>
                <div className="pt-1">
                  <p className="font-bold text-gray-900">{r.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 섹션 4: 타임라인 */}
      <section className="mt-14">
        <h2 className="text-xl font-bold text-gray-900 mb-6">ONDO와 함께하는 목요일 밤의 공기</h2>
        <div className="relative pl-2">
          <div className="absolute left-[52px] top-3 bottom-3 w-px bg-gray-200" />
          <div className="space-y-6">
            {TIMELINE.map((t) => (
              <div key={t.time} className="relative flex gap-4">
                <div className="w-[52px] shrink-0 text-xs font-bold text-gray-400 pt-1 text-right pr-3">{t.time}</div>
                <div className="relative z-10 w-2.5 h-2.5 mt-1.5 shrink-0 rounded-full bg-gray-900" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 섹션 5: 시각적 증거 (카카오톡 목업) */}
      <section className="mt-14">
        <h2 className="text-xl font-bold text-gray-900 mb-4">신청만 하세요, 나머지는 ONDO가 챙길게요.</h2>
        <div className="rounded-2xl bg-[#F5F5F5] p-4">
          {/* 카카오톡 말풍선 */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 shrink-0 rounded-full bg-[#FAE100] flex items-center justify-center text-sm font-bold text-[#3A1D1D]">
              O
            </div>
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
        <h2 className="text-xl font-bold text-gray-900 mb-5">왜 ONDO일까</h2>
        <div className="space-y-3">
          <div className="rounded-2xl bg-[#F5F5F5] p-5">
            <p className="font-bold text-gray-900">
              딱 좋은 인원 <span className="text-gray-500">(3~5명)</span>
            </p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              숨을 곳도, 눈치 볼 필요도 없는 최적의 인원.
              <br />
              20명이 모이면 '나 하나쯤 안 뛰어도 되겠지.'
              <br />
              하지만 <span className="font-semibold text-gray-800">3~5명</span>은 서로의 페이스를 기분 좋게 지켜주는 가장 담백한 숫자입니다.
            </p>
          </div>

          <div className="rounded-2xl bg-[#F5F5F5] p-5">
            <p className="font-bold text-gray-900">미니멀 러닝</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              가식적인 친목도, 대형 무리의 눈치도 없는 해방감.
              <br />
              뒤풀이 강요도, 과도한 사생활 질문도 없습니다.
              <br />
              오직 달리기 하나로 만나 <span className="font-semibold text-gray-800">깔끔하게 뛰고, 깔끔하게 해산</span>합니다.
            </p>
          </div>

          <div className="rounded-2xl bg-[#F5F5F5] p-5">
            <p className="font-bold text-gray-900">내 취향대로 고르는 목요일의 공기</p>
            <div className="mt-3 space-y-2.5">
              <div className="rounded-xl bg-white p-3.5">
                <p className="font-semibold text-gray-900 text-sm">📊 T형 매칭</p>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                  기록 데이터, 러닝 기어, 가벼운 테크·경제 스몰토크가 자연스럽게 흐르는 그룹
                </p>
              </div>
              <div className="rounded-xl bg-white p-3.5">
                <p className="font-semibold text-gray-900 text-sm">🌅 F형 매칭</p>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                  한강의 노을과 야경을 즐기며 하루의 피로를 러닝으로 털어내는 감성적인 분위기
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 후기 */}
      <section className="mt-14">
        <h2 className="text-xl font-bold text-gray-900 mb-4">실제 참가 후기</h2>
        <div className="space-y-3">
          {TESTIMONIALS.map((r) => (
            <div key={r.meta + r.quote.slice(0, 6)} className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
              <p className="text-sm text-gray-800 leading-relaxed">💬 "{r.quote}"</p>
              <p className="mt-2 text-xs text-gray-400">{r.meta}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-[#F5F5F5] p-5">
          <p className="font-bold text-gray-900 mb-3">가장 많이 나온 의견</p>
          <ul className="space-y-1.5">
            {COMMON_OPINIONS.map((o) => (
              <li key={o} className="flex gap-2 text-sm text-gray-600">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-xs text-gray-400 leading-relaxed">{BETA_NOTE}</p>
      </section>

      {/* 섹션 7: 가격 가치 + 지인 추천 */}
      <section className="mt-14">
        <h2 className="text-xl font-bold text-gray-900 leading-snug">
          커피 한 잔 값으로,
          <br />이번 주 목요일 밤을 바꾸세요.
        </h2>
        <div className="mt-4 rounded-2xl bg-[#F5F5F5] p-5">
          <p className="text-sm text-gray-600 leading-relaxed">
            단순한 참가비가 아닙니다. 확실한 매칭과 노쇼 방지를 위한 최소한의 <span className="font-semibold text-gray-800">러닝 환경 구축비</span>입니다.
          </p>
          <div className="mt-3 flex gap-3">
            <div className="flex-1 rounded-xl bg-white p-3.5 text-center">
              <p className="text-xs text-gray-400 mb-1">1회권</p>
              <p className="text-xl font-bold text-gray-900">5,000원</p>
            </div>
            <div className="flex-1 rounded-xl bg-white p-3.5 text-center">
              <p className="text-xs text-gray-400 mb-1">시즌권</p>
              <p className="text-xl font-bold text-gray-900">10,000원</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-bold text-gray-900 mb-2">🎁 지인 추천 이벤트: 따로 뛰어도 혜택은 같이!</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            가입 후 나만의 추천 코드를 친구에게 공유해 보세요.
            친구가 ONDO에 합류하면 두 분 모두에게 <span className="font-semibold text-gray-800">5,000원 할인</span> 혜택을 드립니다.
          </p>
          <p className="mt-2 text-xs text-gray-400 leading-relaxed">
            걱정 마세요, 매칭은 철저히 '개인의 페이스' 기준입니다. 친구와 억지로 보폭을 맞출 필요 없이 각자의 완벽한 온도로 달립니다.
          </p>
        </div>
      </section>

      {/* 마감 CTA */}
      <section className="mt-14">
        <div
          className="relative rounded-3xl overflow-hidden flex flex-col justify-end min-h-[340px] p-6"
          style={{
            backgroundImage: 'url(/cta.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative z-10">
            <span className="inline-block rounded-full bg-white/15 backdrop-blur text-white text-xs font-semibold px-3 py-1.5">
              🔥 {ddayLabel}
            </span>
            <p className="mt-3 text-white text-xl font-bold leading-snug">
              과열된 일상에서 벗어나,
              <br />
              가장 기분 좋은 온도로 달릴 시간.
            </p>
            <p className="mt-2 text-sm text-white/70">이번 주 목요일, 당신과 온도를 맞출 자리 하나가 비어 있어요.</p>
            <button
              type="button"
              onClick={onApply}
              className="mt-4 w-full rounded-2xl bg-white text-gray-900 font-bold py-4 active:scale-[0.99] transition-transform"
            >
              5초 만에 신청하기
            </button>
            <p className="mt-2 text-center text-xs text-white/50">
              (번거로운 회원가입 절차를 싹 뺐어요!)
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
