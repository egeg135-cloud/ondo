// 랜딩 후기 · FOMO 섹션.
// ⚠️ 아래 REVIEWS 는 샘플 카피입니다 — 실제 후기가 모이면 교체하세요.
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

export function Reviews({ onApply }: { onApply: () => void }) {
  return (
    <>
      {/* FOMO 후크 */}
      <section className="mt-16">
        <p className="text-xs font-semibold tracking-wide text-gray-400">매주 목요일 20:00 · 여의도</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 leading-snug">
          퇴근하고 바로 한강.
          <br />
          페이스 맞는 사람들과 5km.
        </h2>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          혼자선 자꾸 미루고, 큰 크루는 페이스가 안 맞죠.
          <br />
          ONDO는 <span className="font-semibold text-gray-700">6:30·7:30 딱 맞는 3~5명</span>만 모아드려요.
          맞으니까, 갈 수밖에 없어요.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            ['목 20:00', '여의도 고정'],
            ['3~5명', '소규모'],
            ['페이스', '6:30 / 7:30'],
          ].map(([big, small]) => (
            <div key={big} className="rounded-2xl bg-[#F5F5F5] py-3">
              <p className="text-sm font-bold text-gray-900">{big}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 후기 */}
      <section className="mt-12">
        <h3 className="text-lg font-bold text-gray-900 mb-4">먼저 뛰어본 분들</h3>
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

      {/* 사진 밴드 + CTA */}
      <section className="mt-12">
        <div
          className="relative rounded-3xl overflow-hidden flex flex-col justify-end min-h-[320px] p-6"
          style={{
            backgroundImage: 'url(/run.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10">
            <p className="text-white text-xl font-bold leading-snug">
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
