// 랜딩 본문 — 페인포인트 · 로드맵 · 이유 · 후기 · 마감 CTA.
// ⚠️ REVIEWS 는 샘플 카피입니다 — 실제 후기가 모이면 교체하세요.

const PAINS: string[] = [
  '이미 다들 친한 분위기라, 끼기가 부담스러웠어요.',
  '내 페이스랑 안 맞아서 혼자 처지거나, 무리하다 지쳤어요.',
]

const ROADMAP: { step: string; title: string; desc: string }[] = [
  { step: '1', title: '신청', desc: '페이스(6:00/7:00) 고르고 5초면 끝. 로그인 없이 바로 시작해요.' },
  { step: '2', title: '페이스 매칭', desc: '최근 러닝 기록을 확인해 비슷한 3~5명으로 그룹을 짜드려요.' },
  { step: '3', title: '목요일, 러닝메이트', desc: '여의도 한강 저녁 8시. 페이스 맞는 사람들과 부담 없이 5km.' },
]

const REASONS: { tag: string; title: string; desc: string }[] = [
  {
    tag: '딱 좋은 인원',
    title: '왜 3~5명일까',
    desc: '20명 크루에선 “내가 안 뛰어도 티 안 나”. 3~5명은 서로의 존재감이 딱 살아나는 인원이에요.',
  },
  {
    tag: '오버페이스 방지',
    title: '왜 페이스를 맞출까',
    desc: '나보다 빠르면 금방 지치고, 느리면 지루해요. 6:00·7:00 정밀 매칭이라 끝까지 딱 좋은 강도로 달려요.',
  },
  {
    tag: '갓생 직장인용',
    title: '왜 퇴근 후 목요일일까',
    desc: '“퇴근하고 운동해야지” 하다가 결국 못 하잖아요. 주말은 약속도 많고요. 목요일 저녁 8시, 자리 잡아두면 가게 돼요.',
  },
  {
    tag: '미니멀 러닝',
    title: '왜 운영자가 없을까',
    desc: 'E성향 호스트의 텐션도, 이미 친한 무리의 눈치도 없어요. 처음 보는 사람끼리 깔끔하게 만나 달리고, 깔끔하게 헤어져요.',
  },
]

const REVIEWS: { quote: string; name: string; meta: string }[] = [
  {
    quote: '페이스가 맞으니까 처음으로 안 처지고 끝까지 뛰었어요. 다음 주도 바로 신청했어요.',
    name: '김O연',
    meta: '6:00 · AI 개발자',
  },
  {
    quote: '목요일 8시가 한 주의 리셋 버튼이 됐어요. 퇴근하고 바로 여의도로 직행해요.',
    name: '이O준',
    meta: '7:00 · 행사 마케터',
  },
  {
    quote: '처음 보는 사람들끼리라 오히려 편해요. 깔끔하게 달리고 깔끔하게 헤어지는 게 딱 좋아요.',
    name: '박O',
    meta: '6:00 · 약사',
  },
]

export function Reviews({ onApply, ddayLabel }: { onApply: () => void; ddayLabel: string }) {
  return (
    <>
      {/* 페인포인트 */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 leading-snug">혹시, 이런 적 없으세요?</h2>
        <div className="mt-5 space-y-3">
          {PAINS.map((p) => (
            <div key={p} className="rounded-2xl bg-[#F5F5F5] px-4 py-3.5">
              <p className="text-sm text-gray-700 leading-relaxed">“{p}”</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm text-gray-500 leading-relaxed">
          그래서 ONDO는 <span className="font-semibold text-gray-700">처음 보는 사람끼리</span>,{' '}
          <span className="font-semibold text-gray-700">페이스를 딱 맞춰</span> 연결해요.
        </p>
      </section>

      {/* 고객 경험 로드맵 */}
      <section className="mt-14">
        <p className="text-xs font-semibold tracking-wide text-gray-400">신청하면 이렇게 돼요</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 leading-snug">
          신청 → 페이스 매칭 → 목요일, 맞는 사람과 러닝
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

      {/* 왜 ONDO일까 */}
      <section className="mt-14">
        <h2 className="text-xl font-bold text-gray-900">왜 ONDO일까</h2>
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
          ONDO의 규칙엔 이유가 있어요. 끝까지 즐겁게 달리게 만드는 작은 설계들.
        </p>
        <div className="mt-5 space-y-3">
          {REASONS.map((s) => (
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
            <p className="mt-2 text-sm text-white/70">5초면 신청 끝 · 로그인 없이 시작</p>
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
