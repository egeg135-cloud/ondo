// 신청자 구성 시각화 — "나랑 비슷한 사람들이 신청했다"는 사회적 증거 (트레바리 멤버 차트 패턴)
import { useEffect, useState } from 'react'
import { getApplicantDemographics, type DemographicRow } from '../lib/api'

const DIMENSION_META: { key: DemographicRow['dimension']; title: string; unit: string }[] = [
  { key: 'pace', title: '페이스', unit: '러너' },
  { key: 'age', title: '연령대', unit: '러너' },
  { key: 'gender', title: '성별', unit: '러너' },
]

// 연령대/페이스 표시 순서 고정 (집계 순서가 뒤죽박죽 오지 않도록)
const LABEL_ORDER: Record<string, string[]> = {
  pace: ['6분 페이스', '7분 페이스', '기타'],
  age: ['20대 초반', '20대 후반', '30대 초반', '30대 후반', '40대+', '비공개'],
  gender: ['남', '여', '비공개'],
}

// DB 값 → 표시용 라벨
const DISPLAY_LABEL: Record<string, string> = { 남: '남성', 여: '여성' }
const displayLabel = (l: string) => DISPLAY_LABEL[l] ?? l

export function MemberStats() {
  const [rows, setRows] = useState<DemographicRow[]>([])

  useEffect(() => {
    getApplicantDemographics().then(setRows).catch(() => setRows([]))
  }, [])

  const total = rows.filter((r) => r.dimension === 'gender').reduce((s, r) => s + r.cnt, 0)
  if (total < 3) return null // 데이터 빈약하면 미노출

  return (
    <section className="mt-14">
      <h2 className="text-xl font-bold text-gray-900 mb-1">ONDO에 신청한 러너들은</h2>
      <p className="text-sm text-gray-400 mb-5">지금까지 신청한 {total}명의 구성이에요.</p>
      <div className="space-y-6">
        {DIMENSION_META.map((dim) => (
          <DimensionChart key={dim.key} rows={rows.filter((r) => r.dimension === dim.key)} dimKey={dim.key} />
        ))}
      </div>
    </section>
  )
}

function DimensionChart({ rows, dimKey }: { rows: DemographicRow[]; dimKey: string }) {
  if (rows.length === 0) return null
  const total = rows.reduce((s, r) => s + r.cnt, 0)
  if (total === 0) return null

  // 고정 순서로 정렬, 0건 라벨은 생략
  const order = LABEL_ORDER[dimKey] ?? []
  const sorted = [...rows].sort(
    (a, b) => (order.indexOf(a.label) + 1 || 99) - (order.indexOf(b.label) + 1 || 99),
  )
  const top = rows.reduce((m, r) => (r.cnt > m.cnt ? r : m), rows[0])

  return (
    <div className="rounded-2xl bg-[#F5F5F5] p-5">
      {/* 인사이트 문장 */}
      <p className="text-sm text-gray-700 leading-relaxed mb-4">
        <span className="font-bold text-gray-900">{displayLabel(top.label)} 러너가</span> 가장 많아요.
      </p>
      {/* 가로 막대 */}
      <div className="space-y-2.5">
        {sorted.map((r) => {
          const pct = Math.round((r.cnt / total) * 100)
          const isTop = r.label === top.label
          return (
            <div key={r.label} className="flex items-center gap-2.5">
              <span className="w-[72px] shrink-0 text-xs text-gray-500">{displayLabel(r.label)}</span>
              <div className="flex-1 h-4 rounded-full bg-gray-200/60 overflow-hidden">
                <div
                  className={'h-full rounded-full transition-all duration-500 ' + (isTop ? 'bg-[#FF5A1F]' : 'bg-gray-300')}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <span className={'w-9 shrink-0 text-right text-xs font-semibold ' + (isTop ? 'text-[#FF5A1F]' : 'text-gray-400')}>
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
