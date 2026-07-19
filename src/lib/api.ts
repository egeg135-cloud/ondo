import { supabase } from './supabase'
import { normalizePhone } from './format'
import { paceText } from '../types'
import type {
  ApplicationStatus,
  Gender,
  Pace,
  PaceBreakdown,
  Place,
  SessionInfo,
  Slot,
  SlotStatus,
  User,
} from '../types'

/** 친절한 에러 메시지를 담는 커스텀 에러 */
export class FriendlyError extends Error {}

const EVENT_GOAL = 500 // 무료 이벤트 목표 인원
export const EVENT_GOAL_COUNT = EVENT_GOAL

// ───────────────────────── 랜딩 집계 (PII 없는 함수 호출) ─────────────────────────
export interface SlotStats {
  count: number
  female: number
  male: number
  ageLabel: string | null
  isFull: boolean
  isAlmostFull: boolean
}
export interface SlotWithStats extends Slot {
  stats: SlotStats
}

/** open 슬롯 + 신청 집계 (서버 함수, 개인정보 노출 0) */
export async function getOpenSlotsWithStats(): Promise<SlotWithStats[]> {
  const { data, error } = await supabase.rpc('get_open_slots_with_stats')
  if (error) {
    console.error('[ONDO] getOpenSlotsWithStats 실패:', error)
    return []
  }
  type Row = {
    id: string
    date: string
    place: Place
    max_members: number
    pace_label: string | null
    status: SlotStatus
    cnt: number
    female: number
    male: number
    age_label: string | null
  }
  return (data as Row[]).map((r) => {
    const remaining = r.max_members - r.cnt
    return {
      id: r.id,
      date: r.date,
      place: r.place,
      max_members: r.max_members,
      pace_label: r.pace_label,
      status: r.status,
      created_at: '',
      stats: {
        count: r.cnt,
        female: r.female,
        male: r.male,
        ageLabel: r.age_label,
        isFull: remaining <= 0,
        isAlmostFull: remaining > 0 && remaining <= 2,
      },
    }
  })
}

/** 이벤트 참여 인원 수 (서버 함수) */
export async function getUsersCount(): Promise<number> {
  const { data, error } = await supabase.rpc('get_member_count')
  if (error) {
    console.error('[ONDO] getUsersCount 실패:', error)
    return 0
  }
  return (data as number) ?? 0
}

// ───────────────────────── 내 프로필 / 신청 ─────────────────────────
/** 로그인 유저의 프로필 (없으면 null) */
export async function getMyProfile(): Promise<User | null> {
  const { data: au } = await supabase.auth.getUser()
  if (!au.user) return null
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', au.user.id)
    .maybeSingle()
  if (error) {
    console.error('[ONDO] getMyProfile 실패:', error)
    return null
  }
  return data as User | null
}

export interface ApplicationForm {
  name: string
  phone: string
  gender: Gender
  ageRange: string
  pace: Pace
  mbti?: string
  slotId?: string
  wishPlacesWeekday?: Place[]
  wishPlacesWeekend?: Place[]
  wishDates?: string[]
  marketingConsent?: boolean
  // v3.1
  canRun5k?: boolean
  runPurpose?: string // 'record' | 'steady'
  plan?: string // 'single' | 'season'
  recordProof?: string // 기록 인증 링크/메모
  referralCode?: string // 친구 추천 코드 (이름+전화번호뒷4자리)
  ageGap?: number // 나이차이 매칭 범위 (기본 7)
}

/**
 * 신청 제출.
 * - 로그인 상태면: 본인 프로필(users) upsert 후 applications insert (신원 = auth.uid()).
 * - 비로그인 상태면: 로그인 없이 바로 접수 (submit_guest_application RPC).
 *   이후 카카오 로그인하면 같은 전화번호의 게스트 신청이 자동으로 내 계정에 연결된다.
 */
