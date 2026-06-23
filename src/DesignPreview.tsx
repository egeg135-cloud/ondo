import { useState } from 'react'
import { SlotCard } from './components/SlotCard'
import { ApplyModal, type ApplySuccessInfo } from './components/ApplyModal'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { formatDateLabel } from './lib/dates'
import type { SlotWithStats } from './lib/api'
import type { ApplicationStatus } from './types'
import { EVENT_GOAL_COUNT } from './lib/api'

const DUMMY_SLOTS: SlotWithStats[] = [
  {
    id: 's1', date: '2026-06-28', place: '여의도', max_members: 5,
    pace_label: 'B', status: 'open', created_at: '',
    stats: { count: 2, female: 1, male: 1, ageLabel: null, isFull: false, isAlmostFull: false },
  },
  {
    id: 's2', date: '2026-06-29', place: '여의도', max_members: 5,
    pace_label: 'C', status: 'open', created_at: '',
    stats: { count: 4, female: 2, male: 2, ageLabel: null, isFull: false, isAlmostFull: true },
  },
  {
    id: 's3', date: '2026-06-28', place: '반포', max_members: 5,
    pace_label: 'A', status: 'open', created_at: '',
    stats: { count: 5, female: 3, male: 2, ageLabel: null, isFull: true, isAlmostFull: false },
  },
  {
    id: 's4', date: '2026-06-30', place: '반포', max_members: 5,
    pace_label: 'C', status: 'open', created_at: '',
    stats: { count: 1, female: 0, male: 1, ageLabel: null, isFull: false, isAlmostFull: false },
  },
]

const DUMMY_MEMBER_COUNT = 312
const progress = Math.min(100, Math.round((DUMMY_MEMBER_COUNT / EVENT_GOAL_COUNT) * 100))

const DUMMY_APPS: Array<{
  id: string
  status: ApplicationStatus
  created_at: string
  slot: { date: string; place: string; pace_label: string | null; status: string } | null
  wish_places_weekday: string[] | null
  wish_places_weekend: string[] | null
  wish_dates: string[] | null
}> = [
  {
    id: 'a1', status: 'confirmed', created_at: '2026-06-20T12:00:00Z',
    slot: { date: '2026-06-28', place: '여의도', pace_label: 'B', status: 'open' },
    wish_places_weekday: null, wish_places_weekend: null, wish_dates: null,
  },
  {
    id: 'a2', status: 'applied', created_at: '2026-06-18T09:00:00Z',
    slot: null,
    wish_places_weekday: ['반포', '여의도'],
    wish_places_weekend: ['반포'],
    wish_dates: ['2026-06-27', '2026-06-28', '2026-07-04'],
  },
  {
    id: 'a3', status: 'cancelled', created_at: '2026-06-10T15:00:00Z',
    slot: { date: '2026-06-15', place: '반포', pace_label: 'C', status: 'closed' },
    wish_places_weekday: null, wish_places_weekend: null, wish_dates: null,
  },
]

const STATUS_STYLE: Record<ApplicationStatus, { label: string; cls: string }> = {
  applied:   { label: '신청 접수', cls: 'bg-gray-200 text-gray-700' },
  confirmed: { label: '매칭 확정', cls: 'bg-gray-900 text-white' },
  cancelled: { label: '취소됨',   cls: 'bg-gray-100 text-gray-400' },
}

const PLACE_ORDER = ['여의도', '반포']

