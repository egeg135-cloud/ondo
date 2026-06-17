import { useEffect, useState } from 'react'
import { Chip } from './Chip'
import { Calendar } from './Calendar'
import { PACE_DESC } from '../types'
import type { Gender, Pace, Place, Slot } from '../types'
import { formatDateLabel, isWeekendISO } from '../lib/dates'
import { formatPhoneInput, isValidPhone, saveLastPhone } from '../lib/format'
import { FriendlyError, getMyProfile, submitApplication } from '../lib/api'

const PACES: Pace[] = ['A', 'B', 'C', 'D']
const PACE_SHORT: Record<Pace, string> = { A: '걷기', B: '조깅', C: '러닝', D: '빠른러닝' }
const PLACES: Place[] = ['여의도', '반포', '종로']
const AGE_RANGES = ['20대', '30대 초', '30대 중', '30대 후', '40대+']
const GENDERS: Gender[] = ['남', '여']

export interface ApplySuccessInfo {
  applicationId: string
  phone: string
  name: string
}

interface ApplyModalProps {
  open: boolean
  onClose: () => void
  /** 슬롯 카드에서 열었을 때만 전달. 없으면 "일반 신청" 모드. */
  slot?: Slot | null
  onSuccess: (info: ApplySuccessInfo) => void
}

