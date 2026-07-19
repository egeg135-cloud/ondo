// ───────────────────────── 도메인 타입 (Supabase 테이블과 1:1) ─────────────────────────

export type Gender = '남' | '여'
export type Pace = 'A' | 'B' | 'C' | 'D'
export type Place = '반포' | '여의도'
export type SlotStatus = 'open' | 'closed' | 'confirmed'
export type ApplicationStatus = 'applied' | 'confirmed' | 'cancelled' | 'failed'

export interface User {
  id: string
  phone: string
  name: string
  gender: Gender | null
  age_range: string | null
  pace: Pace | null
  total_count: number
  no_show_count: number
  marketing_consent?: boolean
  mbti?: string | null
  created_at: string
}

// 러닝 목적 (v3.1)
export const RUN_PURPOSES: { code: string; label: string }[] = [
  { code: 'record', label: '기록 준비' },
  { code: 'steady', label: '꾸준히 건강관리' },
]

// 입금 계좌 (성공 오버레이 · 카톡 안내 공용 — 여기 한 곳만 수정)
export const BANK = {
  bank: '카카오뱅크',
  number: '3333-37-0096737',
  holder: '김무관',
} as const

// 노쇼 방지 보증금 (무료화 후 유일한 금액 — 이월형)
// tossLink: 토스 익명 송금 링크(금액 10,000원 고정)를 발급받아 넣으면
// 신청 완료 화면에 "토스로 1초 송금" 버튼이 자동 노출된다. 비우면 계좌 복사만 표시.
export const DEPOSIT = {
  amount: '10,000원',
  tossLink: '',
  rules: [
    '참석하면 다음 주로 자동 이월 — 다시 낼 필요 없어요',
    '노쇼 시에만 소멸돼요',
    '그만둘 땐 언제든 전액 환급',
  ],
} as const

// 이용권 (무료화: 단일 플랜, 가격 대신 보증금 안내)
export const PLANS: {
  code: string
  label: string
  price: string
  originalPrice?: string
  desc: string
  badge?: string
}[] = [
  {
    code: 'single',
    label: '이번 주 참여',
    price: '무료',
    originalPrice: '5,000원',
    desc: `보증금 ${DEPOSIT.amount} — 참석하면 다음 주로 이월, 그만둘 땐 전액 환급.`,
  },
]

export function planText(code: string | null | undefined): string {
  const p = PLANS.find((x) => x.code === code)
  return p ? `${p.label}(${p.price})` : (code ?? '')
}
export function purposeText(code: string | null | undefined): string {
  return RUN_PURPOSES.find((x) => x.code === code)?.label ?? code ?? ''
}

// 약관·개인정보·연락처 (푸터·신청폼 공용)
export const POLICY = {
  privacy: 'https://dorian-thunbergia-809.notion.site/ONDO-3887ea42434580138a6bce698008b09d',
  terms:
    'https://dorian-thunbergia-809.notion.site/ONDO-3757ea424345802eb105fcebe84595c1?source=copy_link',
  email: 'motipeople.official@gmail.com',
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

// ───────────────────────── 페이스 기준 (파일럿: 6:00 / 7:00 두 그룹만) ─────────────────────────
// 페이스 = 1km당 분:초. DB(users.pace)는 A~D 제약이라 코드로 저장하고 표시만 숫자로.
//   6:00 → 'C' ,  7:00 → 'B'
export const PACE_PICK: { code: Pace; label: string; range: string; desc: string }[] = [
  { code: 'C', label: '6분 페이스', range: '약 5:30~6:30 /km', desc: '이미 꾸준히 뛰는 분' },
  { code: 'B', label: '7분 페이스', range: '약 6:30~7:30 /km', desc: '가볍게 완주 가능한 분' },
]

const PACE_NUM: Record<string, string> = {
  C: '6:00',
  B: '7:00',
  '6:00': '6:00',
  '7:00': '7:00',
  A: '걷기',
  D: '빠른 러닝',
}

/** 페이스 코드/라벨 → 표시용 숫자 라벨 (예: 'C' → '6:30'). 모르는 값은 그대로. */
export function paceText(p: string | null | undefined): string {
  if (!p) return ''
  return PACE_NUM[p] ?? p
}

export const PACE_ORDER: Record<Pace, number> = { A: 0, B: 1, C: 2, D: 3 }

// 매칭확정 · 소통 기능 (v3.2)
export interface SessionInfo {
  sessionDate: string
  noticeText: string | null
  openChatUrl: string | null
}
export interface PaceBreakdown {
  pace: string
  label: string
  count: number
}

// 장소별 집합지 안내 (파일럿: 여의도 · 반포 두 거점)
export const PLACE_INFO: Record<Place, { point: string; map: string }> = {
  반포: { point: '반포한강공원 세빛섬 입구 앞', map: 'https://naver.me/G9UKjVxG' },
  여의도: { point: '여의나루역 2번 출구 앞', map: '' },
}