export async function submitApplication(
  form: ApplicationForm,
): Promise<{ applicationId: string }> {
  const phone = normalizePhone(form.phone)
  if (!phone) {
    throw new FriendlyError('연락처 형식이 올바르지 않아요. 010-1234-5678 형태로 입력해 주세요.')
  }

  const { data: au } = await supabase.auth.getUser()
  const userId = au.user?.id

  if (!userId) {
    const { data, error } = await supabase.rpc('submit_guest_application', {
      p_name: form.name.trim(),
      p_phone: phone,
      p_gender: form.gender,
      p_age_range: form.ageRange,
      p_pace: form.pace,
      p_mbti: form.mbti?.trim() || null,
      p_can_run_5k: form.canRun5k ?? null,
      p_run_purpose: form.runPurpose ?? null,
      p_plan: form.plan ?? null,
      p_record_proof: form.recordProof?.trim() || null,
      p_referral_code: form.referralCode?.trim() || null,
      p_marketing_consent: form.marketingConsent ?? false,
      p_wish_places_weekday: form.wishPlacesWeekday ?? [],
      p_wish_places_weekend: form.wishPlacesWeekend ?? [],
      p_wish_dates: form.wishDates ?? [],
    })
    if (error) {
      if (error.message?.includes('duplicate_recent')) {
        throw new FriendlyError('이미 같은 번호로 신청하셨어요. 카카오 로그인 후 내 신청 내역에서 확인할 수 있어요.')
      }
      console.error('[ONDO] submit_guest_application 실패:', error)
      throw new FriendlyError('신청을 접수하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.')
    }
    return { applicationId: data as string }
  }

  // 1) 본인 프로필 upsert (id = auth.uid()). total_count 등은 건드리지 않음.
  const { error: profErr } = await supabase.from('users').upsert(
    {
      id: userId,
      phone,
      name: form.name.trim(),
      gender: form.gender,
      age_range: form.ageRange,
      pace: form.pace,
      mbti: form.mbti?.trim() || null,
      marketing_consent: form.marketingConsent ?? false,
    },
    { onConflict: 'id' },
  )
  if (profErr) {
    console.error('[ONDO] 프로필 저장 실패:', profErr)
    throw new FriendlyError('신청 정보를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
  }

  // 2) applications insert
  const appRow: Record<string, unknown> = {
    user_id: userId,
    can_run_5k: form.canRun5k ?? null,
    run_purpose: form.runPurpose ?? null,
    plan: form.plan ?? null,
    record_proof: form.recordProof?.trim() || null,
    referral_code: form.referralCode?.trim() || null,
  }
  if (form.slotId) {
    appRow.slot_id = form.slotId
  } else {
    appRow.wish_places_weekday = form.wishPlacesWeekday ?? []
    appRow.wish_places_weekend = form.wishPlacesWeekend ?? []
    appRow.wish_dates = form.wishDates ?? []
  }

  const { data: appData, error: appErr } = await supabase
    .from('applications')
    .insert(appRow)
    .select('id')

  if (appErr) {
    if (appErr.code === '23505') {
      throw new FriendlyError('이미 이 모임에 신청하셨어요. 내 신청 내역에서 확인할 수 있어요.')
    }
    console.error('[ONDO] applications insert 실패:', appErr)
    throw new FriendlyError('신청을 접수하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.')
  }

  return { applicationId: (appData?.[0]?.id as string) ?? '' }
}

/** 로그인 시 같은 전화번호의 게스트 신청을 내 계정에 자동 연결 */
export async function claimGuestApplications(phone: string): Promise<number> {
  const normalized = normalizePhone(phone)
  if (!normalized) return 0
  const { data, error } = await supabase.rpc('claim_guest_applications', { p_phone: normalized })
  if (error) {
    console.error('[ONDO] claimGuestApplications 실패:', error)
    return 0
  }
  return (data as number) ?? 0
}

// ───────────────────────── 내 신청 내역 / 취소 ─────────────────────────
export interface MyApplication {
  id: string
  status: ApplicationStatus
  created_at: string
  slot: Pick<Slot, 'date' | 'place' | 'pace_label' | 'status'> | null
  wish_places_weekday: Place[] | null
  wish_places_weekend: Place[] | null
  wish_dates: string[] | null
  sessionDate: string | null
  hasSatisfactionCheck: boolean
}

/** 로그인 유저의 신청 내역 (본인 것만 — RLS 로 보장) */
export async function getMyApplications(): Promise<{ name: string; apps: MyApplication[] } | null> {
  const profile = await getMyProfile()
  if (!profile) return null

  const { data, error } = await supabase
    .from('applications')
    .select(
      'id,status,created_at,wish_places_weekday,wish_places_weekend,wish_dates,session_date,slots(date,place,pace_label,status)',
    )
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[ONDO] getMyApplications 실패:', error)
    throw new FriendlyError('신청 내역을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
  }

  type Row = Omit<MyApplication, 'slot' | 'sessionDate' | 'hasSatisfactionCheck'> & {
    slots: MyApplication['slot'] | MyApplication['slot'][] | null
    session_date: string | null
  }
  const rows = data as unknown as Row[]

  // confirmed 신청건의 만족도 체크 제출 여부를 별도 조회해 머지 (FK 임베딩 없이 단순 병합)
  const confirmedIds = rows.filter((r) => r.status === 'confirmed').map((r) => r.id)
  let checkedIds = new Set<string>()
  if (confirmedIds.length > 0) {
    const { data: checks } = await supabase
      .from('satisfaction_checks')
      .select('application_id')
      .in('application_id', confirmedIds)
    checkedIds = new Set((checks ?? []).map((c) => c.application_id as string))
  }

  const apps: MyApplication[] = rows.map((r) => {
    const slot = Array.isArray(r.slots) ? (r.slots[0] ?? null) : r.slots
    const { slots: _drop, session_date, ...rest } = r
    void _drop
    return {
      ...rest,
      slot,
      sessionDate: session_date,
      hasSatisfactionCheck: checkedIds.has(r.id),
    }
  })

  return { name: profile.name ?? '회원', apps }
}

/** 세션(주차)의 공지사항·오픈채팅 링크 (PII 없음 — 누구나 조회 가능) */
export async function getSessionInfo(sessionDate: string): Promise<SessionInfo | null> {
  const { data, error } = await supabase
    .from('session_info')
    .select('session_date,notice_text,open_chat_url')
    .eq('session_date', sessionDate)
    .maybeSingle()
  if (error) {
    console.error('[ONDO] getSessionInfo 실패:', error)
    return null
  }
  if (!data) return null
  return {
    sessionDate: data.session_date,
    noticeText: data.notice_text,
    openChatUrl: data.open_chat_url,
  }
}

/** 세션(주차)의 확정 인원수를 페이스별로 분리한 집계 (PII 없음) */
export async function getConfirmedSessionStats(sessionDate: string): Promise<PaceBreakdown[]> {
  const { data, error } = await supabase.rpc('get_confirmed_session_stats', {
    p_session_date: sessionDate,
  })
  if (error) {
    console.error('[ONDO] getConfirmedSessionStats 실패:', error)
    return []
  }
  type Row = { pace: string | null; cnt: number }
  return ((data as Row[]) ?? [])
    .filter((r) => !!r.pace)
    .map((r) => ({ pace: r.pace as string, label: paceText(r.pace), count: r.cnt }))
}

/** 세션 종료 후 만족도 체크 제출 (본인 것만 — RLS) */
export async function submitSatisfactionCheck(
  applicationId: string,
  userId: string,
  q1IntensityOk: boolean,
  q2WouldReapply: boolean,
  reviewText?: string,
): Promise<void> {
  const { error } = await supabase.from('satisfaction_checks').insert({
    application_id: applicationId,
    user_id: userId,
    q1_intensity_ok: q1IntensityOk,
    q2_would_reapply: q2WouldReapply,
    review_text: reviewText?.trim() || null,
  })
  if (error) {
    console.error('[ONDO] submitSatisfactionCheck 실패:', error)
    throw new FriendlyError('제출에 실패했어요. 잠시 후 다시 시도해 주세요.')
  }
}

// ───────────────────────── 리드 수집 · 최신 후기 ─────────────────────────
/** 진입 팝업에서 수집한 전화번호 저장 (중복은 조용히 무시) */
export async function saveLead(phone: string): Promise<void> {
  const normalized = normalizePhone(phone)
  if (!normalized) return
  const { error } = await supabase.from('leads').insert({ phone: normalized })
  // 23505 = 이미 등록된 번호 — 정상 흐름으로 취급
  if (error && error.code !== '23505') {
    console.error('[ONDO] saveLead 실패:', error)
  }
}

export interface Lead {
  id: string
  phone: string
  created_at: string
}

/** 운영자: 리드(전화번호) 목록 */
export async function adminListLeads(key: string): Promise<Lead[]> {
  const { data, error } = await supabase.rpc('admin_list_leads', { p_key: key })
  if (error) {
    console.error('[ONDO] adminListLeads 실패:', error)
    return []
  }
  return (data as Lead[]) ?? []
}

export interface DemographicRow {
  dimension: 'pace' | 'age' | 'gender'
  label: string
  cnt: number
}

/** 신청자 구성 집계 (PII 없음): 페이스/연령대/성별 분포 */
export async function getApplicantDemographics(): Promise<DemographicRow[]> {
  const { data, error } = await supabase.rpc('get_applicant_demographics')
  if (error) {
    console.error('[ONDO] getApplicantDemographics 실패:', error)
    return []
  }
  return (data as DemographicRow[]) ?? []
}

/** 최신 세션 후기 텍스트 (PII 없음) */
export async function getRecentReviews(limit = 5): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_recent_reviews', { p_limit: limit })
  if (error) {
    console.error('[ONDO] getRecentReviews 실패:', error)
    return []
  }
  type Row = { review_text: string }
  return ((data as Row[]) ?? []).map((r) => r.review_text)
}

