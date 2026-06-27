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
        <h2 className="text-xl font-bold text-gray-900 mb-5">왜 ONDO일까</h2>
        <div className="space-y-3">
          {/* 카드 1 */}
          <div className="rounded-2xl bg-[#F5F5F5] p-5">
            <p className="font-bold text-gray-900">
              딱 좋은 인원 <span className="text-gray-500">(3~5명)</span>
            </p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              숨을 곳도, 눈치 볼 필요도 없는 최적의 인원.
              <br />
              20명이 모이면 ‘나 하나쯤 안 뛰어도 되겠지.’
              <br />
              하지만 <span className="font-semibold text-gray-800">3~5명</span>은 서로의 페이스를 기분 좋게 지켜주는 가장 담백한 숫자입니다.
              <br />
              부담은 덜어내고, 러닝의 몰입감만 남겼습니다.
            </p>
          </div>

          {/* 카드 2 */}
          <div className="rounded-2xl bg-[#F5F5F5] p-5">
            <p className="font-bold text-gray-900">미니멀 러닝</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              가식적인 친목도, 대형 무리의 눈치도 없는 해방감.
              <br />
              이미 친한 사람들 사이에 억지로 끼어들기 위해 에너지를 쓸 필요가 없습니다.
              <br />
              뒤풀이 강요도, 과도한 사생활 질문도 없습니다.
              <br />
              오직 달리기 하나로 만나 <span className="font-semibold text-gray-800">깔끔하게 뛰고, 깔끔하게 해산</span>합니다.
            </p>
          </div>

          {/* 카드 3 — 취향 매칭 */}
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
                  한강의 노을과 야경을 즐기며 오늘 하루의 피로를 러닝으로 털어내는 편안한 분위기의 그룹
                </p>
              </div>
            </div>
          </div>
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
            <p className="mt-2 text-center text-xs text-white/50">
              (번거로운 회원가입 절차를 싹 뺐어요!)
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
