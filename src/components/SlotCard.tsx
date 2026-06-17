import type { SlotWithStats } from '../lib/api'
import { formatDateLabel } from '../lib/dates'

interface SlotCardProps {
  slot: SlotWithStats
  onApply: (slot: SlotWithStats) => void
}

export function SlotCard({ slot, onApply }: SlotCardProps) {
  const { stats } = slot
  const { count, female, male, ageLabel, isFull, isAlmostFull } = stats

  return (
    <div className="rounded-2xl bg-white border border-navy/10 p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        {/* 날짜 · 장소 + 뱃지 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-navy">{formatDateLabel(slot.date)}</span>
          {isFull ? (
            <Badge className="bg-navy/10 text-navy/50">마감</Badge>
          ) : isAlmostFull ? (
            <Badge className="bg-amber-100 text-amber-700">마감임박</Badge>
          ) : null}
        </div>

        {/* 인원 + 메타 */}
        <div className="mt-1.5 text-sm text-navy/60 flex items-center gap-x-2 gap-y-1 flex-wrap">
          <span className={isFull ? 'text-navy/40' : 'text-sand font-semibold'}>
            {count}/{slot.max_members}명
          </span>
          {slot.pace_label && <Dot label={`페이스 ${slot.pace_label}`} />}
          {ageLabel && <Dot label={ageLabel} />}
          {count > 0 && <Dot label={`여${female}남${male}`} />}
        </div>
      </div>

      <button
        type="button"
        disabled={isFull}
        onClick={() => onApply(slot)}
        className={
          'shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ' +
          (isFull
            ? 'bg-navy/10 text-navy/40 cursor-not-allowed'
            : 'bg-navy text-white active:scale-[0.98]')
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
    <span className="flex items-center gap-2 before:content-['·'] before:text-navy/30">
      {label}
    </span>
  )
}
