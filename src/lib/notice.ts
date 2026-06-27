import { PLACE_INFO } from '../types'
import type { Place } from '../types'
import { formatDateLabel } from './dates'

const ACCOUNT = '카카오뱅크 3333-37-0096737 (김무관)'
const MEET_TIME = '저녁 8시'

export function buildNotice(opts: {
  name: string
  date: string // YYYY-MM-DD
  place: Place
  plan: string | null // 'single' | 'season'
}): string {
  const { name, date, place, plan } = opts
  const info = PLACE_INFO[place]

  const feeLine =
    plan === 'season'
      ? `4주 시즌권 신청자로, 참가비 10,000원 입금 부탁드려요.`
      : `1회권 신청자로, 참가비 5,000원 입금 부탁드려요.`

  return [
    `안녕하세요 ${name}님! ONDO 운영팀입니다 🙂`,
    ``,
    `${formatDateLabel(date)} ${MEET_TIME} ${place}한강공원 5km 모임에 매칭되어 안내드려요!`,
    `${feeLine}`,
    `입금 확인되면 그룹방으로 초대드릴게요.`,
    `${ACCOUNT}`,
    `모임 3일 전까지 100% 환급, 이후·당일 노쇼 환급 불가입니다.`,
    ``,
    `📍 집합지: ${info.point}`,
    info.map ? `${info.map}` : ``,
  ]
    .filter((line) => line !== null && line !== undefined)
    .join('\n')
    .trim()
}
