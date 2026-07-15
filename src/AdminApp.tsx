import { useEffect, useMemo, useState } from 'react'
import {
  adminListApplications,
  adminListLeads,
  adminSetPaceVerified,
  adminSetSessionNotice,
  getConfirmedSessionStats,
  getSessionInfo,
  updateApplication,
  type AdminApplication,
  type Lead,
} from './lib/api'
import {
  buildDayBeforeReminder,
  buildLeadReminder,
  buildNotice,
  buildPaymentReminder,
  buildRefundNotice,
  buildRejoinMessage,
  type LeadReminderVariant,
} from './lib/notice'
import { formatDateLabel, getUpcomingSessionDate } from './lib/dates'
import { paceText, planText, purposeText } from './types'
import type { PaceBreakdown, SessionInfo } from './types'

type Filter = 'all' | 'unpaid' | 'single' | 'season'

function getKeyFromUrl(): string {
  return new URLSearchParams(window.location.search).get('key') ?? ''
}

const STATUS_KO: Record<string, string> = {
  applied: '신청접수',
  confirmed: '매칭확정',
  failed: '매칭실패',
  cancelled: '취소',
}

function exportCsv(apps: AdminApplication[]) {
  const headers = [
    '이름', '연락처', '페이스', '성별', '나이', 'MBTI', '미가입',
    '이용권', '러닝목적', '5km가능', '기록인증', '추천코드', '마케팅동의',
    '상태', '보증금', '초대', '신청일시',
  ]
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = apps.map((a) => [
    a.user_name, a.user_phone, paceText(a.user_pace),
    a.user_gender ?? '', a.user_age_range ?? '', a.user_mbti ?? '',
    a.is_guest ? 'O' : '',
    planText(a.plan), purposeText(a.run_purpose),
    a.can_run_5k === true ? 'O' : a.can_run_5k === false ? 'X' : '',
    a.record_proof ?? '',
    (a as AdminApplication & { referral_code?: string }).referral_code ?? '',
    a.user_marketing_consent ? 'O' : '',
    STATUS_KO[a.status] ?? a.status,
    a.paid ? 'O' : '', a.invited ? 'O' : '',
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

export default function AdminApp() {
  const [key, setKey] = useState(getKeyFromUrl())
  const [keyInput, setKeyInput] = useState('')
  const [apps, setApps] = useState<AdminApplication[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [authFailed, setAuthFailed] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const sessionDate = getUpcomingSessionDate()
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [sessionStats, setSessionStats] = useState<PaceBreakdown[]>([])
  const [leads, setLeads] = useState<Lead[]>([])

  async function load(k: string) {
    if (!k) return
    setLoading(true)
    setError('')
    setAuthFailed(false)
    try {
      setApps(await adminListApplications(k))
    } catch (e) {
      if (e instanceof Error && e.message === 'UNAUTHORIZED') setAuthFailed(true)
      else setError(e instanceof Error ? e.message : '오류가 발생했어요.')
      setApps(null)
    } finally {
      setLoading(false)
    }
  }

  async function loadSession() {
    const [info, stats, leadList] = await Promise.all([
      getSessionInfo(sessionDate),
      getConfirmedSessionStats(sessionDate),
      adminListLeads(key),
    ])
    setSessionInfo(info)
    setSessionStats(stats)
    setLeads(leadList)
  }

  useEffect(() => {
    if (key) { void load(key); void loadSession() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const active = useMemo(() => (apps ?? []).filter((a) => a.status !== 'cancelled'), [apps])

  const filtered = useMemo(() => {
    if (filter === 'unpaid') return active.filter((a) => !a.paid)
    if (filter === 'single') return active.filter((a) => a.plan === 'single')
    if (filter === 'season') return active.filter((a) => a.plan === 'season')
    return active
  }, [active, filter])

  const summary = useMemo(() => ({
    total: active.length,
    paid: active.filter((a) => a.paid).length,
    single: active.filter((a) => a.plan === 'single').length,
    season: active.filter((a) => a.plan === 'season').length,
  }), [active])

  const reload = () => { void load(key); void loadSession() }

  if (!key || authFailed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <p className="text-sm tracking-[0.3em] text-sand font-semibold">ONDO ADMIN</p>
          <h1 className="text-xl font-bold text-navy">운영자 전용</h1>
          {authFailed && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">키가 올바르지 않아요.</p>
          )}
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (setKey(keyInput), load(keyInput))}
            placeholder="운영자 키 입력"
            className="w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-navy focus:outline-none focus:border-navy/50"
          />
          <button
            type="button"
            onClick={() => { setKey(keyInput); void load(keyInput) }}
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
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">

        {/* 헤더 */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.25em] text-sand font-semibold">ONDO ADMIN</p>
            <h1 className="text-xl font-bold text-navy">운영자 대시보드</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => exportCsv(apps ?? [])}
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

        {/* 이번 주 세션 관리 */}
        <SessionManagerCard
          adminKey={key}
          sessionDate={sessionDate}
          info={sessionInfo}
          stats={sessionStats}
          onSaved={() => void loadSession()}
        />

        {/* 리드 (팝업 수집 전화번호) */}
        <LeadsCard leads={leads} apps={apps ?? []} />

        {/* 요약 카드 */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '전체 신청', value: summary.total },
            { label: '보증금 확인', value: summary.paid },
            { label: '1회 체험권', value: summary.single },
            { label: '4주 멤버십', value: summary.season },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white border border-navy/10 p-3 text-center">
              <p className="text-2xl font-bold text-navy">{s.value}</p>
              <p className="text-[11px] text-navy/50 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2 flex-wrap">
          {([
            ['all', '전체'],
            ['unpaid', '보증금 전'],
            ['single', '1회 체험권'],
            ['season', '4주 멤버십'],
          ] as [Filter, string][]).map(([f, label]) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                'text-sm font-semibold px-3 py-1.5 rounded-full transition-colors ' +
                (filter === f ? 'bg-navy text-white' : 'bg-navy/10 text-navy/60')
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* 신청자 목록 */}
        {loading ? (
          <p className="text-sm text-navy/50">불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-navy/50">해당하는 신청자가 없어요.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => (
              <ApplicantCard
                key={a.application_id}
                a={a}
                adminKey={key}
                sessionDate={sessionDate}
                sessionInfo={sessionInfo}
                onChange={reload}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ───────────────────────── 리드 (팝업 수집 전화번호) ─────────────────────────
const LEAD_REMINDER_LABELS: Record<LeadReminderVariant, string> = {
  A: '멘트 A (완료편향)',
  B: '멘트 B (부드럽게)',
  C: '멘트 C (마감임박)',
}

function LeadsCard({ leads, apps }: { leads: Lead[]; apps: AdminApplication[] }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedVariant, setCopiedVariant] = useState<LeadReminderVariant | null>(null)

  // 이미 신청까지 간 번호는 제외하고 "미전환 리드"만 강조
  const appliedPhones = new Set(apps.map((a) => a.user_phone?.replace(/\D/g, '')))
  const pending = leads.filter((l) => !appliedPhones.has(l.phone.replace(/\D/g, '')))

  async function copyAll() {
    await navigator.clipboard.writeText(pending.map((l) => l.phone).join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function copyReminder(variant: LeadReminderVariant) {
    await navigator.clipboard.writeText(buildLeadReminder(variant))
    setCopiedVariant(variant)
    setTimeout(() => setCopiedVariant(null), 1500)
  }

  if (leads.length === 0) return null

  return (
    <section className="rounded-2xl bg-white border border-navy/10 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <h2 className="font-bold text-navy">
          팝업 리드 {leads.length}명
          {pending.length > 0 && (
            <span className="ml-2 text-xs font-semibold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
              미신청 {pending.length}명
            </span>
          )}
        </h2>
        <span className="text-navy/40 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {pending.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => void copyAll()}
                className="text-xs font-semibold rounded-lg bg-navy text-white px-3 py-1.5"
              >
                {copied ? '복사됨 ✓' : `미신청 번호 ${pending.length}개 복사`}
              </button>
              {(['A', 'B', 'C'] as LeadReminderVariant[]).map((variant) => (
                <button
                  key={variant}
                  type="button"
                  onClick={() => void copyReminder(variant)}
                  className="text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 px-3 py-1.5"
                >
                  {copiedVariant === variant ? '복사됨 ✓' : LEAD_REMINDER_LABELS[variant]}
                </button>
              ))}
            </div>
          )}
          <div className="divide-y divide-navy/5">
            {leads.map((l) => {
              const applied = appliedPhones.has(l.phone.replace(/\D/g, ''))
              return (
                <div key={l.id} className="py-1.5 flex items-center justify-between text-sm">
                  <span className={applied ? 'text-navy/40' : 'text-navy font-medium'}>{l.phone}</span>
                  <span className="text-xs text-navy/35">
                    {applied ? '신청 완료' : new Date(l.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

// ───────────────────────── 이번 주 세션 관리 ─────────────────────────
function SessionManagerCard({
  adminKey,
  sessionDate,
  info,
  stats,
  onSaved,
}: {
  adminKey: string
  sessionDate: string
  info: SessionInfo | null
  stats: PaceBreakdown[]
  onSaved: () => void
}) {
  const [noticeText, setNoticeText] = useState(info?.noticeText ?? '')
  const [openChatUrl, setOpenChatUrl] = useState(info?.openChatUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setNoticeText(info?.noticeText ?? '')
    setOpenChatUrl(info?.openChatUrl ?? '')
  }, [info])

  const total = stats.reduce((sum, p) => sum + p.count, 0)

  async function save() {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      await adminSetSessionNotice(adminKey, sessionDate, noticeText, openChatUrl)
      onSaved()
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했어요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl bg-white border border-navy/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-navy">이번 주 세션 · {formatDateLabel(sessionDate)}</h2>
        <span className="text-xs text-navy/50">
          확정 {total}명
          {stats.length > 0 && (
            <span className="text-navy/40">
              {' '}({stats.map((p) => `${p.label} ${p.count}명`).join(' · ')})
            </span>
          )}
        </span>
      </div>
      <textarea
        value={noticeText}
        onChange={(e) => setNoticeText(e.target.value)}
        placeholder="공지사항 (집합장소 변경, 우천 대응 등)"
        rows={2}
        className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy resize-none"
      />
      <input
        type="text"
        value={openChatUrl}
        onChange={(e) => setOpenChatUrl(e.target.value)}
        placeholder="카카오톡 오픈채팅 링크"
        className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy"
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="rounded-xl bg-navy text-white font-bold px-4 py-2 text-sm disabled:opacity-50"
      >
        {saving ? '저장 중…' : saved ? '저장됨 ✓' : '저장'}
      </button>
    </section>
  )
}

// ───────────────────────── 신청자 카드 ─────────────────────────
function ApplicantCard({
  a,
  adminKey,
  sessionDate,
  sessionInfo,
  onChange,
}: {
  a: AdminApplication
  adminKey: string
  sessionDate: string
  sessionInfo: SessionInfo | null
  onChange: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [showNotice, setShowNotice] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const [showDayBefore, setShowDayBefore] = useState(false)
  const [showRejoin, setShowRejoin] = useState(false)
  const [showRefund, setShowRefund] = useState(false)
  const isConfirmed = a.status === 'confirmed'
  const isFailed = a.status === 'failed'
  const isSeason = a.plan === 'season'
  const isPaceVerified = a.user_pace_verified === true

  async function togglePaceVerified() {
    if (!a.user_id) return
    setBusy(true)
    try {
      await adminSetPaceVerified(adminKey, a.user_id, !isPaceVerified)
      onChange()
    } catch (e) {
      alert(e instanceof Error ? e.message : '변경 실패')
    } finally {
      setBusy(false)
    }
  }

  async function patch(p: {
    paid?: boolean
    invited?: boolean
    status?: AdminApplication['status']
    sessionDate?: string
  }) {
    setBusy(true)
    try {
      await updateApplication(adminKey, a.application_id, p)
      onChange()
    } finally {
      setBusy(false)
    }
  }

  const referralCode = (a as AdminApplication & { referral_code?: string }).referral_code

  return (
    <div className="rounded-2xl bg-white border border-navy/10 p-4 space-y-3">
      {/* 상단: 이름·연락처·이용권 배지 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-navy text-base">{a.user_name}</span>
            <span className="text-sm text-navy/50">{a.user_phone}</span>
            {a.is_guest && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                미가입
              </span>
            )}
            <span className={
              'text-[11px] font-bold px-2 py-0.5 rounded-full ' +
              (isSeason ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700')
            }>
              {isSeason ? '👑 4주' : '1회'}
            </span>
            {isConfirmed && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-navy text-white">확정</span>
            )}
            {isFailed && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">매칭실패</span>
            )}
            {isPaceVerified && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✓ 기록검증</span>
            )}
          </div>

          {/* 세부 정보 */}
          <p className="text-xs text-navy/55 mt-1">
            {paceText(a.user_pace)} 페이스 · {a.user_gender ?? '?'} · {a.user_age_range ?? '?'}세
            {a.user_mbti ? ` · ${a.user_mbti}` : ''}
          </p>
          <p className="text-xs text-navy/45 mt-0.5">
            {purposeText(a.run_purpose) || '목적 미입력'}
            {a.can_run_5k === false ? ' · ⚠️ 5km 미완주' : ''}
            {a.record_proof ? ` · 📎 ${a.record_proof}` : ' · 기록 미인증'}
          </p>
          {referralCode && (
            <p className="text-xs text-emerald-600 mt-0.5">🎁 추천코드: {referralCode}</p>
          )}
          <p className="text-[11px] text-navy/30 mt-0.5">
            신청 {new Date(a.created_at).toLocaleString('ko-KR')}
          </p>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2 flex-wrap">
        <ToggleTag on={a.paid} disabled={busy} onClick={() => patch({ paid: !a.paid })}>
          보증금
        </ToggleTag>
        <ToggleTag on={a.invited} disabled={busy} onClick={() => patch({ invited: !a.invited })}>
          초대
        </ToggleTag>
        <button
          type="button"
          disabled={busy}
          onClick={() => patch({
            status: isConfirmed ? 'applied' : 'confirmed',
            sessionDate: isConfirmed ? undefined : sessionDate,
          })}
          className={
            'text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 ' +
            (isConfirmed ? 'bg-navy/10 text-navy/60' : 'bg-navy text-white')
          }
        >
          {isConfirmed ? '확정 해제' : '확정'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => patch({
            status: isFailed ? 'applied' : 'failed',
            sessionDate: isFailed ? undefined : sessionDate,
          })}
          className={
            'text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 ' +
            (isFailed ? 'bg-navy/10 text-navy/60' : 'bg-rose-50 text-rose-600')
          }
        >
          {isFailed ? '매칭실패 해제' : '매칭실패'}
        </button>
        <button
          type="button"
          onClick={() => setShowNotice((v) => !v)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sand/20 text-navy"
        >
          카톡 공지 {showNotice ? '▲' : '▼'}
        </button>
        {!a.paid && (
          <button
            type="button"
            onClick={() => setShowReminder((v) => !v)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700"
          >
            보증금 리마인드 {showReminder ? '▲' : '▼'}
          </button>
        )}
        {a.paid && (
          <button
            type="button"
            onClick={() => setShowRefund((v) => !v)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700"
          >
            무료화 환불 안내 {showRefund ? '▲' : '▼'}
          </button>
        )}
        {isConfirmed && (
          <button
            type="button"
            onClick={() => setShowDayBefore((v) => !v)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700"
          >
            전날 리마인드 {showDayBefore ? '▲' : '▼'}
          </button>
        )}
        {isSeason && (
          <button
            type="button"
            onClick={() => setShowRejoin((v) => !v)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700"
          >
            재참여 안내 {showRejoin ? '▲' : '▼'}
          </button>
        )}
        {a.user_id && (
          <ToggleTag on={isPaceVerified} disabled={busy} onClick={() => void togglePaceVerified()}>
            기록검증
          </ToggleTag>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (confirm(`${a.user_name}님 신청을 취소할까요?`)) {
              void patch({ status: 'cancelled' })
            }
          }}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-50"
        >
          취소
        </button>
      </div>

      {/* 카톡 공지 */}
      {showNotice && (
        <NoticeBlock
          text={buildNotice({
            name: a.user_name,
            plan: a.plan,
            pace: a.user_pace,
            noticeExtra: sessionInfo?.noticeText,
            openChatUrl: sessionInfo?.openChatUrl,
          })}
          name={a.user_name}
        />
      )}

      {/* 보증금 리마인드 */}
      {showReminder && !a.paid && (
        <NoticeBlock
          text={buildPaymentReminder({ name: a.user_name, plan: a.plan })}
          name={`${a.user_name}님 보증금 리마인드`}
        />
      )}

      {/* 무료화 환불 안내 (기존 유료 신청자) */}
      {showRefund && a.paid && (
        <NoticeBlock
          text={buildRefundNotice({ name: a.user_name, plan: a.plan })}
          name={`${a.user_name}님 환불 안내`}
        />
      )}

      {/* 전날 리마인드 (노쇼 방어) */}
      {showDayBefore && isConfirmed && (
        <NoticeBlock
          text={buildDayBeforeReminder({
            name: a.user_name,
            pace: a.user_pace,
            openChatUrl: sessionInfo?.openChatUrl,
          })}
          name={`${a.user_name}님 전날 리마인드`}
        />
      )}

      {/* 재참여 안내 (4주 멤버십) */}
      {showRejoin && isSeason && (
        <NoticeBlock
          text={buildRejoinMessage({ name: a.user_name })}
          name={`${a.user_name}님 재참여 안내`}
        />
      )}
    </div>
  )
}

function NoticeBlock({ text, name }: { text: string; name: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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

function ToggleTag({
  on, disabled, onClick, children,
}: {
  on: boolean; disabled: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        'text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 ' +
        (on ? 'bg-emerald-100 text-emerald-700' : 'bg-navy/10 text-navy/40')
      }
    >
      {children} {on ? '✓' : '–'}
    </button>
  )
}