export default function DesignPreview() {
  const [applyOpen, setApplyOpen] = useState(false)
  const [slotApplyOpen, setSlotApplyOpen] = useState(false)
  const [success, setSuccess] = useState<ApplySuccessInfo | null>(null)

  return (
    <div className="min-h-screen bg-black flex justify-center">
      {/* 프리뷰 배너 */}
      <div className="bg-yellow-400 text-black text-xs font-bold text-center py-2 tracking-wide fixed top-0 left-0 right-0 z-[100]">
        🎨 DESIGN PREVIEW — 더미 데이터 / Supabase 연결 없음
      </div>

      <Navbar session={null} onMyApps={() => {}} />

      <div className="w-full max-w-[550px] bg-white flex flex-col mt-8">

        {/* ══════════════════════════════════════════
            1. 히어로 섹션
        ══════════════════════════════════════════ */}
        <Section title="1. 히어로 섹션">
          <div
            className="relative flex flex-col justify-end overflow-hidden rounded-2xl"
            style={{ height: '480px', backgroundImage: 'url(/run.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative z-10 px-4 pb-8 pt-14">
              <p className="ml-1 text-xs tracking-[0.5em] text-white/60 font-extralight uppercase">ONDO</p>
              <h1 className="mt-4 text-3xl font-bold text-white leading-snug">
                큰 러닝크루는 부담되지만,<br />혼자서는 운동이 안되는 당신을 위해.
              </h1>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">
                날짜·장소만 고르면 3~5명의 소그룹과 함께<br />부담없이 달릴 수 있습니다.
              </p>
              <div className="mt-6">
                <p className="text-xs tracking-wide text-white/50 font-medium">
                  현재 무료 이벤트 · 선착순 {EVENT_GOAL_COUNT.toLocaleString()}명
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {DUMMY_MEMBER_COUNT.toLocaleString()}
                  <span className="text-base font-normal text-white/60"> / {EVENT_GOAL_COUNT.toLocaleString()}명 참여</span>
                </p>
                <div className="mt-3 h-0.5 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full bg-white transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <button type="button" className="mt-6 w-full rounded-2xl bg-white text-gray-900 font-bold py-4 text-base">
                5초 만에 신청하기
              </button>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            2. 슬롯 목록
        ══════════════════════════════════════════ */}
        <Section title="2. 슬롯 목록">
          <div className="mx-4 space-y-8 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">이번 주 열린 모임</h2>
            {PLACE_ORDER.map((place) => {
              const items = DUMMY_SLOTS.filter((s) => s.place === place)
              if (items.length === 0) return null
              return (
                <div key={place}>
                  <div className="flex items-baseline gap-2 mb-3">
                    <h3 className="font-bold text-gray-900">{place}</h3>
                    <span className="text-xs text-gray-500">{items.length}개 모임</span>
                  </div>
                  <div className="space-y-3">
                    {items.map((slot) => <SlotCard key={slot.id} slot={slot} onApply={() => {}} />)}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            3. 슬롯 없음
        ══════════════════════════════════════════ */}
        <Section title="3. 슬롯 없음 상태">
          <div className="rounded-2xl bg-[#F5F5F5] p-6 text-center">
            <p className="text-sm text-gray-500">아직 열린 모임이 없어요.</p>
            <p className="text-xs text-gray-400 mt-1">위에서 희망 날짜·장소로 미리 신청하면 매칭해 드려요.</p>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            4. 신청 완료 오버레이 (인라인)
        ══════════════════════════════════════════ */}
        <Section title="4. 신청 완료 오버레이">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-[0_0_40px_rgba(0,0,0,0.13)] mx-auto">
            <p className="text-3xl">🙂</p>
            <p className="mt-2 mb-2 font-bold text-gray-900 text-xl">신청 접수 완료!</p>
            <p className="mt-1 text-sm text-gray-500">매칭이 확정되면 카톡으로 안내드릴게요.</p>
            <p className="mt-1 mb-4 text-xs text-gray-400">정재현님 / 010-1234-5678</p>
            <button type="button" className="mt-4 w-full rounded-2xl bg-gray-900 text-white font-bold py-3">확인</button>
            <button type="button" className="w-full text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2 pt-1">내 신청 내역 보기</button>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            5. 신청 모달 열기
        ══════════════════════════════════════════ */}
        <Section title="5. 신청 모달">
          <div className="space-y-3">
            <button type="button" onClick={() => setApplyOpen(true)} className="w-full rounded-2xl bg-gray-900 text-white font-bold py-3">
              일반 신청 모달 열기 (5초 만에 신청)
            </button>
            <button type="button" onClick={() => setSlotApplyOpen(true)} className="w-full rounded-2xl bg-gray-100 text-gray-500 font-bold py-3">
              슬롯 직접 신청 모달 열기 (6/28 여의도 B)
            </button>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            6. 내 신청 내역 (인라인)
        ══════════════════════════════════════════ */}
        <Section title="6. 내 신청 내역">
          <div className="bg-white rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.13)]">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <h2 className="text-lg text-gray-900"><span className="font-bold">정재현님</span><span className="font-normal">의 신청 내역</span></h2>
              <button type="button" className="text-gray-400 text-xl leading-none px-2 py-1">✕</button>
            </div>
            <div className="px-5 py-4 space-y-3">
{DUMMY_APPS.map((app) => <MockAppItem key={app.id} app={app} />)}
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            6b. 내 신청 내역 — 취소 확인
        ══════════════════════════════════════════ */}
        <Section title="6c. 내 신청 내역 — 취소 확인">
          <div className="bg-white rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.13)]">
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-lg text-gray-900"><span className="font-bold">정재현님</span><span className="font-normal">의 신청 내역</span></h2>
            </div>
            <div className="px-5 py-4">
              <div className="rounded-2xl bg-[#F5F5F5] p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-gray-900">희망 신청</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">신청 접수</span>
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  <p className="-mt-5 mb-4 text-sm text-gray-500">정말 취소할까요?</p>
                  <button type="button" className="w-full rounded-2xl bg-gray-900 text-white font-bold py-3">취소하기</button>
                  <button type="button" className="w-full rounded-2xl bg-gray-200 text-gray-500 font-bold py-3">아니오</button>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <div className="pb-8" />
      </div>

      <div className="w-full max-w-[550px] fixed bottom-0">
        {/* Footer는 스크롤 끝에 위치 — 아래 실제 렌더 */}
      </div>

      <Footer />

      {/* 모달들 */}
      <ApplyModal
        open={applyOpen}
        slot={null}
        onClose={() => setApplyOpen(false)}
        onSuccess={(info) => { setApplyOpen(false); setSuccess(info) }}
      />
      <ApplyModal
        open={slotApplyOpen}
        slot={DUMMY_SLOTS[0]}
        onClose={() => setSlotApplyOpen(false)}
        onSuccess={(info) => { setSlotApplyOpen(false); setSuccess(info) }}
      />

      {success && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6" onClick={() => setSuccess(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-[0_0_40px_rgba(0,0,0,0.13)]" onClick={(e) => e.stopPropagation()}>
            <p className="text-3xl">🙂</p>
            <p className="mt-2 mb-2 font-bold text-gray-900 text-xl">신청 접수 완료!</p>
            <p className="mt-1 text-sm text-gray-500">매칭이 확정되면 카톡으로 안내드릴게요.</p>
            <p className="mt-1 mb-4 text-xs text-gray-400">{success.name}님 / {success.phone}</p>
            <button type="button" onClick={() => setSuccess(null)} className="mt-4 w-full rounded-2xl bg-gray-900 text-white font-bold py-3">확인</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-4 mb-12">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold text-gray-400 tracking-wider uppercase whitespace-nowrap">{title}</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      {children}
    </div>
  )
}

function MockAppItem({ app }: { app: typeof DUMMY_APPS[number] }) {
  const status = STATUS_STYLE[app.status]
  const [confirming, setConfirming] = useState(false)
  const canSelfCancel = app.status === 'applied'

  return (
    <div className="rounded-2xl bg-[#F5F5F5] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {app.slot ? (
            <p className="font-bold text-gray-900">
              {formatDateLabel(app.slot.date)} · {app.slot.place}
              {app.slot.pace_label ? ` · 페이스 ${app.slot.pace_label}` : ''}
            </p>
          ) : (
            <p className="font-bold text-gray-900">희망 신청</p>
          )}
          {!app.slot && (
            <div className="mt-1 text-xs text-gray-500 space-y-0.5">
              {app.wish_places_weekday && app.wish_places_weekday.length > 0 && <p>평일: {app.wish_places_weekday.join(', ')}</p>}
              {app.wish_places_weekend && app.wish_places_weekend.length > 0 && <p>주말: {app.wish_places_weekend.join(', ')}</p>}
              {app.wish_dates && app.wish_dates.length > 0 && <p>날짜: {app.wish_dates.slice().sort().map(formatDateLabel).join(', ')}</p>}
            </div>
          )}
        </div>
        <span className={'shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ' + status.cls}>{status.label}</span>
      </div>

      {app.status === 'confirmed' && (
        <p className="mt-2 text-xs text-gray-500">
          매칭이 확정된 모임이에요. 취소가 필요하면 운영진에게 카톡으로 연락해 주세요.
        </p>
      )}

      {canSelfCancel && (
        <div className="mt-4">
          {confirming ? (
            <div className="flex flex-col gap-2">
              <p className="-mt-4 mb-4 text-sm text-gray-500">정말 취소할까요?</p>
              <button type="button" className="w-full rounded-2xl bg-gray-900 text-white font-bold py-3">취소하기</button>
              <button type="button" onClick={() => setConfirming(false)} className="w-full rounded-2xl bg-gray-200 text-gray-500 font-bold py-3">아니오</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="w-full rounded-2xl bg-gray-900 text-white font-bold py-3">신청 취소</button>
          )}
        </div>
      )}
    </div>
  )
}
