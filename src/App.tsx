import { useEffect, useState } from 'react'
import { AnchorTabs } from './components/AnchorTabs'
import { ApplyModal, ServiceScope, type ApplySuccessInfo } from './components/ApplyModal'
import { LeadPopup } from './components/LeadPopup'
import { PaceQuickModal } from './components/PaceQuickModal'
import { Reviews } from './components/Reviews'
import { Faq } from './components/Faq'
import { MyApplicationsModal } from './components/MyApplicationsModal'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { useSession } from './lib/auth'
import { claimGuestApplications } from './lib/api'
import { getLastPhone } from './lib/format'
import { shareMatchCard } from './lib/shareCard'
import { HERO_VARIANTS, pickHeroVariant } from './constants/content'
import { analytics } from './lib/analytics'
import { BANK, DEPOSIT } from './types'
import type { Pace } from './types'

// 모집 마감은 수요일 23:59 하나로 통일. 목요일은 러닝 당일.
function deadlineLabel(): string {
  const day = new Date().getDay() // 0=일 … 3=수 … 4=목
  if (day === 4) return '오늘은 러닝 데이 · 다음 주 신청 받는 중'
  const dday = (3 - day + 7) % 7
  return dday === 0 ? '오늘 밤 11:59 모집 마감' : `이번 주 모집 마감 D-${dday}`
}

