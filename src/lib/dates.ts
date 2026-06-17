// ───────────────────────── 날짜 유틸 ─────────────────────────
// 신청 모달의 "희망 날짜 칩"에 쓸, 오늘부터 다음 주 일요일까지의 날짜 목록을 만든다.

const WEEKDAY_KR = ['일', '월', '화', '수', '목', '금', '토']

export interface DateChip {
  iso: string // YYYY-MM-DD (DB 저장용)
  label: string // "7/2(목)" (표시용)
  isWeekend: boolean
}

/** 로컬 타임존 기준 YYYY-MM-DD 문자열 (toISOString 의 UTC 밀림 방지) */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** "7/2(목)" 형태의 짧은 라벨 */
export function formatDateLabel(iso: string): string {
  const d = parseISODate(iso)
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAY_KR[d.getDay()]})`
}

/** YYYY-MM-DD 를 로컬 자정 Date 로 (타임존 밀림 없이) */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 주말(토/일) 여부 */
export function isWeekendISO(iso: string): boolean {
  const dow = parseISODate(iso).getDay()
  return dow === 0 || dow === 6
}

/**
 * 오늘부터 다음 주 일요일까지의 날짜 칩 목록.
 * "이번 주 ~ 다음 주" 범위를 다중선택용으로 제공한다.
 */
export function getDateChips(from: Date = new Date()): DateChip[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  // 다음 주 일요일까지: 이번 주 남은 일수 + 다음 주 7일
  const daysUntilSunday = 7 - start.getDay() // 오늘이 일요일이면 7
  const total = daysUntilSunday + 7
  const chips: DateChip[] = []
  for (let i = 0; i < total; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const iso = toISODate(d)
    chips.push({
      iso,
      label: formatDateLabel(iso),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    })
  }
  return chips
}
