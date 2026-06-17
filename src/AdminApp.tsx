import { useEffect, useMemo, useState } from 'react'
import {
  adminListApplications,
  assignSlot,
  createSlot,
  getAllSlots,
  updateApplication,
  type AdminApplication,
} from './lib/api'
import { formatDateLabel } from './lib/dates'
import { buildNotice } from './lib/notice'
import { PACE_ORDER } from './types'
import type { Pace, Place, Slot } from './types'

const PLACES: Place[] = ['여의도', '반포', '종로']

function getKeyFromUrl(): string {
  return new URLSearchParams(window.location.search).get('key') ?? ''
}

const STATUS_KO: Record<string, string> = {
  applied: '신청접수',
  confirmed: '매칭확정',
  cancelled: '취소',
}

// 신청자 목록을 CSV(엑셀)로 내려받기. 엑셀 한글 깨짐 방지용 BOM 포함.
function exportApplicantsCsv(apps: AdminApplication[]) {
  const headers = [
    '이름', '연락처', '페이스', '성별', '나이', '신규/재참여',
    '상태', '입금', '초대', '슬롯날짜', '슬롯장소',
    '희망평일장소', '희망주말장소', '희망날짜', '신청일시',
  ]
  const cell = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }
  const rows = apps.map((a) => [
    a.user_name,
    a.user_phone,
    a.user_pace ?? '',
    a.user_gender ?? '',
    a.user_age_range ?? '',
    a.user_total_count > 0 || a.prior_participations > 0
      ? `재참여(${a.prior_participations || a.user_total_count}회)`
      : '신규',
    STATUS_KO[a.status] ?? a.status,
    a.paid ? 'O' : '',
    a.invited ? 'O' : '',
    a.slot_date ?? '',
    a.slot_place ?? '',
    (a.wish_places_weekday ?? []).join(' '),
    (a.wish_places_weekend ?? []).join(' '),
    (a.wish_dates ?? []).slice().sort().join(' '),
    new Date(a.created_at).toLocaleString('ko-KR'),
  ])
  const csv = [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ondo_신청자_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface SlotGroup {
  slotId: string
  date: string | null
  place: Place | null
  paceLabel: string | null
  max: number | null
  apps: AdminApplication[]
}

export default function AdminApp() {
  const [key, setKey] = useState(getKeyFromUrl())
  const [keyInput, setKeyInput] = useState('')
  const [apps, setApps] = useState<AdminApplication[] | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [authFailed, setAuthFailed] = useState(false)
  const [error, setError] = useState('')

  async function load(k: string) {
    if (!k) return
    setLoading(true)
    setError('')
    setAuthFailed(false)
    try {
      const [a, s] = await Promise.all([adminListApplications(k), getAllSlots()])
      setApps(a)
      setSlots(s)
    } catch (e) {
      if (e instanceof Error && e.message === 'UNAUTHORIZED') setAuthFailed(true)
      else setError(e instanceof Error ? e.message : '오류가 발생했어요.')
      setApps(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (key) void load(key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { slotGroups, generalApps } = useMemo(() => {
    const active = (apps ?? []).filter((a) => a.status !== 'cancelled')
    // 모든 슬롯으로 그룹을 먼저 만든다 (신청 0명인 빈 슬롯도 보이도록)
    const map = new Map<string, SlotGroup>()
    for (const s of slots) {
      map.set(s.id, {
        slotId: s.id,
        date: s.date,
        place: s.place,
        paceLabel: s.pace_label,
        max: s.max_members,
        apps: [],
      })
    }
    const general: AdminApplication[] = []
    for (const a of active) {
      if (!a.slot_id) {
        general.push(a)
        continue
      }
      map.get(a.slot_id)?.apps.push(a)
    }
    const groups = [...map.values()].sort((x, y) => (x.date ?? '').localeCompare(y.date ?? ''))
    return { slotGroups: groups, generalApps: general }
  }, [apps, slots])

  const reload = () => void load(key)
  const openSlots = slots.filter((s) => s.status === 'open')

  if (!key || authFailed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <p className="text-sm tracking-[0.3em] text-sand font-semibold">ONDO ADMIN</p>
          <h1 className="text-xl font-bold text-navy">운영자 전용</h1>
          {authFailed && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
              키가 올바르지 않아요.
            </p>
          )}
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="운영자 키 입력"
            className="w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-navy focus:outline-none focus:border-navy/50"
          />
          <button
            type="button"
            onClick={() => {
              setKey(keyInput)
              void load(keyInput)
            }}
            className="w-full rounded-2xl bg-navy text-white font-bold py-3"
          >
            들어가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.25em] text-sand font-semibold">ONDO ADMIN</p>
            <h1 className="text-xl font-bold text-navy">운영자 대시보드</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => exportApplicantsCsv(apps ?? [])}
              disabled={!apps || apps.length === 0}
              className="text-sm font-semibold text-navy underline underline-offset-2 disabled:text-navy/30 disabled:no-underline"
            >
              엑셀 내보내기
            </button>
            <button type="button" onClick={reload} className="text-sm text-navy/60 underline underline-offset-2">
              새로고침
            </button>
          </div>
        </header>

        {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

        {/* 슬롯 생성 */}
        <SlotCreateForm adminKey={key} onCreated={reload} />

        {loading && <p className="text-sm text-navy/50">불러오는 중…</p>}

        {/* 모임별 신청자 */}
        <section className="space-y-4">
          <h2 className="font-bold text-navy">모임별 신청자</h2>
          {slotGroups.length === 0 ? (
            <p className="text-sm text-navy/50">아직 슬롯에 들어온 신청이 없어요.</p>
          ) : (
            slotGroups.map((g) => (
              <SlotGroupCard key={g.slotId} group={g} adminKey={key} onChange={reload} />
            ))
          )}
        </section>

        {/* 일반 신청 */}
        <section className="space-y-3">
          <h2 className="font-bold text-navy">일반 신청 (희망 날짜·장소)</h2>
          {generalApps.length === 0 ? (
            <p className="text-sm text-navy/50">일반 신청이 없어요.</p>
          ) : (
            <div className="space-y-2">
              {generalApps.map((a) => (
                <div key={a.application_id} className="rounded-xl bg-white border border-navy/10 p-3">
                  <ApplicantRow a={a} adminKey={key} onChange={reload} />
                  <div className="mt-1 text-xs text-navy/55 space-y-0.5">
                    {a.wish_places_weekday?.length ? <p>평일: {a.wish_places_weekday.join(', ')}</p> : null}
                    {a.wish_places_weekend?.length ? <p>주말: {a.wish_places_weekend.join(', ')}</p> : null}
                    {a.wish_dates?.length ? (
                      <p>날짜: {a.wish_dates.slice().sort().map(formatDateLabel).join(', ')}</p>
                    ) : null}
                  </div>
                  <SlotAssign app={a} adminKey={key} openSlots={openSlots} onChange={reload} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

// ───────────────────────── 슬롯 생성 폼 ─────────────────────────
function SlotCreateForm({ adminKey, onCreated }: { adminKey: string; onCreated: () => void }) {
  const [date, setDate] = useState('')
  const [place, setPlace] = useState<Place>('여의도')
  const [max, setMax] = useState(5)
  const [paceLabel, setPaceLabel] = useState('B')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit() {
    if (!date) {
      setMsg('날짜를 골라주세요.')
      return
    }
    setBusy(true)
    setMsg('')
    try {
      await createSlot(adminKey, { date, place, max_members: max, pace_label: paceLabel })
      setMsg('슬롯이 생성됐어요.')
      setDate('')
      onCreated()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl bg-white border border-navy/10 p-4 space-y-3">
      <h2 className="font-bold text-navy">슬롯(모임) 만들기</h2>
      <p className="text-xs text-navy/45">
        같은 날짜·장소로 여러 개 만들 수 있어요(인원 넘치면 새 그룹). 페이스 차이가 크면 분리해서 만드세요.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-navy/60">
          날짜
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-navy text-sm"
          />
        </label>
        <label className="text-xs text-navy/60">
          장소
          <select
            value={place}
            onChange={(e) => setPlace(e.target.value as Place)}
            className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-navy text-sm bg-white"
          >
            {PLACES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-navy/60">
          최대 인원
          <input
            type="number"
            min={2}
            max={10}
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-navy text-sm"
          />
        </label>
        <label className="text-xs text-navy/60">
          페이스 라벨
          <select
            value={paceLabel}
            onChange={(e) => setPaceLabel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-navy text-sm bg-white"
          >
            {(['A', 'B', 'C', 'D'] as const).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="rounded-xl bg-navy text-white font-bold px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {busy ? '생성 중…' : '슬롯 만들기'}
        </button>
        {msg && <span className="text-xs text-navy/60">{msg}</span>}
      </div>
    </section>
  )
}

// 일반 신청의 희망(장소/날짜)에 가장 잘 맞는 열린 슬롯 추천
function recommendSlot(app: AdminApplication, openSlots: Slot[]): Slot | null {
  const places = new Set([...(app.wish_places_weekday ?? []), ...(app.wish_places_weekend ?? [])])
  const dates = new Set(app.wish_dates ?? [])
  const byDate = [...openSlots].sort((a, b) => a.date.localeCompare(b.date))
  // 1순위: 장소+날짜 둘 다 일치 (가장 가까운 날)
  const exact = byDate.find((s) => places.has(s.place) && dates.has(s.date))
  if (exact) return exact
  // 2순위: 장소만 일치
  const placeOnly = byDate.find((s) => places.has(s.place))
  if (placeOnly) return placeOnly
  return null
}

// ───────────────────────── 일반 신청 → 슬롯 배정 ─────────────────────────
function SlotAssign({
  app,
  adminKey,
  openSlots,
  onChange,
}: {
  app: AdminApplication
  adminKey: string
  openSlots: Slot[]
  onChange: () => void
}) {
  const [slotId, setSlotId] = useState('')
  const [busy, setBusy] = useState(false)

  async function assign(targetId: string) {
    if (!targetId) return
    setBusy(true)
    try {
      await assignSlot(adminKey, app.application_id, targetId)
      onChange()
    } catch (e) {
      alert(e instanceof Error ? e.message : '배정 실패')
    } finally {
      setBusy(false)
    }
  }

  if (openSlots.length === 0) {
    return <p className="mt-2 text-xs text-navy/40">배정할 열린 슬롯이 없어요. 위에서 먼저 만들어 주세요.</p>
  }

  const rec = recommendSlot(app, openSlots)

  return (
    <div className="mt-2 space-y-1.5">
      {/* 추천 자동 배정 */}
      {rec && (
        <button
          type="button"
          onClick={() => void assign(rec.id)}
          disabled={busy}
          className="w-full rounded-lg bg-sand/20 text-navy text-xs font-semibold px-3 py-2 text-left disabled:opacity-40 hover:bg-sand/30"
        >
          ⭐ 추천 배정: {formatDateLabel(rec.date)} · {rec.place} · 페이스 {rec.pace_label ?? '?'}
        </button>
      )}
      {/* 수동 선택 */}
      <div className="flex items-center gap-2">
        <select
          value={slotId}
          onChange={(e) => setSlotId(e.target.value)}
          className="flex-1 rounded-lg border border-navy/15 px-2 py-1.5 text-xs text-navy bg-white"
        >
          <option value="">직접 슬롯 선택…</option>
          {openSlots.map((s) => (
            <option key={s.id} value={s.id}>
              {formatDateLabel(s.date)} · {s.place} · 페이스 {s.pace_label ?? '?'}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void assign(slotId)}
          disabled={busy || !slotId}
          className="shrink-0 rounded-lg bg-navy text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-40"
        >
          배정
        </button>
      </div>
    </div>
  )
}

// ───────────────────────── 슬롯 그룹 카드 ─────────────────────────
function SlotGroupCard({
  group,
  adminKey,
  onChange,
}: {
  group: SlotGroup
  adminKey: string
  onChange: () => void
}) {
  const [showNotice, setShowNotice] = useState(false)
  const warnings = computeWarnings(group)

  return (
    <div className="rounded-2xl bg-white border border-navy/10 p-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-navy">
          {group.date ? formatDateLabel(group.date) : '?'} · {group.place}
          {group.paceLabel ? ` · 페이스 ${group.paceLabel}` : ''}
        </p>
        <span className="text-sm text-sand font-semibold">
          {group.apps.length}/{group.max ?? 5}명
        </span>
      </div>

      {warnings.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {warnings.map((w) => (
            <span key={w} className="text-xs font-semibold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
              ⚠️ {w}
            </span>
          ))}
        </div>
      )}

      {group.apps.length === 0 ? (
        <p className="mt-3 text-sm text-navy/40">
          아직 신청자가 없어요. 아래 "일반 신청"에서 이 슬롯에 배정하면 채워져요.
        </p>
      ) : (
        <div className="mt-3 divide-y divide-navy/5">
          {group.apps.map((a) => (
            <div key={a.application_id} className="py-2">
              <ApplicantRow a={a} adminKey={adminKey} onChange={onChange} />
              <button
                type="button"
                onClick={() => void assignSlot(adminKey, a.application_id, null).then(onChange)}
                className="mt-1 text-[11px] text-navy/40 hover:text-rose-600 underline"
              >
                배정 해제
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowNotice((v) => !v)}
          disabled={group.apps.length === 0}
          className="text-sm font-semibold text-navy underline underline-offset-2 disabled:text-navy/30 disabled:no-underline"
        >
          {showNotice ? '카톡 공지 닫기' : '카톡 공지 생성'}
        </button>
        {showNotice && group.place && group.date && group.apps.length > 0 && (
          <div className="mt-2 space-y-2">
            {group.apps.map((a) => (
              <NoticeBlock
                key={a.application_id}
                text={buildNotice({
                  name: a.user_name,
                  date: group.date!,
                  place: group.place!,
                  isReturning: a.user_total_count > 0 || a.prior_participations > 0,
                })}
                name={a.user_name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NoticeBlock({ text, name }: { text: string; name: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="rounded-xl bg-offwhite border border-navy/10 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-navy">{name}님 공지</span>
        <button
          type="button"
          onClick={copy}
          className="text-xs font-semibold rounded-lg bg-navy text-white px-3 py-1"
        >
          {copied ? '복사됨 ✓' : '복사'}
        </button>
      </div>
      <pre className="text-xs text-navy/70 whitespace-pre-wrap font-sans leading-relaxed">{text}</pre>
    </div>
  )
}

// ───────────────────────── 신청자 행 (토글 포함) ─────────────────────────
function ApplicantRow({
  a,
  adminKey,
  onChange,
}: {
  a: AdminApplication
  adminKey: string
  onChange: () => void
}) {
  const [busy, setBusy] = useState(false)
  const isReturning = a.user_total_count > 0 || a.prior_participations > 0
  const isConfirmed = a.status === 'confirmed'

  async function patch(p: { paid?: boolean; invited?: boolean; status?: AdminApplication['status'] }) {
    setBusy(true)
    try {
      await updateApplication(adminKey, a.application_id, p)
      onChange()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-navy">{a.user_name}</span>
          <span className="text-sm text-navy/50">{a.user_phone}</span>
          {isReturning ? (
            <Tag className="bg-sand/20 text-sand">재참여 {a.prior_participations || a.user_total_count}회</Tag>
          ) : (
            <Tag className="bg-emerald-100 text-emerald-700">신규(무료)</Tag>
          )}
          {isConfirmed && <Tag className="bg-navy text-white">확정</Tag>}
        </div>
        <p className="text-xs text-navy/55 mt-0.5">
          페이스 {a.user_pace ?? '?'} · {a.user_gender ?? '?'} · {a.user_age_range ?? '?'}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        <ToggleTag on={a.paid} disabled={busy} onClick={() => patch({ paid: !a.paid })}>
          입금
        </ToggleTag>
        <ToggleTag on={a.invited} disabled={busy} onClick={() => patch({ invited: !a.invited })}>
          초대
        </ToggleTag>
        <button
          type="button"
          disabled={busy}
          onClick={() => patch({ status: isConfirmed ? 'applied' : 'confirmed' })}
          className={
            'text-xs font-semibold px-2 py-1 rounded-lg disabled:opacity-50 ' +
            (isConfirmed ? 'bg-navy/10 text-navy/60' : 'bg-navy text-white')
          }
        >
          {isConfirmed ? '확정해제' : '확정'}
        </button>
      </div>
    </div>
  )
}

function ToggleTag({
  on,
  disabled,
  onClick,
  children,
}: {
  on: boolean
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        'text-xs font-semibold px-2 py-1 rounded-lg disabled:opacity-50 ' +
        (on ? 'bg-emerald-100 text-emerald-700' : 'bg-navy/10 text-navy/40')
      }
    >
      {children} {on ? '✓' : '–'}
    </button>
  )
}

function Tag({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + className}>{children}</span>
}

// ───────────────────────── 경고 계산 ─────────────────────────
function computeWarnings(g: SlotGroup): string[] {
  const w: string[] = []
  const n = g.apps.length
  if (n > 0 && n < 3) w.push('3명 미만')

  const females = g.apps.filter((a) => a.user_gender === '여').length
  if (females === 1 && n > 1) w.push('여성 1명 단독')

  const paces = g.apps
    .map((a) => a.user_pace)
    .filter((p): p is Pace => !!p)
    .map((p) => PACE_ORDER[p])
  if (paces.length >= 2 && Math.max(...paces) - Math.min(...paces) >= 2) {
    w.push('페이스 2단계 이상 차이')
  }
  return w
}
