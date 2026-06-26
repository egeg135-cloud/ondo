import { supabase } from './supabase'
import { normalizePhone } from './format'
import type { ApplicationStatus, Gender, Pace, Place, Slot, SlotStatus, User } from '../types'

/** 친절한 에러 메시지를 담는 커스텀 에러 */
export class FriendlyError extends Error {}

const EVENT_GOAL = 500 // 무료 이벤트 목표 인원
export const EVENT_GOAL_COUNT = EVENT_GOAL

/** 현재 로그인 유저 id (없으면 throw) */
async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) throw new FriendlyError('로그인이 필요해요. 카카오로 로그인해 주세요.')
  return id
}

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
}

/**
 * 신청 제출: 로그인 유저 프로필(users) upsert 후 applications insert.
 * 신원은 카카오 로그인(auth.uid()) — 전화번호는 연락처로만 저장.
 */
export async function submitApplication(
  form: ApplicationForm,
): Promise<{ applicationId: string }> {
  const userId = await requireUserId()
  const phone = normalizePhone(form.phone)
  if (!phone) {
    throw new FriendlyError('연락처 형식이 올바르지 않아요. 010-1234-5678 형태로 입력해 주세요.')
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

// ───────────────────────── 내 신청 내역 / 취소 ─────────────────────────
export interface MyApplication {
  id: string
  status: ApplicationStatus
  created_at: string
  slot: Pick<Slot, 'date' | 'place' | 'pace_label' | 'status'> | null
  wish_places_weekday: Place[] | null
  wish_places_weekend: Place[] | null
  wish_dates: string[] | null
}

/** 로그인 유저의 신청 내역 (본인 것만 — RLS 로 보장) */
export async function getMyApplications(): Promise<{ name: string; apps: MyApplication[] } | null> {
  const profile = await getMyProfile()
  if (!profile) return null

  const { data, error } = await supabase
    .from('applications')
    .select(
      'id,status,created_at,wish_places_weekday,wish_places_weekend,wish_dates,slots(date,place,pace_label,status)',
    )
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[ONDO] getMyApplications 실패:', error)
    throw new FriendlyError('신청 내역을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
  }

  type Row = Omit<MyApplication, 'slot'> & {
    slots: MyApplication['slot'] | MyApplication['slot'][] | null
  }
  const apps: MyApplication[] = (data as unknown as Row[]).map((r) => {
    const slot = Array.isArray(r.slots) ? (r.slots[0] ?? null) : r.slots
    const { slots: _drop, ...rest } = r
    void _drop
    return { ...rest, slot }
  })

  return { name: profile.name ?? '회원', apps }
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
  slot_id: string | null
  slot_date: string | null
  slot_place: Place | null
  slot_pace_label: string | null
  slot_max_members: number | null
  slot_status: SlotStatus | null
  user_id: string
  user_name: string
  user_phone: string
  user_gender: Gender | null
  user_age_range: string | null
  user_pace: Pace | null
  user_total_count: number
  prior_participations: number
  user_marketing_consent: boolean | null
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

/** 운영자: 전체 슬롯 조회 (빈 슬롯 포함). slots 조회는 누구나 가능. */
export async function getAllSlots(): Promise<Slot[]> {
  const { data, error } = await supabase.from('slots').select('*').order('date', { ascending: true })
  if (error) {
    console.error('[ONDO] getAllSlots 실패:', error)
    return []
  }
  return (data as Slot[]) ?? []
}

/** 운영자: 슬롯 생성 (키 검증 함수) */
export async function createSlot(
  key: string,
  input: { date: string; place: Place; max_members: number; pace_label: string },
): Promise<void> {
  const { error } = await supabase.rpc('admin_create_slot', {
    p_key: key,
    p_date: input.date,
    p_place: input.place,
    p_max: input.max_members,
    p_pace_label: input.pace_label,
  })
  if (error) {
    console.error('[ONDO] createSlot 실패:', error)
    throw new FriendlyError('슬롯 생성에 실패했어요.')
  }
}

/** 운영자: 신청을 슬롯에 배정/해제 (매칭). slotId=null 이면 일반 신청으로 되돌림. */
export async function assignSlot(key: string, id: string, slotId: string | null): Promise<void> {
  const { error } = await supabase.rpc('admin_assign_slot', {
    p_key: key,
    p_id: id,
    p_slot_id: slotId,
  })
  if (error) {
    if (error.code === '23505') {
      throw new FriendlyError('이 신청자는 이미 그 슬롯에 들어가 있어요.')
    }
    console.error('[ONDO] assignSlot 실패:', error)
    throw new FriendlyError('배정에 실패했어요.')
  }
}

/** 운영자: 신청 변경 (입금·초대·확정 — 키 검증 함수) */
export async function updateApplication(
  key: string,
  id: string,
  patch: { paid?: boolean; invited?: boolean; status?: ApplicationStatus },
): Promise<void> {
  const { error } = await supabase.rpc('admin_update_application', {
    p_key: key,
    p_id: id,
    p_paid: patch.paid ?? null,
    p_invited: patch.invited ?? null,
    p_status: patch.status ?? null,
  })
  if (error) {
    console.error('[ONDO] updateApplication 실패:', error)
    throw new FriendlyError('변경에 실패했어요.')
  }
}
