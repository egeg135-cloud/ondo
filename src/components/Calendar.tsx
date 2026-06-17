import { useEffect, useRef, useState } from 'react'
import { toISODate } from '../lib/dates'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

interface CalendarProps {
  selected: string[] // 선택된 날짜 (YYYY-MM-DD)
  onChange: (next: string[]) => void
  /** 현재 달 기준 앞으로 몇 달까지 이동 허용 (0=이번 달만, 1=다음 달까지) */
  monthsAhead?: number
}

/**
 * 다중 선택 캘린더.
 * - 지난 날짜는 회색 처리 + 선택 불가(마감)
 * - 이번 달 ~ (이번 달 + monthsAhead) 까지 좌우 이동
 * - 요일 헤더(일~토) 탭 → 그 달의 해당 요일 전체 토글
 * - 날짜 위를 드래그하면 연속 선택/해제
 */
export function Calendar({ selected, onChange, monthsAhead = 1 }: CalendarProps) {
  const today = new Date()
  const todayIso = toISODate(today)
  const curIndex = today.getFullYear() * 12 + today.getMonth()

  const [viewIndex, setViewIndex] = useState(curIndex)
  const year = Math.floor(viewIndex / 12)
  const month = viewIndex % 12

  const canPrev = viewIndex > curIndex
  const canNext = viewIndex < curIndex + monthsAhead

  const firstDayOffset = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  // ── 드래그 선택 ──
  const dragMode = useRef<null | 'add' | 'remove'>(null)
  const working = useRef<Set<string>>(new Set())

  useEffect(() => {
    const end = () => {
      dragMode.current = null
    }
    window.addEventListener('pointerup', end)
    return () => window.removeEventListener('pointerup', end)
  }, [])

  function startDrag(iso: string) {
    working.current = new Set(selected)
    const mode = working.current.has(iso) ? 'remove' : 'add'
    dragMode.current = mode
    if (mode === 'add') working.current.add(iso)
    else working.current.delete(iso)
    onChange([...working.current])
  }
  function dragOver(iso: string) {
    if (!dragMode.current) return
    if (dragMode.current === 'add') working.current.add(iso)
    else working.current.delete(iso)
    onChange([...working.current])
  }

  // ── 요일 헤더 탭: 그 달의 해당 요일(선택 가능한 날) 전체 토글 ──
  function toggleWeekday(dow: number) {
    const isos: string[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      const iso = toISODate(date)
      if (iso < todayIso) continue
      if (date.getDay() === dow) isos.push(iso)
    }
    if (isos.length === 0) return
    const set = new Set(selected)
    const allOn = isos.every((i) => set.has(i))
    if (allOn) isos.forEach((i) => set.delete(i))
    else isos.forEach((i) => set.add(i))
    onChange([...set])
  }

  return (
    <div className="rounded-2xl border border-navy/15 bg-white p-3 select-none">
      {/* 월 이동 헤더 */}
      <div className="flex items-center justify-between px-1 mb-2">
        <button
          type="button"
          onClick={() => canPrev && setViewIndex(viewIndex - 1)}
          disabled={!canPrev}
          aria-label="이전 달"
          className="w-8 h-8 rounded-lg text-navy disabled:text-navy/20 hover:bg-navy/5 disabled:hover:bg-transparent"
        >
          ‹
        </button>
        <span className="text-sm font-bold text-navy">
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          onClick={() => canNext && setViewIndex(viewIndex + 1)}
          disabled={!canNext}
          aria-label="다음 달"
          className="w-8 h-8 rounded-lg text-navy disabled:text-navy/20 hover:bg-navy/5 disabled:hover:bg-transparent"
        >
          ›
        </button>
      </div>

      {/* 요일 헤더 (탭하면 그 요일 전체 토글) */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w, i) => (
          <button
            key={w}
            type="button"
            onClick={() => toggleWeekday(i)}
            title={`${w}요일 전체 선택/해제`}
            className={
              'text-center text-xs font-semibold py-1 rounded-md hover:bg-navy/5 transition-colors ' +
              (i === 0 ? 'text-rose-400' : i === 6 ? 'text-blue-400' : 'text-navy/50')
            }
          >
            {w}
          </button>
        ))}
      </div>

      {/* 날짜 그리드 (드래그 선택 가능) */}
      <div className="grid grid-cols-7 gap-1" style={{ touchAction: 'none' }}>
        {cells.map((d, idx) => {
          if (d === null) return <div key={`b${idx}`} />
          const iso = toISODate(new Date(year, month, d))
          const dow = (firstDayOffset + d - 1) % 7
          const isPast = iso < todayIso
          const isToday = iso === todayIso
          const isSelected = selected.includes(iso)

          return (
            <button
              key={iso}
              type="button"
              disabled={isPast}
              aria-pressed={isSelected}
              onPointerDown={() => !isPast && startDrag(iso)}
              onPointerEnter={() => !isPast && dragOver(iso)}
              className={
                'aspect-square rounded-lg text-sm flex items-center justify-center transition-colors ' +
                (isPast
                  ? 'text-navy/20 line-through cursor-not-allowed'
                  : isSelected
                    ? 'bg-navy text-white font-bold'
                    : (dow === 0 ? 'text-rose-500 ' : dow === 6 ? 'text-blue-500 ' : 'text-navy ') +
                      'hover:bg-navy/5') +
                (isToday && !isSelected ? ' ring-1 ring-sand' : '')
              }
            >
              {d}
            </button>
          )
        })}
      </div>

      <p className="text-[11px] text-navy/40 mt-2 text-center">
        요일(일~토)을 누르면 그 요일 전체 선택 · 날짜 위를 드래그해도 돼요
      </p>
    </div>
  )
}
