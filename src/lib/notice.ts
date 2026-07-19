import { BANK, DEPOSIT } from '../types'

const ACCOUNT = `${BANK.bank} ${BANK.number} (${BANK.holder})`
const MEET_TIME = '저녁 8시'
const MEET_PLACE = '여의도한강공원'
const MEET_POINT = '여의나루역 2번 출구 앞'

export function buildNotice(opts: {
  name: string
  plan: string | null // 'single' (무료화 후 단일 플랜)
  pace: string | null // 'C'=6:00, 'B'=7:00
  noticeExtra?: string | null // 운영자가 세션별로 입력한 공지사항
  openChatUrl?: string | null // 세션 오픈채팅 링크
}): string {
  const { name, pace, noticeExtra, openChatUrl } = opts
  const paceLabel = pace === 'C' ? '6:00 /km' : pace === 'B' ? '7:00 /km' : '페이스 확인 필요'

  return [
    `안녕하세요 ${name}님! ONDO 운영팀입니다 🙂`,
    ``,
    `매주 목요일 ${MEET_TIME} ${MEET_PLACE} 5km 모임에 매칭되어 안내드려요!`,
    `페이스 그룹: ${paceLabel}`,
    ``,
    `참가비는 무료예요. 보증금 ${DEPOSIT.amount} 입금이 확인되면 그룹방으로 초대드릴게요.`,
    `${ACCOUNT}`,
    ``,
    `🔒 보증금은 참석하면 다음 주로 자동 이월되고(다시 낼 필요 없어요), 그만두실 땐 언제든 전액 환급됩니다. 당일 노쇼 시에만 소멸돼요.`,
    ``,
    `📍 집합지: ${MEET_POINT}`,
    ...(noticeExtra ? ['', `📌 ${noticeExtra}`] : []),
    ...(openChatUrl ? ['', `💬 참여자 오픈채팅: ${openChatUrl}`] : []),
  ].join('\n')
}

/** 확정자용 전날 리마인드 메시지 (노쇼 방어) */
export function buildDayBeforeReminder(opts: {
  name: string
  pace: string | null // 'C'=6:00, 'B'=7:00
  openChatUrl?: string | null
}): string {
  const { name, pace, openChatUrl } = opts
  const paceLabel = pace === 'C' ? '6:00 /km' : pace === 'B' ? '7:00 /km' : '페이스 확인 필요'

  return [
    `${name}님, 내일이에요! 🏃`,
    ``,
    `내일(목) ${MEET_TIME} ${MEET_PLACE} 5km`,
    `페이스 그룹: ${paceLabel}`,
    `📍 집합지: ${MEET_POINT} (19:40까지 와주세요)`,
    ``,
    `페이스 맞는 메이트들이 ${name}님을 기다리고 있어요.`,
    `참석하면 보증금은 다음 주로 그대로 이월돼요. 내일 뵐게요!`,
    ...(openChatUrl ? ['', `💬 오픈채팅: ${openChatUrl}`] : []),
  ].join('\n')
}

/** 참석 이력 회원용 주간 재참여 안내 — 광고성: 마케팅 동의자에게만, (광고) 표기, 21~08시 금지 */
export function buildRejoinMessage(opts: { name: string }): string {
  const { name } = opts
  return [
    `(광고) [ONDO] ${name}님, 이번 주도 뛸까요? 🏃`,
    ``,
    `이번 주 목요일 ${MEET_TIME} ${MEET_PLACE} 5km`,
    `보증금이 이월되어 있어서 추가 입금 없이 바로 참여돼요.`,
    ``,
    `아래 링크에서 클릭 한 번이면 신청 끝!`,
    `${REJOIN_LINK}`,
    AD_FOOTER.trim(),
  ].join('\n')
}

// 재참여(기존 접점) 링크 — GA 채널 분리를 위해 UTM 부착
const REJOIN_LINK = 'https://ondo-match.vercel.app/?apply=1&utm_source=kakao&utm_medium=crm&utm_campaign=rejoin'
const LEAD_LINK = 'https://ondo-match.vercel.app/?apply=1&utm_source=kakao&utm_medium=crm&utm_campaign=free100'

