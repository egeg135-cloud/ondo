// ───────────────────────── 전화번호 / localStorage 유틸 ─────────────────────────

const LS_LAST_PHONE = 'ondo_last_phone'

/** 숫자만 남기고 010-XXXX-XXXX 형태로 정규화. 형식이 안 맞으면 null. */
export function normalizePhone(input: string): string | null {
  const digits = (input || '').replace(/\D/g, '')
  // 010 + 8자리 (총 11자리) 만 허용
  if (!/^010\d{8}$/.test(digits)) return null
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

/** 입력 중 실시간 하이픈 자동 삽입 (검증과 무관, 보기 편하게) */
export function formatPhoneInput(input: string): string {
  const d = (input || '').replace(/\D/g, '').slice(0, 11)
  if (d.length < 4) return d
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null
}

export function saveLastPhone(phone: string): void {
  try {
    localStorage.setItem(LS_LAST_PHONE, phone)
  } catch {
    // localStorage 사용 불가(시크릿 모드 등) — 무시
  }
}

export function getLastPhone(): string {
  try {
    return localStorage.getItem(LS_LAST_PHONE) ?? ''
  } catch {
    return ''
  }
}
