import type { SlotWithStats } from '../lib/api'
import { formatDateLabel } from '../lib/dates'
import { paceText } from '../types'

interface SlotCardProps {
  slot: SlotWithStats
  onApply: (slot: SlotWithStats) => void
}

export function SlotCard({ slot, onApply }: SlotCardProps) {
  const { stats } = slot
  const { count, isFull, isAlmostFull } = stats
  const paceLabel = slot.pace_label ? `${paceText(slot.pace_label)} 페이스` : null

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900 text-base">{formatDateLabel(slot.date)}</span>
          {isAlmostFull && !isFull ? (
            <Badge className="bg-gray-200 text-gray-700">마감임박</Badge>
          ) : null}
        </div>

        <div className="mt-1.5 text-sm text-gray-500 flex items-center gap-x-2 gap-y-1 flex-wrap">
          <span className={isFull ? 'text-gray-300' : 'text-gray-900 font-semibold'}>
            {count}/{slot.max_members}명
          </span>
          {paceLabel && <Dot label={paceLabel} />}
        </div>
      </div>

      <button
        type="button"
        disabled={isFull}
        onClick={() => onApply(slot)}
        className={
          'shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ' +
          (isFull
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : 'bg-gray-900 text-white active:scale-[0.98]')
        }
      >
        {isFull ? '마감' : '신청'}
      </button>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + className}>
      {children}
    </span>
  )
}

function Dot({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2 before:content-['·'] before:text-gray-300">
      {label}
    </span>
  )
}