/** 신청 취소 (본인 것만 — RLS) */
export async function cancelApplication(id: string): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({ status: 'cancelled' })
    .eq('id', id)
  if (error) {
    console.error('[ONDO] cancelApplication 실패:', error)
    throw new FriendlyError('취소하지 못했어요. 잠시 후 다시 시도해 주세요.')
  }
}

// ───────────────────────── 운영자(/admin) ─────────────────────────
export interface AdminApplication {
  application_id: string
  status: ApplicationStatus
  paid: boolean
  invited: boolean
  created_at: string
  wish_places_weekday: Place[] | null
  wish_places_weekend: Place[] | null
  wish_dates: string[] | null
  can_run_5k: boolean | null
  run_purpose: string | null
  plan: string | null
  record_proof: string | null
  session_date: string | null
  slot_id: string | null
  slot_date: string | null
  slot_place: Place | null
  slot_pace_label: string | null
  slot_max_members: number | null
  slot_status: SlotStatus | null
  user_id: string | null
  user_name: string
  user_phone: string
  user_gender: Gender | null
  user_age_range: string | null
  user_pace: Pace | null
  user_total_count: number
  prior_participations: number
  user_marketing_consent: boolean | null
  user_mbti: string | null
  user_pace_verified: boolean | null
  is_guest: boolean
  attended: boolean | null
}

