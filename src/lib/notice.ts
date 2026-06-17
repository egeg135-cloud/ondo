import { PLACE_INFO } from '../types'
import type { Place } from '../types'
import { formatDateLabel } from './dates'

const ACCOUNT = '카카오뱅크 3333-37-0096737 (김무관)'
const DEPOSIT = '5,000원'
const REJOIN_FEE = '4,900원'
const MEET_TIME = '저녁 7시'

/**
 * 매칭 안내 카톡 메시지 생성 (1인 1메시지).
 * 신규(첫 참여)는 참가비 무료, 재참여는 회당 4,900원 안내.
 */
export function buildNotice(opts: {
  name: string
  date: string // YYYY-MM-DD
  place: Place
  isReturning: boolean
}): string {
  const { name, date, place, isReturning } = opts
  const info = PLACE_INFO[place]
  const feeLine = isReturning
    ? `재참여시라 참가비 ${REJOIN_FEE}이 있어요.`
    : `첫 참여라 참가비는 무료예요.`

  return [
    `안녕하세요 ${name}님! ONDO 운영팀입니다 🙂`,
    ``,
    `${formatDateLabel(date)} ${MEET_TIME} ${place}한강공원 모임에 매칭되어 안내드려요!`,
    `${feeLine}`,
    `노쇼 방지 보증금 ${DEPOSIT}만 입금 확인되면 그룹방으로 초대드릴게요.`,
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
