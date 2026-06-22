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
          ? 'bg-gray-900 text-white border-gray-900 '
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 ') +
        className
      }
    >
      {children}
    </button>
  )
}
