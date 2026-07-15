import { useState } from 'react'
import type { Pace } from '../types'

interface PaceOption {
  code: Pace
  label: string
  range: string
}

const PACE_OPTIONS: PaceOption[] = [
  { code: 'C', label: '6분 페이스', range: '약 5:30~6:30 /km' },
  { code: 'B', label: '7분 페이스', range: '약 6:30~7:30 /km' },
]

interface PaceQuickModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (pace: Pace) => void
}

export function PaceQuickModal({ open, onClose, onConfirm }: PaceQuickModalProps) {
  const [selected, setSelected] = useState<Pace | null>(null)
  const [warn, setWarn] = useState(false)

  if (!open) return null

  function handleConfirm() {
    if (!selected) {
      setWarn(true)
      return
    }
    onConfirm(selected)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-bold text-gray-900 text-lg">페이스 선택</p>
        <p className="mt-1 text-sm text-gray-500">이번 주 목요일 20:00 · 여의나루</p>

        <div className="mt-4 space-y-2">
          {PACE_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => { setSelected(opt.code); setWarn(false) }}
              className={
                'w-full flex items-center justify-between rounded-2xl border px-4 py-3.5 transition-colors ' +
                (selected === opt.code
                  ? 'border-[#FF5A1F] bg-[#FF5A1F]/5'
                  : 'border-gray-200 bg-white')
              }
            >
              <span className="text-left">
                <span className="block font-bold text-gray-900">{opt.label}</span>
                <span className="block text-xs text-gray-400">{opt.range}</span>
              </span>
              {selected === opt.code && <span className="text-sm font-bold text-[#FF5A1F]">✓</span>}
            </button>
          ))}
        </div>

        {warn && <p className="mt-2 text-xs text-rose-500">페이스를 선택해주세요</p>}

        <button
          type="button"
          onClick={handleConfirm}
          className="mt-4 w-full rounded-2xl bg-[#FF5A1F] text-white font-bold py-3.5 active:scale-[0.99] transition-transform"
        >
          이번 주 자리 신청하기
        </button>
        <button type="button" onClick={onClose} className="mt-2 w-full text-xs text-gray-400 py-2">
          닫기
        </button>
      </div>
    </div>
  )
}
