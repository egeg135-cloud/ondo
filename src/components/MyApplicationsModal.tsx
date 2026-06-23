import { useEffect, useState } from 'react'
import { formatDateLabel } from '../lib/dates'
import { cancelApplication, getMyApplications, type MyApplication } from '../lib/api'
import { signInWithKakao, useSession } from '../lib/auth'
import { paceText } from '../types'
import type { ApplicationStatus } from '../types'

interface MyApplicationsModalProps {
  open: boolean
  onClose: () => void
}

const STATUS_STYLE: Record<ApplicationStatus, { label: string; cls: string }> = {
  applied:   { label: '신청 접수', cls: 'bg-gray-200 text-gray-700' },
  confirmed: { label: '매칭 확정', cls: 'bg-gray-900 text-white' },
  cancelled: { label: '취소됨',   cls: 'bg-gray-100 text-gray-400' },
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
  const canSelfCancel = app.status === 'applied'

  return (
    <div className="rounded-2xl bg-[#F5F5F5] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {app.slot ? (
            <p className="font-bold text-gray-900">
              {formatDateLabel(app.slot.date)} · {app.slot.place}
              {app.slot.pace_label ? ` · ${paceText(app.slot.pace_label)} 페이스` : ''}
            </p>
          ) : (
            <p className="font-bold text-gray-900">희망 신청</p>
          )}

          {!app.slot && (
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