export function ApplyModal({ open, onClose, slot, onSuccess }: ApplyModalProps) {
  const isSlotMode = Boolean(slot)

  // ── 폼 상태 ──
  const [pace, setPace] = useState<Pace | null>(null)
  const [placesWeekday, setPlacesWeekday] = useState<Place[]>([])
  const [placesWeekend, setPlacesWeekend] = useState<Place[]>([])
  const [dates, setDates] = useState<string[]>([])
  const [gender, setGender] = useState<Gender | null>(null)
  const [ageRange, setAgeRange] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loadedProfile, setLoadedProfile] = useState(false)

  // 모달 열릴 때: 로그인한 본인 프로필 자동 채움
  useEffect(() => {
    if (open) {
      setError('')
      setLoadedProfile(false)
      void loadMyProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // 로그인 유저의 기존 프로필 자동 불러오기
  async function loadMyProfile() {
    const user = await getMyProfile()
    if (user) {
      if (user.name) setName(user.name)
      if (user.phone) setPhone(user.phone)
      if (user.gender) setGender(user.gender)
      if (user.age_range) setAgeRange(user.age_range)
      if (user.pace) setPace(user.pace)
      setLoadedProfile(true)
    }
  }

  function togglePlaceWeekday(p: Place) {
    setPlacesWeekday((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }
  function togglePlaceWeekend(p: Place) {
    setPlacesWeekend((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  // 선택한 날짜 중 평일/주말 포함 여부
  const hasWeekday = dates.some((iso) => !isWeekendISO(iso))
  const hasWeekend = dates.some((iso) => isWeekendISO(iso))

  function validate(): string | null {
    if (!pace) return '러닝 페이스를 선택해 주세요.'
    if (!isSlotMode) {
      if (dates.length === 0) return '희망 날짜를 하루 이상 골라 주세요.'
      if (hasWeekday && placesWeekday.length === 0)
        return '평일 날짜를 고르셨어요. 평일 희망 장소를 골라 주세요.'
      if (hasWeekend && placesWeekend.length === 0)
        return '주말 날짜를 고르셨어요. 주말 희망 장소를 골라 주세요.'
    }
    if (!gender) return '성별을 선택해 주세요.'
    if (!ageRange) return '나이대를 선택해 주세요.'
    if (!name.trim()) return '이름을 입력해 주세요.'
    if (!isValidPhone(phone)) return '연락처를 010-1234-5678 형태로 입력해 주세요.'
    return null
  }

  async function handleSubmit() {
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const { applicationId } = await submitApplication({
        name,
        phone,
        gender: gender!,
        ageRange: ageRange!,
        pace: pace!,
        slotId: slot?.id,
        wishPlacesWeekday: isSlotMode ? undefined : placesWeekday,
        wishPlacesWeekend: isSlotMode ? undefined : placesWeekend,
        wishDates: isSlotMode ? undefined : dates,
      })
      saveLastPhone(phone.trim())
      onSuccess({ applicationId, phone: phone.trim(), name: name.trim() })
      resetForm()
    } catch (e) {
      setError(e instanceof FriendlyError ? e.message : '알 수 없는 오류가 발생했어요. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setPace(null)
    setPlacesWeekday([])
    setPlacesWeekend([])
    setDates([])
    setGender(null)
    setAgeRange(null)
    setName('')
    // phone 은 유지 (다음 신청 편의)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-offwhite rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-offwhite/95 backdrop-blur px-5 pt-5 pb-3 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy">
              {isSlotMode ? '이 모임에 신청하기' : '5초 만에 신청하기'}
            </h2>
            {isSlotMode && slot && (
              <p className="text-sm text-navy/60 mt-0.5">
                {formatDateLabel(slot.date)} · {slot.place}
                {slot.pace_label ? ` · 페이스 ${slot.pace_label}` : ''}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-navy/40 hover:text-navy text-xl leading-none px-2 py-1"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-5 space-y-5">
          {loadedProfile && (
            <p className="text-xs text-sand bg-sand/10 rounded-lg px-3 py-2">
              이전에 입력하신 정보를 불러왔어요. 바꿔도 됩니다.
            </p>
          )}

          {/* 러닝 페이스 */}
          <Field label="러닝 페이스">
            <div className="grid grid-cols-2 gap-2">
              {PACES.map((p) => (
                <Chip key={p} selected={pace === p} onClick={() => setPace(p)} className="!py-3 justify-center">
                  <span className="font-bold">{p}</span> {PACE_SHORT[p]}
                </Chip>
              ))}
            </div>
            {pace && <p className="text-xs text-navy/50 mt-1.5">{PACE_DESC[pace]}</p>}
          </Field>

          {/* 일반 신청일 때만: 희망 날짜(달력) → 평일/주말 희망 장소 */}
          {!isSlotMode && (
            <>
              <Field label="희망 날짜" hint="요일 탭·드래그로 여러 날 선택">
                <Calendar selected={dates} onChange={setDates} monthsAhead={1} />
                {dates.length > 0 && (
                  <p className="text-xs text-navy/60 mt-2">
                    선택 {dates.length}일: {dates.slice().sort().map(formatDateLabel).join(', ')}
                  </p>
                )}
              </Field>

              {/* 고른 날짜에 평일이 있으면 평일 장소, 주말이 있으면 주말 장소를 받는다 */}
              {hasWeekday && (
                <Field label="평일 희망 장소" hint="평일 활동지역 (여러 곳 가능)">
                  <div className="flex flex-wrap gap-2">
                    {PLACES.map((p) => (
                      <Chip
                        key={p}
                        selected={placesWeekday.includes(p)}
                        onClick={() => togglePlaceWeekday(p)}
                      >
                        {p}
                      </Chip>
                    ))}
                  </div>
                </Field>
              )}
              {hasWeekend && (
                <Field label="주말 희망 장소" hint="주말 활동지역 (여러 곳 가능)">
                  <div className="flex flex-wrap gap-2">
                    {PLACES.map((p) => (
                      <Chip
                        key={p}
                        selected={placesWeekend.includes(p)}
                        onClick={() => togglePlaceWeekend(p)}
                      >
                        {p}
                      </Chip>
                    ))}
                  </div>
                </Field>
              )}
            </>
          )}

          {/* 성별 */}
          <Field label="성별">
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <Chip key={g} selected={gender === g} onClick={() => setGender(g)} className="flex-1 justify-center">
                  {g}
                </Chip>
              ))}
            </div>
          </Field>

          {/* 나이대 */}
          <Field label="나이대">
            <div className="flex flex-wrap gap-2">
              {AGE_RANGES.map((a) => (
                <Chip key={a} selected={ageRange === a} onClick={() => setAgeRange(a)}>
                  {a}
                </Chip>
              ))}
            </div>
          </Field>

          {/* 이름 */}
          <Field label="이름">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy/50"
            />
          </Field>

          {/* 연락처 */}
          <Field label="연락처">
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              placeholder="010-1234-5678"
              className="w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy/50"
            />
          </Field>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-2xl bg-navy text-white font-bold py-4 text-base disabled:opacity-50 active:scale-[0.99] transition-transform"
          >
            {submitting ? '신청 중…' : '신청 완료하기'}
          </button>

          <p className="text-[11px] leading-relaxed text-navy/40 text-center">
            첫 참여는 무료예요 · 재참여부터 회당 4,900원 (월 멤버십 9,900원 예정)
          </p>
        </div>
      </div>
    </div>
  )
}

// ───────────────────────── 폼 필드 래퍼 ─────────────────────────
function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-sm font-semibold text-navy">{label}</span>
        {hint && <span className="text-xs text-navy/40">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
