import { useEffect, useState } from 'react'
import { formatDateLabel } from '../lib/dates'
import { cancelApplication, getMyApplications, type MyApplication } from '../lib/api'
import { signInWithKakao, useSession } from '../lib/auth'
import type { ApplicationStatus } from '../types'

interface MyApplicationsModalProps {
  open: boolean
  onClose: () => void
}

const STATUS_STYLE: Record<ApplicationStatus, { label: string; cls: string }> = {
  applied: { label: '신청 접수', cls: 'bg-sand/15 text-sand' },
  confirmed: { label: '매칭 확정', cls: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: '취소됨', cls: 'bg-navy/10 text-navy/40' },
}

export function MyApplicationsModal({ open, onClose }: MyApplicationsModalProps) {
  const { session } = useSession()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ name: string; apps: MyApplication[] } | null>(null)
  const [error, setError] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (open && session) void load()
    if (!open) setResult(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session])

  async function load() {
    setError('')
    setLoading(true)
    try {
      setResult(await getMyApplications())
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했어요.')
    } finally {
      setLoading(false)
    }
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

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-offwhite rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-offwhite/95 backdrop-blur px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">내 신청 내역</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-navy/40 hover:text-navy text-xl leading-none px-2 py-1"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {!session ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-sm text-navy/60">신청 내역은 로그인 후 볼 수 있어요.</p>
              <button
                type="button"
                onClick={() => void signInWithKakao()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#FEE500] text-[#191600] font-semibold px-4 py-2.5"
              >
                <span aria-hidden>💬</span> 카카오로 로그인
              </button>
            </div>
          ) : (
            <>
              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>
              )}
              {loading && <p className="text-sm text-navy/50 py-6 text-center">불러오는 중…</p>}

              {result && (
                <>
                  <p className="text-sm text-navy/70">
                    <span className="font-semibold text-navy">{result.name}</span>님의 신청 내역
                  </p>
                  {result.apps.length === 0 ? (
                    <p className="text-sm text-navy/60 py-6 text-center">아직 신청 내역이 없어요.</p>
                  ) : (
                    <div className="space-y-3">
                      {result.apps.map((app) => (
                        <ApplicationItem
                          key={app.id}
                          app={app}
                          confirming={confirmId === app.id}
                          onAskCancel={() => setConfirmId(app.id)}
                          onConfirmCancel={() => void handleCancel(app.id)}
                          onAbort={() => setConfirmId(null)}
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
  confirming,
  onAskCancel,
  onConfirmCancel,
  onAbort,
}: {
  app: MyApplication
  confirming: boolean
  onAskCancel: () => void
  onConfirmCancel: () => void
  onAbort: () => void
}) {
  const status = STATUS_STYLE[app.status]
  // 신청 접수(applied) 상태만 본인이 취소 가능.
  // 확정(confirmed)은 보증금/매칭이 걸려 있어 운영진 연락으로만.
  const canSelfCancel = app.status === 'applied'

  return (
    <div className="rounded-2xl bg-white border border-navy/10 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {app.slot ? (
            <p className="font-bold text-navy">
              {formatDateLabel(app.slot.date)} · {app.slot.place}
              {app.slot.pace_label ? ` · 페이스 ${app.slot.pace_label}` : ''}
            </p>
          ) : (
            <p className="font-bold text-navy">희망 신청</p>
          )}

          {!app.slot && (
            <div className="mt-1 text-xs text-navy/55 space-y-0.5">
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

      {app.status === 'confirmed' && (
        <p className="mt-2 text-xs text-navy/50 bg-navy/5 rounded-lg px-3 py-2">
          매칭이 확정된 모임이에요. 취소가 필요하면 운영진에게 카톡으로 연락해 주세요.
        </p>
      )}

      {canSelfCancel && (
        <div className="mt-3 flex justify-end">
          {confirming ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-navy/60">정말 취소할까요?</span>
              <button
                type="button"
                onClick={onConfirmCancel}
                className="rounded-lg bg-rose-600 text-white font-semibold px-3 py-1.5"
              >
                네, 취소
              </button>
              <button
                type="button"
                onClick={onAbort}
                className="rounded-lg bg-navy/10 text-navy font-semibold px-3 py-1.5"
              >
                아니오
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAskCancel}
              className="text-sm text-navy/50 hover:text-rose-600 underline"
            >
              신청 취소
            </button>
          )}
        </div>
      )}
    </div>
  )
}