// 광고성 메시지 공통 푸터 (정통망법 — 전송자 표기 + 무료 수신거부 안내. 21~08시 발송 금지)
const AD_FOOTER = `무료수신거부: 이 메시지에 '거부'라고 회신해 주세요.`

export type LeadReminderVariant = 'A' | 'B' | 'C'

/** 팝업 리드(미신청) 대상 리마인드 — 광고성: (광고) 표기·수신거부 필수, 21~08시 발송 금지 */
export function buildLeadReminder(variant: LeadReminderVariant): string {
  switch (variant) {
    case 'A':
      return [
        `(광고) [ONDO] OO님, 신청서 작성이 완료되지 않았어요!`,
        `이번 주 목요일 저녁 8시, 여의도 러닝 — 이제 참가비 무료예요.`,
        `지금 이어서 완료하시면 페이스 맞는 러너와 바로 매칭돼요.`,
        `${LEAD_LINK}`,
        AD_FOOTER.trim(),
      ].join('\n')
    case 'B':
      return [
        `(광고) [ONDO] OO님, 러닝 신청이 마무리되지 않았어요 🏃`,
        `이번 주 목요일 여의도, 나와 비슷한 페이스의 러너와 5km. 참가비는 무료!`,
        `남은 건 딱 한 걸음, 지금 완료해보세요.`,
        `${LEAD_LINK}`,
        AD_FOOTER.trim(),
      ].join('\n')
    case 'C':
      return [
        `(광고) [ONDO] OO님, 작성하시던 신청서가 아직 완료되지 않았어요.`,
        `이번 주 목요일 모집이 곧 마감돼요 — 놓치기 전에 마저 완료해주세요!`,
        `${LEAD_LINK}`,
        AD_FOOTER.trim(),
      ].join('\n')
  }
}

/** 보증금 미입금 신청자용 리마인드 메시지 */
export function buildPaymentReminder(opts: {
  name: string
  plan: string | null // 호환용 (무료화 후 미사용)
}): string {
  const { name } = opts

  return [
    `${name}님, ONDO 운영팀입니다 🙂`,
    ``,
    `신청해 주신 목요일 러닝 매칭이 보증금 확인 후 확정돼요!`,
    `보증금: ${DEPOSIT.amount} (참가비는 무료 · 참석하면 다음 주로 이월돼요)`,
    `${ACCOUNT}`,
    ``,
    `입금자명을 ${name}(으)로 부탁드려요.`,
    `수요일 23:59까지 확인된 분들로 이번 주 그룹을 확정합니다 🏃`,
  ].join('\n')
}

/** 기존 유료 신청자용 무료화 공지 + 환불 안내 (어드민 복사용) */
export function buildRefundNotice(opts: { name: string; plan: string | null }): string {
  const { name, plan } = opts
  const paid = plan === 'season' ? '19,000원 (4주 멤버십)' : '5,000원 (1회 체험권)'

  return [
    `${name}님, ONDO 운영팀입니다 🙂`,
    ``,
    `안내드릴 소식이 있어요. ONDO가 이번 주부터 전면 무료로 바뀝니다!`,
    `더 많은 러너와 목요일을 함께하기 위한 결정이에요.`,
    ``,
    `결제해 주신 ${paid}은 전액 환불해드릴게요.`,
    `환불받으실 계좌(은행/계좌번호/예금주)를 회신해 주시면 바로 처리하겠습니다.`,
    ``,
    `앞으로는 참가비 없이, 노쇼 방지 보증금 ${DEPOSIT.amount}만으로 참여할 수 있어요.`,
    `(참석하면 다음 주로 이월 · 그만둘 땐 전액 환급)`,
    ``,
    `혹시 10분만 시간 내주실 수 있다면 — 전화나 커피 한 잔으로 ONDO에 바라는 점을 듣고 싶어요.`,
    `인터뷰에 응해주신 분께는 다음 세션 우선 매칭을 약속드릴게요 🙏`,
  ].join('\n')
}
// 참고: 환불 안내는 정보성 메시지로 유지하기 위해 재참여 홍보·링크를 넣지 않는다 (광고성 재해석 방지).
// 재참여 유도는 buildRejoinMessage(광고 표기)로 별도 발송할 것.
