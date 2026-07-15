import { useEffect, useState } from 'react'
import { formatDateLabel, toISODate } from '../lib/dates'
import {
  cancelApplication,
  getConfirmedSessionStats,
  getMyApplications,
  getSessionInfo,
  submitSatisfactionCheck,
  type MyApplication,
} from '../lib/api'
import { signInWithKakao, useSession } from '../lib/auth'
import { paceText, PLACE_INFO } from '../types'
import type { ApplicationStatus, PaceBreakdown, SessionInfo } from '../types'

interface MyApplicationsModalProps {
  open: boolean
  onClose: () => void
}

const STATUS_STYLE: Record<ApplicationStatus, { label: string; cls: string }> = {
  applied:   { label: '대기중',   cls: 'bg-gray-200 text-gray-700' },
  confirmed: { label: '확정',     cls: 'bg-gray-900 text-white' },
  failed:    { label: '매칭실패', cls: 'bg-rose-100 text-rose-600' },
  cancelled: { label: '취소됨',   cls: 'bg-gray-100 text-gray-400' },
}

type SessionMap = Record<string, { info: SessionInfo | null; stats: PaceBreakdown[] }>

export function MyApplicationsModal({ open, onClose }: MyApplicationsModalProps) {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ name: string; apps: MyApplication[] } | null>(null)
  const [sessionMap, setSessionMap] = useState<SessionMap>({})
  const [error, setError] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (open && session) void load()
    if (!open) { setResult(null); setSessionMap({}) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session])

  async function load() {
    setError('')
    setLoading(true)
    try {
      const res = await getMyApplications()
      setResult(res)
      if (res) await loadSessionInfo(res.apps)
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했어요.')
    } finally {
      setLoading(false)
    }
  }

  async function loadSessionInfo(apps: MyApplication[]) {
    const dates = Array.from(
      new Set(
        apps
          .filter((a) => a.status === 'confirmed' && a.sessionDate)
          .map((a) => a.sessionDate as string),
      ),
    )
    if (dates.length === 0) return
    const entries = await Promise.all(
      dates.map(async (d) => {
        const [info, stats] = await Promise.all([getSessionInfo(d), getConfirmedSessionStats(d)])
        return [d, { info, stats }] as const
      }),
    )
    setSessionMap(Object.fromEntries(entries))
  }

  async function handleCancel(id: string) {
    setConfirmId(null)
    try {
      await cancelApplication(id)
      setResult((prev) =>
        prev
          ? { ...prev, apps: prev.apps.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)) }
          : prev,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : '취소에 실패했어요.')
    }
  }

  function handleSatisfactionSubmitted(id: string) {
    setResult((prev) =>
      prev
        ? { ...prev, apps: prev.apps.map((a) => (a.id === id ? { ...a, hasSatisfactionCheck: true } : a)) }
        : prev,
    )
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.13)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-lg text-gray-900">
              {result?.name
                ? <><span className="font-bold">{result.name}님</span><span className="font-normal">의 신청 내역</span></>
                : <span className="font-bold">내 신청 내역</span>}
            </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-gray-400 hover:text-gray-900 text-xl leading-none px-2 py-1"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {!session ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-sm text-gray-500">신청 내역은 로그인 후 볼 수 있어요.</p>
              <button
                type="button"
                onClick={() => void signInWithKakao()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#FEE500] text-[#191600] font-semibold px-4 py-2.5"
              >
                <img src="/kakao.png" alt="" className="w-4 h-4" /> 카카오로 로그인
              </button>
            </div>
          ) : (
            <>
              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>
              )}
              {loading && <p className="text-sm text-gray-400 py-6 text-center">불러오는 중…</p>}

              {result && (
                <>
{result.apps.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">아직 신청 내역이 없어요.</p>
                  ) : (
                    <div className="space-y-3">
                      {result.apps.map((app) => (
                        <ApplicationItem
                          key={app.id}
                          app={app}
                          sessionEntry={app.sessionDate ? sessionMap[app.sessionDate] : undefined}
                          userId={session.user.id}
                          confirming={confirmId === app.id}
                          onAskCancel={() => setConfirmId(app.id)}
                          onConfirmCancel={() => void handleCancel(app.id)}
                          onAbort={() => setConfirmId(null)}
                          onSatisfactionSubmitted={() => handleSatisfactionSubmitted(app.id)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ApplicationItem({
  app,
  sessionEntry,
  userId,
  confirming,
  onAskCancel,
  onConfirmCancel,
  onAbort,
  onSatisfactionSubmitted,
}: {
  app: MyApplication
  sessionEntry?: { info: SessionInfo | null; stats: PaceBreakdown[] }
  userId: string
  confirming: boolean
  onAskCancel: () => void
  onConfirmCancel: () => void
  onAbort: () => void
  onSatisfactionSubmitted: () => void
}) {
  const status = STATUS_STYLE[app.status]
  const canSelfCancel = app.status === 'applied'
  const isConfirmed = app.status === 'confirmed'
  const isFailed = app.status === 'failed'
  const totalConfirmed = sessionEntry?.stats.reduce((sum, p) => sum + p.count, 0) ?? 0

  const sessionPast = !!app.sessionDate && app.sessionDate < toISODate(new Date())
  const showSatisfaction = isConfirmed && sessionPast && !app.hasSatisfactionCheck

  return (
    <div className="rounded-2xl bg-[#F5F5F5] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {app.slot ? (
            <p className="font-bold text-gray-900">
              {formatDateLabel(app.slot.date)} · {app.slot.place}
              {app.slot.pace_label ? ` · ${paceText(app.slot.pace_label)} 페이스` : ''}
            </p>
          ) : isConfirmed && app.sessionDate ? (
            <p className="font-bold text-gray-900">
              {formatDateLabel(app.sessionDate)} · 여의도 · 저녁 8시
            </p>
          ) : (
            <p className="font-bold text-gray-900">희망 신청</p>
          )}

          {!app.slot && !isConfirmed && (
            <div className="mt-1 text-xs text-gray-500 space-y-0.5">
              {app.wish_places_weekday && app.wish_places_weekday.length > 0 && (
                <p>평일: {app.wish_places_weekday.join(', ')}</p>
              )}
              {app.wish_places_weekend && app.wish_places_weekend.length > 0 && (
                <p>주말: {app.wish_places_weekend.join(', ')}</p>
              )}
              {app.wish_dates && app.wish_dates.length > 0 && (
                <p>날짜: {app.wish_dates.slice().sort().map(formatDateLabel).join(', ')}</p>
              )}
            </div>
          )}
        </div>
        <span className={'shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ' + status.cls}>
          {status.label}
        </span>
      </div>

      {isFailed && (
        <p className="mt-2 text-xs text-gray-500">
          이번 주는 인원이 모이지 않았어요. 다음 주 다시 신청해 주세요.
        </p>
      )}

      {isConfirmed && (
        <div className="mt-3 rounded-xl bg-white border border-gray-200 p-3 space-y-2">
          <p className="text-xs text-gray-600">
            📍 {PLACE_INFO.여의도.point}
          </p>
          <p className="text-xs text-gray-600">
            확정 인원 {totalConfirmed}명
            {sessionEntry && sessionEntry.stats.length > 0 && (
              <span className="text-gray-400">
                {' '}({sessionEntry.stats.map((p) => `${p.label} 페이스 ${p.count}명`).join(' · ')})
              </span>
            )}
          </p>
          {sessionEntry?.info?.noticeText && (
            <p className="text-xs text-gray-700 bg-gray-50 rounded-lg px-2.5 py-2 leading-relaxed">
              📌 {sessionEntry.info.noticeText}
            </p>
          )}
          {sessionEntry?.info?.openChatUrl ? (
            <a
              href={sessionEntry.info.openChatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center rounded-xl bg-[#FEE500] text-[#191600] font-bold text-sm py-2.5"
            >
              참여자끼리 인사하기
            </a>
          ) : (
            <p className="text-center text-xs text-gray-400 py-1">오픈채팅 링크는 곧 안내드릴게요.</p>
          )}
          <p className="text-xs text-gray-400">취소가 필요하면 운영진에게 카톡으로 연락해 주세요.</p>
        </div>
      )}

      {showSatisfaction && (
        <SatisfactionForm
          applicationId={app.id}
          userId={userId}
          onSubmitted={onSatisfactionSubmitted}
        />
      )}

      {canSelfCancel && (
        <div className="mt-4">
          {confirming ? (
            <div className="flex flex-col gap-2">
              <p className="-mt-4 mb-4 text-sm text-gray-500">정말 취소할까요?</p>
              <button
                type="button"
                onClick={onConfirmCancel}
                className="w-full rounded-2xl bg-gray-900 text-white font-bold py-3"
              >
                취소하기
              </button>
              <button
                type="button"
                onClick={onAbort}
                className="w-full rounded-2xl bg-gray-200 text-gray-500 font-bold py-3"
              >
                아니오
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAskCancel}
              className="w-full rounded-2xl bg-gray-900 text-white font-bold py-3"
            >
              신청 취소
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function SatisfactionForm({
  applicationId,
  userId,
  onSubmitted,
}: {
  applicationId: string
  userId: string
  onSubmitted: () => void
}) {
  const [q1, setQ1] = useState<boolean | null>(null)
  const [q2, setQ2] = useState<boolean | null>(null)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (q1 === null || q2 === null) return
    setSubmitting(true)
    setError('')
    try {
      await submitSatisfactionCheck(applicationId, userId, q1, q2, reviewText)
      onSubmitted()
    } catch (e) {
      setError(e instanceof Error ? e.message : '제출에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-3 rounded-xl bg-white border border-gray-200 p-3 space-y-3">
      <p className="text-xs font-semibold text-gray-700">지난 세션은 어떠셨나요?</p>

      <OXQuestion label="운동 강도가 적절했나요?" value={q1} onChange={setQ1} />
      <OXQuestion label="다음에도 참여하고 싶나요?" value={q2} onChange={setQ2} />

      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value.slice(0, 200))}
        placeholder="한 줄 후기를 남겨주시면 큰 힘이 돼요 (선택)"
        rows={2}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 placeholder:text-gray-300 resize-none focus:outline-none focus:border-gray-900"
      />

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={q1 === null || q2 === null || submitting}
        className="w-full rounded-xl bg-gray-900 text-white font-bold py-2 text-sm disabled:opacity-30"
      >
        {submitting ? '제출 중…' : '제출하기'}
      </button>
    </div>
  )
}

function OXQuestion({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-gray-600">{label}</p>
      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={
            'w-8 h-8 rounded-lg text-sm font-bold ' +
            (value === true ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400')
          }
        >
          O
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={
            'w-8 h-8 rounded-lg text-sm font-bold ' +
            (value === false ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400')
          }
        >
          X
        </button>
      </div>
    </div>
  )
}
