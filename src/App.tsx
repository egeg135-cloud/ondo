import { useCallback, useEffect, useState } from 'react'
import { ApplyModal, ServiceScope, type ApplySuccessInfo } from './components/ApplyModal'
import { Reviews } from './components/Reviews'
import { MyApplicationsModal } from './components/MyApplicationsModal'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { SlotCard } from './components/SlotCard'
import { signInWithKakao, useSession } from './lib/auth'
import {
  EVENT_GOAL_COUNT,
  getOpenSlotsWithStats,
  getUsersCount,
  type SlotWithStats,
} from './lib/api'
import { subscribeToApplications } from './lib/realtime'
import type { Place, Slot } from './types'

const PLACE_ORDER: Place[] = ['여의도', '반포']

// 랜딩 카운터 표시용 베이스라인 (실제 DB 신청 수에 더해서 보여줌 — 운영자/엑셀엔 영향 없음).
// 초기 휑함 방지용. 0 으로 두면 실제 숫자만 표시.
const DISPLAY_BASE_COUNT = 100

function App() {
  const [slots, setSlots] = useState<SlotWithStats[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalSlot, setModalSlot] = useState<Slot | null>(null)
  const [success, setSuccess] = useState<ApplySuccessInfo | null>(null)
  const [myAppsOpen, setMyAppsOpen] = useState(false)
  const { session } = useSession()

  const refresh = useCallback(async () => {
    const [s, c] = await Promise.all([getOpenSlotsWithStats(), getUsersCount()])
    setSlots(s)
    setMemberCount(c)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
    const unsubscribe = subscribeToApplications(() => {
      void refresh()
    })
    return unsubscribe
  }, [refresh])

  function openGeneral() {
    if (!session) {
      void signInWithKakao()
      return
    }
    setModalSlot(null)
    setModalOpen(true)
  }
  function openSlot(slot: SlotWithStats) {
    if (!session) {
      void signInWithKakao()
      return
    }
    setModalSlot(slot)
    setModalOpen(true)
  }
  function handleSuccess(info: ApplySuccessInfo) {
    setModalOpen(false)
    setSuccess(info)
    void refresh()
  }

  const shownCount = memberCount + DISPLAY_BASE_COUNT
  const progress = Math.min(100, Math.round((shownCount / EVENT_GOAL_COUNT) * 100))

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
        {/* 어두운 오버레이 */}
        <div className="absolute inset-0 bg-black/45" />

        {/* 콘텐츠 */}
        <div className="relative z-10 w-full px-4 pb-10 pt-14">
          <p className="ml-1 text-xs tracking-[0.5em] text-white/60 font-extralight uppercase">ONDO</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-black text-white text-xs font-semibold px-3 py-1.5 border border-white/15">
              3~5명 소그룹
            </span>
            <span className="rounded-full bg-black text-white text-xs font-semibold px-3 py-1.5 border border-white/15">
              부담 없이
            </span>
            <span className="rounded-full bg-black text-white text-xs font-semibold px-3 py-1.5 border border-white/15">
              페이스 정밀 매칭
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white leading-snug">
            큰 러닝크루는 부담되지만,
            <br />
            혼자서는 운동이 안되는 당신을 위해.
          </h1>
          <p className="mt-3 text-sm text-white/70 leading-relaxed">
            날짜·장소만 고르면 3~5명의 소그룹과 함께
            <br />
            부담없이 달릴 수 있습니다.
          </p>

          {/* 이벤트 배너 */}
          <div className="mt-6">
            <p className="text-xs tracking-wide text-white/50 font-medium">
              현재 무료 이벤트 · 선착순 {EVENT_GOAL_COUNT.toLocaleString()}명
            </p>
            <p className="mt-2 text-3xl font-bold text-white">
              {shownCount.toLocaleString()}
              <span className="text-base font-normal text-white/60">
                {' '}/ {EVENT_GOAL_COUNT.toLocaleString()}명 참여
              </span>
            </p>
            <div className="mt-3 h-0.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 메인 CTA */}
          <button
            type="button"
            onClick={openGeneral}
            className="mt-6 w-full rounded-2xl bg-white text-gray-900 font-bold py-4 text-base active:scale-[0.99] transition-transform"
          >
            5초 만에 신청하기
          </button>
        </div>
      </section>

      <div className="flex-1 mx-4 pb-24">

        {/* ── 이번 주 열린 모임 ── */}
        <section className="mt-14">
          <h2 className="text-xl font-bold text-gray-900 mb-4">이번 주 열린 모임</h2>

          {loading ? (
            <p className="text-sm text-gray-500 py-8 text-center">불러오는 중…</p>
          ) : slots.length === 0 ? (
            <div className="rounded-2xl bg-[#F5F5F5] p-6 text-center">
              <p className="text-sm text-gray-500">아직 열린 모임이 없어요.</p>
              <p className="text-xs text-gray-400 mt-1">
                위에서 희망 날짜·장소로 미리 신청하면 매칭해 드려요.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {PLACE_ORDER.map((place) => {
                const items = slots.filter((s) => s.place === place)
                if (items.length === 0) return null
                return (
                  <div key={place}>
                    <div className="flex items-baseline gap-2 mb-3">
                      <h3 className="font-bold text-gray-900">{place}</h3>
                      <span className="text-xs text-gray-500">
                        {items.length}개 모임
                      </span>
                    </div>
                    <div className="space-y-3">
                      {items.map((slot) => (
                        <SlotCard key={slot.id} slot={slot} onApply={openSlot} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 후기 · FOMO */}
        <Reviews onApply={openGeneral} />

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
            <p className="text-3xl">🙂</p>
            <p className="mt-2 mb-2 font-bold text-gray-900 text-xl">신청 접수 완료!</p>
            <p className="mt-1 text-sm text-gray-500">매칭이 확정되면 카톡으로 안내드릴게요.</p>
            <p className="mt-1 mb-4 text-xs text-gray-400">
              {success.name}님 / {success.phone}
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
        slot={modalSlot}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <MyApplicationsModal open={myAppsOpen} onClose={() => setMyAppsOpen(false)} />
    </div>
  )
}

export default App
