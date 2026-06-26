// 랜딩 본문 — 고객 경험 로드맵 · 과학 근거 · 후기 · 마감 CTA.
// ⚠️ REVIEWS 는 샘플 카피입니다 — 실제 후기가 모이면 교체하세요.

const ROADMAP: { step: string; title: string; desc: string }[] = [
  { step: '1', title: '신청', desc: '페이스(6:30/7:30) 고르고 5초면 끝. 첫 참여는 무료예요.' },
  { step: '2', title: '페이스 매칭', desc: '최근 러닝 기록을 확인해 비슷한 3~5명으로 그룹을 짜드려요.' },
  { step: '3', title: '목요일, 러닝메이트', desc: '여의도 한강 저녁 8시. 페이스 맞는 사람들과 부담 없이 5km.' },
]

const SCIENCE: { tag: string; title: string; desc: string }[] = [
  {
    tag: '행동경제학 · 링겔만 효과',
    title: '왜 3~5명일까',
    desc: '20명 크루에선 “내가 안 뛰어도 티 안 나”. 3~5명은 서로의 존재감이 딱 살아나는 인원이에요.',
  },
  {
    tag: '운동생리학 · 젖산 역치',
    title: '왜 페이스를 맞출까',
    desc: '나보다 빠른 사람 따라가면 5분 만에 방전돼요. 6:30·7:30 정밀 매칭이라 끝까지 편하게 달려요.',
  },
  {
    tag: '신경내분비 · 코르티솔',
    title: '왜 퇴근 후 저녁일까',
    desc: '낮에 쌓인 스트레스 호르몬을 밤 러닝이 씻어내요. 목요일 8시가 한 주의 리셋 버튼이 됩니다.',
  },
  {
    tag: '심리학 · 자기결정성',
    title: '왜 운영자가 없을까',
    desc: '지시·인솔이 없을 때 습관이 더 오래가요. 깔끔하게 달리고 깔끔하게 헤어지는 미니멀 러닝.',
  },
]

const REVIEWS: { quote: string; name: string; meta: string }[] = [
  {
    quote: '페이스가 맞으니까 처음으로 안 처지고 끝까지 뛰었어요. 다음 주도 바로 신청했어요.',
    name: '김O연',
    meta: '6:30 · 마케터',
  },
  {
    quote: '목요일 8시가 한 주의 리셋 버튼이 됐어요. 퇴근하고 바로 여의도로 직행해요.',
    name: '이O준',
    meta: '7:30 · 개발자',
  },
  {
    quote: '운영자가 안 끼어서 오히려 편해요. 비슷한 사람끼리 딱 달리고 깔끔하게 헤어져요.',
    name: '박O',
    meta: '6:30 · 직장인',
  },
]

export function Reviews({ onApply, ddayLabel }: { onApply: () => void; ddayLabel: string }) {
  return (
    <>
      {/* 고객 경험 로드맵 */}
      <section className="mt-14">
        <p className="text-xs font-semibold tracking-wide text-gray-400">신청하면 이렇게 돼요</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 leading-snug">
          신청 → 페이스 매칭 →<br />목요일, 맞는 사람과 러닝
        </h2>
        <div className="mt-6 relative pl-2">
          <div className="absolute left-[18px] top-3 bottom-3 w-px bg-gray-200" />
          <div className="space-y-5">
            {ROADMAP.map((r) => (
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

      {/* 과학 근거 */}
      <section className="mt-14">
        <h2 className="text-xl font-bold text-gray-900">대충 모은 게 아니에요</h2>
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
          ONDO의 규칙엔 이유가 있어요. 끝까지 즐겁게 달리게 만드는 작은 설계들.
        </p>
        <div className="mt-5 space-y-3">
          {SCIENCE.map((s) => (
            <div key={s.title} className="rounded-2xl bg-[#F5F5F5] p-4">
              <p className="text-[11px] font-semibold text-gray-400">{s.tag}</p>
              <p className="mt-1 font-bold text-gray-900">{s.title}</p>
              <p className="mt-1 text-sm text-gray-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 후기 */}
      <section className="mt-14">
        <h2 className="text-xl font-bold text-gray-900 mb-4">먼저 뛰어본 분들</h2>
        <div className="space-y-3">
          {REVIEWS.map((r) => (
            <div key={r.name} className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
              <p className="text-sm text-gray-800 leading-relaxed">“{r.quote}”</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                  {r.name.slice(0, 1)}
                </div>
                <span className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">{r.name}</span> · {r.meta}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 사진 밴드 + 마감 CTA */}
      <section className="mt-14">
        <div
          className="relative rounded-3xl overflow-hidden flex flex-col justify-end min-h-[340px] p-6"
          style={{
            backgroundImage: 'url(/run.jpg)',
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
              이번 주 목요일,
              <br />
              당신 자리 하나 비어 있어요.
            </p>
            <p className="mt-2 text-sm text-white/70">5초면 신청 끝 · 첫 참여는 무료</p>
            <button
              type="button"
              onClick={onApply}
              className="mt-4 w-full rounded-2xl bg-white text-gray-900 font-bold py-4 active:scale-[0.99] transition-transform"
            >
              지금 신청하기
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