function App() {
  const [variant] = useState(pickHeroVariant)
  const hero = HERO_VARIANTS[variant]

  const [modalOpen, setModalOpen] = useState(false)
  const [success, setSuccess] = useState<ApplySuccessInfo | null>(null)
  const [myAppsOpen, setMyAppsOpen] = useState(false)
  const [leadPopup, setLeadPopup] = useState(false)
  const [paceModalOpen, setPaceModalOpen] = useState(false)
  const [selectedPace, setSelectedPace] = useState<Pace | null>(null)
  const [copied, setCopied] = useState(false)
  const { session } = useSession()

  // 재참여 원클릭 링크 (?apply=1) — 문자/카톡 링크로 진입 시 바로 신청 모달
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('apply') === '1') {
      analytics.modalOpen()
      setModalOpen(true)
      // 주소창 정리 (새로고침 시 재오픈 방지)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // 퍼널 추적: A/B 노출 + 스크롤 깊이 + exit intent
  // (page_view는 gtag config가 자동 집계 — 수동 호출 시 이중 집계됨)
  useEffect(() => {
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
      // 이탈 시점에 전화번호 수집 팝업 (첫 방문 + 일반 진입일 때만)
      const seen = localStorage.getItem('ondo_lead_seen')
      const isApplyLink = new URLSearchParams(window.location.search).get('apply') === '1'
      if (!seen && !isApplyLink) setLeadPopup(true)
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

  // 카카오 로그인 완료 시 → 같은 번호로 신청했던 게스트 신청을 내 계정에 자동 연결
  useEffect(() => {
    if (!session) return
    const phone = getLastPhone()
    if (!phone) return
    void claimGuestApplications(phone)
  }, [session])

  function openPaceModal() {
    setPaceModalOpen(true)
  }
  function openGeneral() {
    analytics.modalOpen()
    setModalOpen(true)
  }
  function handlePaceConfirm(pace: Pace) {
    setSelectedPace(pace)
    setPaceModalOpen(false)
    openGeneral()
  }
  function handleSuccess(info: ApplySuccessInfo) {
    analytics.applicationComplete()
    analytics.depositStart()
    setModalOpen(false)
    setSuccess(info)
  }

  function copyAccount() {
    void navigator.clipboard.writeText(BANK.number).then(() => {
      analytics.depositCopyAccount()
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const ddayLabel = deadlineLabel()

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

          <div className="relative z-10 w-full px-4 pb-10 pt-[calc(3.5rem+1.75rem)]">
            <span className="inline-block rounded-full bg-black text-white text-xs font-semibold px-3 py-1.5 border border-white/15">
퇴근 후 러닝 루틴 서비스, ONDO
            </span>
            <h1 className="mt-4 text-3xl font-bold text-white leading-snug">
              {hero.title.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < hero.title.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <div className="mt-3 text-sm text-white/70 leading-relaxed space-y-1.5">
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

            {/* 메인 CTA — 모바일은 하단 sticky 버튼이 대신하므로 데스크탑에서만 노출 */}
            <div className="mt-6 hidden md:block">
              <button
                type="button"
                onClick={() => {
                  analytics.heroCtaClick()
                  openPaceModal()
                }}
                className="w-full rounded-2xl bg-[#FF5A1F] text-white font-bold py-4 text-base shadow-lg active:scale-[0.99] transition-transform"
              >
                {hero.cta}
              </button>
            </div>
          </div>
        </section>

        {/* 이번 주 일정 띠 */}
        <div className="bg-gray-900 text-sm text-gray-300 py-2 text-center px-4">
          이번 주 목요일 20:00 · 여의도 한강 5km · 수요일 23:59 마감
        </div>

        <div className="flex-1 mx-4 pb-24">
          {/* 스티키 앵커 탭 */}
          <AnchorTabs />

          {/* GEO 한 문장 정의 (AI 인용 친화) */}
          <section id="intro" className="mt-12 scroll-mt-32">
            <p className="text-base text-gray-900 leading-relaxed">
              <strong className="font-bold">ONDO</strong>는 혼자 뛰던 직장인이{' '}
              <strong className="font-semibold">매주 함께 뛰는 러닝 루틴을 만드는 러닝 메이트 매칭 서비스</strong>입니다.
              <br />
              매주 목요일 저녁 8시 여의도 한강에서 나와 비슷한 페이스의 러너 3~5명과 5km를 달립니다.
            </p>
          </section>

          {/* 후기 · 로드맵 · 이유 · FOMO */}
          <Reviews onApply={openPaceModal} ddayLabel={ddayLabel} />

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
            <p className="text-sm text-gray-500">
              아래 계좌로 보증금 {DEPOSIT.amount}을 보내면 매칭 명단에 올라가요.
            </p>

            {/* 보증금 안내 */}
            <div className="mt-4 rounded-2xl bg-[#F5F5F5] p-4 text-left">
              <p className="text-sm font-bold text-gray-900">
                🔒 보증금 {DEPOSIT.amount}
                <span className="ml-1.5 text-xs font-normal text-gray-400">(참가비는 무료)</span>
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-gray-900">
                  {BANK.bank} {BANK.number}
                </p>
                <button
                  type="button"
                  onClick={copyAccount}
                  className={
                    'shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ' +
                    (copied ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-900 text-white')
                  }
                >
                  {copied ? '복사됨 ✓' : '계좌 복사'}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-600">예금주: {BANK.holder}</p>
              <p className="mt-1 text-sm text-gray-600">
                입금자명: <span className="font-semibold text-gray-900">{success.name}</span>
              </p>
              <ul className="mt-3 space-y-1 border-t border-gray-200 pt-3">
                {DEPOSIT.rules.map((r) => (
                  <li key={r} className="flex gap-1.5 text-xs text-gray-500">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              수요일 23:59까지 입금 시 확정 · 매칭 결과는 카톡으로 안내드릴게요.
            </p>

            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="mt-4 w-full rounded-2xl bg-gray-900 text-white font-bold py-3"
            >
              확인
            </button>
            <button
              type="button"
              onClick={() => void shareMatchCard(success.name)}
              className="mt-2 w-full rounded-2xl bg-gray-100 text-gray-700 font-bold py-3"
            >
              📸 스토리에 자랑하기
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

      <ApplyModal
        open={modalOpen}
        slot={null}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
        initialPace={selectedPace}
      />

      <PaceQuickModal
        open={paceModalOpen}
        onClose={() => setPaceModalOpen(false)}
        onConfirm={handlePaceConfirm}
      />

      {leadPopup && (
        <LeadPopup
          onClose={() => setLeadPopup(false)}
          onApply={() => { setLeadPopup(false); openPaceModal() }}
        />
      )}

      <MyApplicationsModal open={myAppsOpen} onClose={() => setMyAppsOpen(false)} />

      {/* 모바일 sticky bottom CTA */}
      {!modalOpen && !paceModalOpen && !success && !leadPopup && (
        <div className="fixed bottom-0 left-0 w-full md:hidden z-30 px-4 pb-4 pt-3 bg-gradient-to-t from-black/80 to-transparent">
          <button
            type="button"
            onClick={() => {
              analytics.heroCtaClick()
              openPaceModal()
            }}
            className="w-full rounded-2xl bg-[#FF5A1F] text-white font-bold py-4 text-base shadow-lg active:scale-[0.99] transition-transform"
          >
            {hero.cta}
          </button>
        </div>
      )}
    </div>
  )
}

export default App
