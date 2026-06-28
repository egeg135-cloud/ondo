import { useCallback, useEffect, useState } from 'react'
import { ApplyModal, ServiceScope, type ApplySuccessInfo } from './components/ApplyModal'
import { Reviews } from './components/Reviews'
import { Faq } from './components/Faq'
import { SeoJsonLd } from './components/SeoJsonLd'
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
import { HERO_VARIANTS, pickHeroVariant } from './constants/content'
import { analytics } from './lib/analytics'

// 랜딩 카운터 표시용 베이스라인 (실제 DB 신청 수에 더해서 보여줌 — 운영자/엑셀엔 영향 없음).
const DISPLAY_BASE_COUNT = 157

// 이번 주 목요일까지 남은 일수 (마감 D-day 표시용)
function daysToNextThursday(): number {
  const day = new Date().getDay() // 0=일 … 4=목 … 6=토
  return (4 - day + 7) % 7
}

function App() {
  const [memberCount, setMemberCount] = useState(0)
  const [variant] = useState(pickHeroVariant)
  const hero = HERO_VARIANTS[variant]

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

  // 퍼널 추적: page_view + A/B 노출 + 스크롤 깊이 + exit intent
  useEffect(() => {
    analytics.pageView()
    analytics.experimentView('hero_copy', variant)

    const fired = new Set<number>()
    const onScroll = () => {
      const h = document.documentElement
      const pct = ((h.scrollTop + h.clientHeight) / h.scrollHeight) * 100
      ;([25, 50, 75] as const).forEach((p) => {
        if (pct >= p && !fired.has(p)) {
          fired.add(p)
          analytics.scroll(p)
        }
      })
    }
    let exited = false
    const onExit = () => {
      if (exited) return
      exited = true
      analytics.exitIntent()
    }
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0) onExit()
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') onExit()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('mouseout', onMouseOut)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mouseout', onMouseOut)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [variant])

  // 카카오 로그인 후 복귀 → 저장해둔 신청을 자동 제출
  useEffect(() => {
    if (!session) return
    const pending = getPendingApplication()
    if (!pending) return
    clearPendingApplication()
    submitApplication(pending)
      .then(({ applicationId }) => {
        analytics.applicationComplete({ plan: pending.plan })
        analytics.paymentStart()
        setSuccess({ applicationId, phone: pending.phone, name: pending.name, plan: pending.plan ?? null })
        void refresh()
      })
      .catch((e) => console.error('[ONDO] 로그인 후 자동제출 실패:', e))
  }, [session, refresh])

  function openGeneral() {
    analytics.modalOpen()
    setModalOpen(true)
  }
  function handleSuccess(info: ApplySuccessInfo) {
    analytics.applicationComplete()
    analytics.paymentStart()
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
      <SeoJsonLd />
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
              {hero.badges.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-black text-white text-xs font-semibold px-3 py-1.5 border border-white/15"
                >
                  {t}
                </span>
              ))}
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white leading-snug">
              {hero.title.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < hero.title.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <div className="mt-3 text-sm text-white/70 leading-relaxed space-y-3">
              {hero.subtitle.map((para, pi) => (
                <p key={pi}>
                  {para.map((line, li) => (
                    <span key={li}>
                      {line}
                      {li < para.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              ))}
            </div>

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
              <button
                type="button"
                onClick={() => {
                  analytics.heroCtaClick()
                  openGeneral()
                }}
                className="mt-2.5 w-full rounded-2xl bg-white text-gray-900 font-bold py-4 text-base shadow-lg active:scale-[0.99] transition-transform"
              >
                {hero.cta}
              </button>
              <p className="mt-2 text-center text-xs text-white/50">
                (번거로운 회원가입 절차를 싹 뺐어요!)
              </p>
            </div>
          </div>
        </section>

        <div className="flex-1 mx-4 pb-24">
          {/* GEO 한 문장 정의 (AI 인용 친화) */}
          <section className="mt-12">
            <p className="text-base text-gray-900 leading-relaxed">
              <strong className="font-bold">ONDO</strong>는 서울 직장인을 위한{' '}
              <strong className="font-semibold">3~5인 소규모 러닝메이트 매칭 서비스</strong>입니다.
              <br />
              매주 목요일 저녁 8시 여의도 한강에서 비슷한 페이스의 러너를 연결합니다.
            </p>
          </section>

          {/* 후기 · 로드맵 · 이유 · FOMO */}
          <Reviews onApply={openGeneral} ddayLabel={ddayLabel} />

          {/* 서비스 범위 안내 */}
          <section className="mt-14">
            <h2 className="text-xl font-bold text-gray-900 mb-4">ONDO는 이렇게 운영돼요</h2>
            <ServiceScope />
          </section>

          {/* 자주 묻는 질문 + 더 읽어보기 */}
          <Faq />
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
              <p className="text-sm font-bold text-gray-900">
                💳 {success.plan === 'season' ? '10,000원' : '5,000원'} 입금
                <span className="ml-1.5 text-xs font-normal text-gray-400">
                  ({success.plan === 'season' ? '4주 시즌권' : '1회권'})
                </span>
              </p>
              <p className="mt-2 text-sm font-bold text-gray-900">카카오뱅크 3333-37-0096737</p>
              <p className="mt-1 text-sm text-gray-600">예금주: 김무관</p>
              <p className="mt-1 text-sm text-gray-600">
                입금자명: <span className="font-semibold text-gray-900">{success.name}</span>
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