/** 운영자 키로 전체 신청 목록 (이름/연락처 포함). 키 틀리면 throw. */
export async function adminListApplications(key: string): Promise<AdminApplication[]> {
  const { data, error } = await supabase.rpc('admin_list_applications', { p_key: key })
  if (error) {
    if (error.message?.includes('unauthorized')) throw new FriendlyError('UNAUTHORIZED')
    console.error('[ONDO] adminListApplications 실패:', error)
    throw new FriendlyError('신청 목록을 불러오지 못했어요.')
  }
  return (data as AdminApplication[]) ?? []
}


/** 운영자: 신청 변경 (입금·초대·확정 — 키 검증 함수) */
export async function updateApplication(
  key: string,
  id: string,
  patch: {
    paid?: boolean
    invited?: boolean
    status?: ApplicationStatus
    sessionDate?: string
    attended?: boolean
  },
): Promise<void> {
  const { error } = await supabase.rpc('admin_update_application', {
    p_key: key,
    p_id: id,
    p_paid: patch.paid ?? null,
    p_invited: patch.invited ?? null,
    p_status: patch.status ?? null,
    p_session_date: patch.sessionDate ?? null,
    p_attended: patch.attended ?? null,
  })
  if (error) {
    console.error('[ONDO] updateApplication 실패:', error)
    throw new FriendlyError('변경에 실패했어요.')
  }
}

/** 운영자: 페이스 검증 토글 (참가 후 실제 기록 확인 시) */
export async function adminSetPaceVerified(
  key: string,
  userId: string,
  verified: boolean,
): Promise<void> {
  const { error } = await supabase.rpc('admin_set_pace_verified', {
    p_key: key,
    p_user_id: userId,
    p_verified: verified,
  })
  if (error) {
    console.error('[ONDO] adminSetPaceVerified 실패:', error)
    throw new FriendlyError('페이스 검증 변경에 실패했어요.')
  }
}

/** 운영자: 이번 주 세션 공지사항·오픈채팅 링크 저장 (키 검증 함수) */
export async function adminSetSessionNotice(
  key: string,
  sessionDate: string,
  noticeText: string,
  openChatUrl: string,
): Promise<void> {
  const { error } = await supabase.rpc('admin_set_session_notice', {
    p_key: key,
    p_session_date: sessionDate,
    p_notice_text: noticeText.trim() || null,
    p_open_chat_url: openChatUrl.trim() || null,
  })
  if (error) {
    console.error('[ONDO] adminSetSessionNotice 실패:', error)
    throw new FriendlyError('세션 정보 저장에 실패했어요.')
  }
}
