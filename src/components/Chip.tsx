// ───────────────────────── 선택 칩 (탭하듯 고르는 버튼) ─────────────────────────
interface ChipProps {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}

export function Chip({ selected, onClick, children, className = '' }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        'rounded-full px-4 py-2.5 text-sm font-medium border transition-colors ' +
        (selected
          ? 'bg-navy text-white border-navy '
          : 'bg-white text-navy/80 border-navy/15 hover:border-navy/40 ') +
        className
      }
    >
      {children}
    </button>
  )
}
