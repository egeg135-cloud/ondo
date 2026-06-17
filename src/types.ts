// ───────────────────────── 도메인 타입 (Supabase 테이블과 1:1) ─────────────────────────

export type Gender = '남' | '여'
export type Pace = 'A' | 'B' | 'C' | 'D'
export type Place = '반포' | '여의도' | '종로'
export type SlotStatus = 'open' | 'closed' | 'confirmed'
export type ApplicationStatus = 'applied' | 'confirmed' | 'cancelled'

export interface User {
  id: string
  phone: string
  name: string
  gender: Gender | null
  age_range: string | null
  pace: Pace | null
  total_count: number
  no_show_count: number
  created_at: string
}

export interface Slot {
  id: string
  date: string // YYYY-MM-DD
  place: Place
  max_members: number
  pace_label: string | null
  status: SlotStatus
  created_at: string
}

export interface Application {
  id: string
  user_id: string
  slot_id: string | null
  wish_places: Place[] | null // (구버전) 일반 신청의 희망 장소
  wish_places_weekday: Place[] | null // 일반 신청: 평일 희망 장소
  wish_places_weekend: Place[] | null // 일반 신청: 주말 희망 장소
  wish_dates: string[] | null // 일반 신청의 희망 날짜(YYYY-MM-DD)
  status: ApplicationStatus
  paid: boolean
  invited: boolean
  created_at: string
}

// ───────────────────────── 페이스 기준 (UI 표기용) ─────────────────────────

export const PACE_DESC: Record<Pace, string> = {
  A: '걷기',
  B: '가벼운 조깅 (7~8분대)',
  C: '러닝 (6분대)',
  D: '빠른 러닝 (5분대)',
}

export const PACE_ORDER: Record<Pace, number> = { A: 0, B: 1, C: 2, D: 3 }

// 장소별 집합지 안내
export const PLACE_INFO: Record<Place, { point: string; map: string }> = {
  반포: { point: '반포한강공원 세빛섬 입구 앞', map: 'https://naver.me/G9UKjVxG' },
  종로: { point: '종각역 4번 출구 보신각 앞', map: 'https://naver.me/GDQU9jkJ' },
  여의도: { point: '여의나루역 2번 출구 앞', map: '' },
}
