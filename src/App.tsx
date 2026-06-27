import { useCallback, useEffect, useState } from 'react'
import { ApplyModal, ServiceScope, type ApplySuccessInfo } from './components/ApplyModal'
import { Reviews } from './components/Reviews'
import { MyApplicationsModal } from './components/MyApplicationsModal'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { useSession } from './lib/auth'
import {
  EVENT_GOAL_COUNT,
  clearPendingApplication,
  getPendingApplication,
  getUsersCount,
  submitApplication,
} from './lib/api'
import { subscribeToApplications } from './lib/realtime'

// 랜딩 카운터 표시용 베이스라인 (실제 DB 신청 수에 더해서 보여줌 — 운영자/엑셀엔 영향 없음).
const DISPLAY_BASE_COUNT = 157

// 이번 주 목요일까지 남은 일수 (마감 D-day 표시용)
function daysToNextThursday(): number {
  const day = new Date().getDay() // 0=일 … 4=목 … 6=토
  return (4 - day + 7) % 7
}

function App() {
  const [memberCount, setMemberCount] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [success, setSuccess] = useState<ApplySuccessInfo | null>(null)
  const [myAppsOpen, setMyAppsOpen] = useState(false)
  const { session } = useSession()

  const refresh = useCallback(async () => {
    setMemberCount(await getUsersCount())
  }, [])

  useEffect(() => {
    void refresh()
    const unsubscribe = subscribeToApplications(() => {
      void refresh()
    })
    return unsubscribe
  }, [refresh])

  // 카카오 로그인 후 복귀 → 저장해둔 신청을 자동 제출
  useEffect(() => {
    if (!session) return
    const pending = getPendingApplication()
    if (!pending) return
    clearPendingApplication()
    submitApplication(pending)
      .then(({ applicationId }) => {
        setSuccess({ applicationId, phone: pending.phone, name: pending.name })
        void refresh()
      })
      .catch((e) => console.error('[ONDO] 로그인 후 자동제출 실패:', e))
  }, [session, refresh])

  function openGeneral() {
    setModalOpen(true)
  }
  function handleSuccess(info: ApplySuccessInfo) {
    setModalOpen(false)
    setSuccess(info)
    void refresh()
  }

  const shownCount = memberCount + DISPLAY_BASE_COUNT
  const progress = Math.min(100, Math.round((shownCount / EVENT_GOAL_COUNT) * 100))
  const dday = daysToNextThursday()
  const ddayLabel = dday === 0 ? '오늘 저녁 8시 마감' : `이번 주 목요일 마감 D-${dday}`

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <Navbar session={session} onMyApps={() => setMyAppsOpen(true)} />

      <div className="w-full max-w-[550px] bg-white flex flex-col">
        {/* ── 히어로 (풀스크린 배경 이미지) ── */}
        <section
          className="relative flex-shrink-0 flex flex-col justify-end overflow-hidden"
          style={{
            height: '100svh',
            backgroundImage: 'url(/run.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/45" />

          <div className="relative z-10 w-full px-4 pb-10 pt-14">
            <p className="ml-1 text-xs tracking-[0.5em] text-white/60 font-extralight uppercase">ONDO</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {['3~5명 소그룹', '페이스 정밀 매칭', '목요일 여의도'].map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-black text-white text-xs font-semibold px-3 py-1.5 border border-white/15"
                >
                  {t}
                </span>
              ))}
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white leading-snug">
              달리기는 좋아하지만,
              <br />
              사람에 치이고 싶진 않았습니다.
            </h1>
            <p className="mt-3 text-sm text-white/70 leading-relaxed">
              대형 크루의 과한 친목은 부담스럽고,
              <br />
              혼자 뛰기엔 침대가 너무 강력했던 목요일.
              <br />
              <br />
              ONDO는 오늘도 핑계를 찾던 나를 밖으로 꺼내줄
              <br />
              딱 맞는 <strong className="text-white font-semibold">러닝메이트 3~5명</strong>만 연결합니다.
              <br />
              <br />
              부담 없이 만나, 기분 좋게 뛰고, 깔끔하게 해산합니다.
            </p>

            {/* 이벤트 배너 */}
            <div className="mt-6">
              <p className="text-xs tracking-wide text-white/50 font-medium">
                🏃‍♂️ 현재 {shownCount.toLocaleString()}명 탑승 완료
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {shownCount.toLocaleString()}
                <span className="text-base font-normal text-white/60">
                  {' '}/ {EVENT_GOAL_COUNT.toLocaleString()}명 참여
                </span>
              </p>
              <div className="mt-3 h-0.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-white transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* 마감 배지 + 메인 CTA */}
            <div className="mt-6">
              <div className="flex justify-center">
                <span className="relative rounded-full bg-white/15 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:top-full after:border-[5px] after:border-transparent after:border-t-white/15">
                  🔥 선착순 무료 혜택 마감 임박
                </span>
              </div>
              <button
                type="button"
                onClick={openGeneral}
                className="mt-2.5 w-full rounded-2xl bg-white text-gray-900 font-bold py-4 text-base active:scale-[0.99] transition-transform"
              >
                5초 만에 신청하기
              </button>
              <p className="mt-2 text-center text-xs text-white/50">
                (번거로운 회원가입 절차를 싹 뺐어요!)
              </p>
            </div>
          </div>
        </section>

        <div className="flex-1 mx-4 pb-24">
          {/* 후기 · 로드맵 · 과학 · FOMO */}
          <Reviews onApply={openGeneral} ddayLabel={ddayLabel} />

          {/* 서비스 범위 안내 */}
          <section className="mt-14">
            <h2 className="text-xl font-bold text-gray-900 mb-4">ONDO는 이렇게 운영돼요</h2>
            <ServiceScope />
          </section>
        </div>

        <Footer />
      </div>

      {/* ── 신청 완료 오버레이 ── */}
      {success && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6"
          onClick={() => setSuccess(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-[0_0_40px_rgba(0,0,0,0.13)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-3xl">🎉</p>
            <p className="mt-2 mb-1 font-bold text-gray-900 text-xl">신청 완료!</p>
            <p className="text-sm text-gray-500">아래 계좌로 입금하시면 매칭이 시작돼요.</p>

            {/* 입금 안내 */}
            <div className="mt-4 rounded-2xl bg-[#F5F5F5] p-4 text-left">
              <p className="text-sm font-bold text-gray-900">💳 카카오뱅크 3333-37-0096737</p>
              <p className="mt-1 text-sm text-gray-600">예금주: 김무관</p>
              <p className="mt-1 text-sm text-gray-600">
                입금자명: <span className="font-semibold text-gray-900">{success.name}</span> (본인 이름)
              </p>
            </div>
            <p className="mt-2 text-xs text-gray-400">매칭이 확정되면 카톡으로 안내드릴게요.</p>

            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="mt-4 w-full rounded-2xl bg-gray-900 text-white font-bold py-3"
            >
              확인
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccess(null)
                setMyAppsOpen(true)
              }}
              className="w-full text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2 pt-1"
            >
              내 신청 내역 보기
            </button>
          </div>
        </div>
      )}

      <ApplyModal open={modalOpen} slot={null} onClose={() => setModalOpen(false)} onSuccess={handleSuccess} />

      <MyApplicationsModal open={myAppsOpen} onClose={() => setMyAppsOpen(false)} />
    </div>
  )
}

export default App
