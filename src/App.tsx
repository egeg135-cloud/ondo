import { useCallback, useEffect, useState } from 'react'
import { ApplyModal, type ApplySuccessInfo } from './components/ApplyModal'
import { MyApplicationsModal } from './components/MyApplicationsModal'
import { SlotCard } from './components/SlotCard'
import { displayName, signInWithKakao, signOut, useSession } from './lib/auth'
import {
  EVENT_GOAL_COUNT,
  getOpenSlotsWithStats,
  getUsersCount,
  type SlotWithStats,
} from './lib/api'
import { subscribeToApplications } from './lib/realtime'
import type { Place, Slot } from './types'

const PLACE_ORDER: Place[] = ['여의도', '반포', '종로']

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

  // 슬롯 통계 + 참여자 수를 다시 읽는다 (초기 로드 & 실시간 변경 시 호출)
  const refresh = useCallback(async () => {
    const [s, c] = await Promise.all([getOpenSlotsWithStats(), getUsersCount()])
    setSlots(s)
    setMemberCount(c)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
    // 실시간 구독: 다른 사람이 신청하면 숫자가 바로 올라간다
    const unsubscribe = subscribeToApplications(() => {
      void refresh()
    })
    return unsubscribe
  }, [refresh])

  // 신청은 로그인 필요 — 미로그인 시 카카오 로그인으로 유도
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
    <div className="min-h-screen">
      <div className="max-w-md mx-auto px-5 pb-24">
        {/* ───────── 상단 바 ───────── */}
        <div className="pt-4 flex items-center justify-between">
          {session ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-navy/70">
                <span className="font-semibold text-navy">{displayName(session)}</span>님
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-navy/40 hover:text-navy underline underline-offset-2"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void signInWithKakao()}
              className="flex items-center gap-1.5 rounded-lg bg-[#FEE500] text-[#191600] font-semibold text-sm px-3 py-1.5"
            >
              <span aria-hidden>💬</span> 카카오로 로그인
            </button>
          )}
          <button
            type="button"
            onClick={() => setMyAppsOpen(true)}
            className="text-sm text-navy/60 hover:text-navy underline underline-offset-2"
          >
            내 신청 내역
          </button>
        </div>

        {/* ───────── 히어로 ───────── */}
        <header className="pt-6 pb-8 text-center">
          <p className="text-sm tracking-[0.3em] text-sand font-semibold">ONDO</p>
          <h1 className="mt-4 text-2xl font-bold text-navy leading-snug">
            큰 러닝크루는 부담,
            <br />
            혼자는 안 나가는 당신께
          </h1>
          <p className="mt-3 text-navy/60 leading-relaxed">
            날짜·장소만 고르면 3~5명 소그룹과
            <br />
            한강을 달려요
          </p>
        </header>

        {/* ───────── 이벤트 배너 + 진행률 ───────── */}
        <section className="rounded-2xl bg-navy text-white p-5 text-center">
          <p className="text-sm text-sand font-semibold">
            현재 무료 이벤트 · 선착순 {EVENT_GOAL_COUNT.toLocaleString()}명
          </p>
          <p className="mt-3 text-3xl font-extrabold">
            {shownCount.toLocaleString()}
            <span className="text-lg font-bold text-white/50">
              {' '}
              / {EVENT_GOAL_COUNT.toLocaleString()}명 참여
            </span>
          </p>
          <div className="mt-3 h-2 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-sand transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {/* ───────── 메인 CTA ───────── */}
        <button
          type="button"
          onClick={openGeneral}
          className="mt-5 w-full rounded-2xl bg-sand text-navy font-bold py-4 text-base active:scale-[0.99] transition-transform"
        >
          5초 만에 신청하기
        </button>

        {/* ───────── 이번 주 열린 모임 ───────── */}
        <section className="mt-10">
          <h2 className="text-lg font-bold text-navy mb-3">이번 주 열린 모임</h2>

          {loading ? (
            <p className="text-sm text-navy/40 py-8 text-center">불러오는 중…</p>
          ) : slots.length === 0 ? (
            <div className="rounded-2xl bg-white/60 border border-navy/10 p-6 text-center">
              <p className="text-sm text-navy/60">아직 열린 모임이 없어요.</p>
              <p className="text-xs text-navy/40 mt-1">
                위에서 희망 날짜·장소로 미리 신청하면 매칭해 드려요.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {PLACE_ORDER.map((place) => {
                const items = slots.filter((s) => s.place === place)
                if (items.length === 0) return null
                return (
                  <div key={place}>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <h3 className="font-bold text-navy">{place}</h3>
                      <span className="text-xs font-medium text-navy/40">
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
      </div>

      {/* ───────── 신청 완료 토스트/오버레이 ───────── */}
      {success && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-6"
          onClick={() => setSuccess(null)}
        >
          <div
            className="bg-offwhite rounded-3xl p-6 max-w-sm w-full text-center space-y-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-3xl">🙂</p>
            <p className="font-bold text-navy text-lg">신청 접수 완료!</p>
            <p className="text-sm text-navy/60">매칭이 확정되면 카톡으로 안내드릴게요.</p>
            <p className="text-xs text-navy/40">
              {success.name}님 / {success.phone}
            </p>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="mt-3 w-full rounded-2xl bg-navy text-white font-bold py-3"
            >
              확인
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccess(null)
                setMyAppsOpen(true)
              }}
              className="w-full text-sm text-navy/50 hover:text-navy underline underline-offset-2 pt-1"
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
