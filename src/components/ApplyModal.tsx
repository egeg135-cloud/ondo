import { useEffect, useState } from 'react'
import { Chip } from './Chip'
import { Calendar } from './Calendar'
import { PACE_PICK, paceText, PLANS, POLICY, RUN_PURPOSES } from '../types'
import type { Gender, Pace, Slot } from '../types'
import { formatDateLabel } from '../lib/dates'
import { formatPhoneInput, isValidPhone, saveLastPhone } from '../lib/format'
import { FriendlyError, getMyProfile, submitApplication } from '../lib/api'

const GENDERS: Gender[] = ['남', '여']
// 7월 단일 슬롯: 여의도 / 목요일(요일코드 4) 고정
const FIXED_PLACE = '여의도' as const

export interface ApplySuccessInfo {
  applicationId: string
  phone: string
  name: string
}

interface ApplyModalProps {
  open: boolean
  onClose: () => void
  slot?: Slot | null
  onSuccess: (info: ApplySuccessInfo) => void
}

export function ApplyModal({ open, onClose, slot, onSuccess }: ApplyModalProps) {
  const isSlotMode = Boolean(slot)

  const [pace, setPace] = useState<Pace | null>(null)
  const [dates, setDates] = useState<string[]>([])
  const [gender, setGender] = useState<Gender | null>(null)
  const [ageRange, setAgeRange] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // v3.1 추가 항목
  const [canRun5k, setCanRun5k] = useState<boolean | null>(null)
  const [runPurpose, setRunPurpose] = useState<string | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [recordProof, setRecordProof] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loadedProfile, setLoadedProfile] = useState(false)

  // 동의
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [askMarketing, setAskMarketing] = useState(false) // 마케팅 미동의 시 재확인 노출

  useEffect(() => {
    if (open) {
      setError('')
      setLoadedProfile(false)
      setAgreeTerms(false)
      setAgreePrivacy(false)
      setAgreeMarketing(false)
      setAskMarketing(false)
      void loadMyProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function loadMyProfile() {
    const user = await getMyProfile()
    if (user) {
      if (user.name) setName(user.name)
      if (user.phone) setPhone(user.phone)
      if (user.gender) setGender(user.gender)
      if (user.age_range) setAgeRange(user.age_range)
      if (user.pace) setPace(user.pace)
      if (user.marketing_consent) setAgreeMarketing(true)
      setLoadedProfile(true)
    }
  }

  function validate(): string | null {
    if (!pace) return '러닝 페이스를 선택해 주세요.'
    if (canRun5k === null) return '5km 완주 가능 여부를 선택해 주세요.'
    if (!runPurpose) return '러닝 목적을 선택해 주세요.'
    if (!isSlotMode && dates.length === 0) return '희망 날짜(목요일)를 하루 이상 골라 주세요.'
    if (!plan) return '이용권(회권/시즌권)을 선택해 주세요.'
    if (!gender) return '성별을 선택해 주세요.'
    if (!ageRange || !/^\d{1,2}$/.test(ageRange.trim())) return '나이를 숫자(만 나이)로 입력해 주세요.'
    if (!name.trim()) return '이름을 입력해 주세요.'
    if (!isValidPhone(phone)) return '연락처를 010-1234-5678 형태로 입력해 주세요.'
    if (!agreeTerms) return '이용약관 및 안전 안내에 동의해 주세요.'
    if (!agreePrivacy) return '개인정보 수집·이용에 동의해 주세요.'
    return null
  }

  // 제출 버튼 클릭: 검증 후, 마케팅 미동의면 한 번 더 물어본다
  function handleSubmitClick() {
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setError('')
    if (!agreeMarketing) {
      setAskMarketing(true)
      return
    }
    void doSubmit(agreeMarketing)
  }

  async function doSubmit(marketing: boolean) {
    setAskMarketing(false)
    setSubmitting(true)
    try {
      const { applicationId } = await submitApplication({
        name,
        phone,
        gender: gender!,
        ageRange: ageRange!,
        pace: pace!,
        slotId: slot?.id,
        wishPlacesWeekday: isSlotMode ? undefined : [FIXED_PLACE],
        wishPlacesWeekend: isSlotMode ? undefined : [],
        wishDates: isSlotMode ? undefined : dates,
        marketingConsent: marketing,
        canRun5k: canRun5k ?? undefined,
        runPurpose: runPurpose ?? undefined,
        plan: plan ?? undefined,
        recordProof,
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
    setDates([])
    setGender(null)
    setAgeRange(null)
    setName('')
    setCanRun5k(null)
    setRunPurpose(null)
    setPlan(null)
    setRecordProof('')
    setAgreeTerms(false)
    setAgreePrivacy(false)
    setAgreeMarketing(false)
    setAskMarketing(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white border border-gray-200 rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white/95 backdrop-blur px-5 pt-5 pb-3 flex items-start justify-between border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isSlotMode ? '이 모임에 신청하기' : '5초 만에 신청하기'}
            </h2>
            {isSlotMode && slot && (
              <p className="text-sm text-gray-500 mt-0.5">
                {formatDateLabel(slot.date)} · {slot.place}
                {slot.pace_label ? ` · ${paceText(slot.pace_label)} 페이스` : ''}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-gray-400 hover:text-gray-900 text-xl leading-none px-2 py-1"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-5 space-y-5 pt-4">
          {loadedProfile && (
            <p className="text-xs text-gray-700 bg-gray-100 rounded-lg px-3 py-2">
              이전에 입력하신 정보를 불러왔어요. 바꿔도 됩니다.
            </p>
          )}

          {/* 러닝 페이스 — 6:30 / 7:30 두 그룹만 */}
          <Field label="러닝 페이스" hint="정확히 안 맞아도 둘 중 더 가까운 쪽으로 골라주세요">
            <div className="grid grid-cols-2 gap-2">
              {PACE_PICK.map((opt) => (
                <Chip
                  key={opt.code}
                  selected={pace === opt.code}
                  onClick={() => setPace(opt.code)}
                  className="!py-3 justify-center"
                >
                  <span className="font-bold text-base">{opt.label}</span>
                  <span className="text-xs opacity-70"> /km</span>
                </Chip>
              ))}
            </div>
            {pace && (
              <div className="mt-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5">
                <p className="text-sm text-gray-700 font-medium">
                  {PACE_PICK.find((o) => o.code === pace)?.desc}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  * 페이스 = 1km를 달리는 시간. 숫자가 작을수록 빠릅니다.
                </p>
              </div>
            )}
          </Field>

          {/* 5km 완주 가능 여부 */}
          <Field label="5km 완주" hint="쉬지 않고 5km 달릴 수 있나요?">
            <div className="flex gap-2">
              <Chip selected={canRun5k === true} onClick={() => setCanRun5k(true)} className="flex-1 justify-center">
                네, 가능해요
              </Chip>
              <Chip selected={canRun5k === false} onClick={() => setCanRun5k(false)} className="flex-1 justify-center">
                아직 어려워요
              </Chip>
            </div>
            {canRun5k === false && (
              <p className="mt-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                ONDO는 5km를 꾸준히 뛰는 분들을 위한 매칭이에요. 신청은 가능하지만 매칭이 어려울 수 있어요.
              </p>
            )}
          </Field>

          {/* 러닝 목적 */}
          <Field label="러닝 목적">
            <div className="flex gap-2">
              {RUN_PURPOSES.map((p) => (
                <Chip
                  key={p.code}
                  selected={runPurpose === p.code}
                  onClick={() => setRunPurpose(p.code)}
                  className="flex-1 justify-center"
                >
                  {p.label}
                </Chip>
              ))}
            </div>
          </Field>

          {!isSlotMode && (
            <Field label="희망 날짜" hint="목요일만 운영해요">
              <p className="mb-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg px-3 py-2">
                📍 <span className="font-bold">여의도 한강 · 목요일 저녁 8시(20:00)</span> · 5km
              </p>
              <Calendar selected={dates} onChange={setDates} monthsAhead={1} allowedWeekdays={[4]} />
              {dates.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  선택 {dates.length}일: {dates.slice().sort().map(formatDateLabel).join(', ')}
                </p>
              )}
            </Field>
          )}

          {/* 러닝 기록 인증 */}
          <Field label="러닝 기록 인증" hint="선택 — 넣으면 더 정확히 매칭돼요">
            <input
              type="text"
              value={recordProof}
              onChange={(e) => setRecordProof(e.target.value)}
              placeholder="Strava 링크 또는 최근 기록 (예: 5km 27분, 주 3회)"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              최근 2주 러닝 기록(3회+)을 인증하면 페이스가 더 맞는 그룹에 우선 배정돼요.
            </p>
          </Field>

          {/* 이용권 */}
          <Field label="이용권" hint="첫 참여는 무료예요">
            <div className="grid grid-cols-2 gap-2">
              {PLANS.map((p) => (
                <Chip
                  key={p.code}
                  selected={plan === p.code}
                  onClick={() => setPlan(p.code)}
                  className="!py-3 !flex-col !items-start gap-0.5"
                >
                  <span className="font-bold">
                    {p.label} <span className="text-gray-500 font-normal">{p.price}</span>
                  </span>
                  <span className="text-xs text-gray-400">{p.desc}</span>
                </Chip>
              ))}
            </div>
          </Field>

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

          {/* 나이 (만나이) */}
          <Field label="나이" hint="만 나이로 입력해 주세요">
            <input
              type="number"
              inputMode="numeric"
              min={14}
              max={99}
              value={ageRange ?? ''}
              onChange={(e) => setAgeRange(e.target.value)}
              placeholder="예: 29"
              className="w-32 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-500"
            />
            <span className="ml-2 text-sm text-gray-500">세</span>
          </Field>

          {/* 이름 */}
          <Field label="이름">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-500"
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
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-500"
            />
          </Field>

          {/* 서비스 범위 안내 */}
          <ServiceScope />

          {/* 동의 */}
          <div className="space-y-2 pt-1">
            <Consent checked={agreeTerms} onChange={setAgreeTerms} required>
              <a href={POLICY.terms} target="_blank" rel="noopener noreferrer" className="underline">
                이용약관 및 안전 안내
              </a>
              에 동의합니다.
            </Consent>
            <Consent checked={agreePrivacy} onChange={setAgreePrivacy} required>
              <a href={POLICY.privacy} target="_blank" rel="noopener noreferrer" className="underline">
                개인정보 수집·이용
              </a>
              에 동의합니다.
            </Consent>
            <Consent checked={agreeMarketing} onChange={setAgreeMarketing}>
              마케팅 및 재참여 안내 수신에 동의합니다.
            </Consent>
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* 마케팅 미동의 재확인 */}
          {askMarketing ? (
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                딱 맞는 다음 모임·재참여 소식을 놓치지 않게 <span className="font-bold">안내받으시겠어요?</span>
                <br />
                <span className="text-xs text-gray-400">(언제든 수신 거부할 수 있어요)</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAgreeMarketing(true)
                    void doSubmit(true)
                  }}
                  className="flex-1 rounded-xl bg-gray-900 text-white font-bold py-3 text-sm"
                >
                  네, 받을게요
                </button>
                <button
                  type="button"
                  onClick={() => void doSubmit(false)}
                  className="flex-1 rounded-xl bg-gray-200 text-gray-600 font-bold py-3 text-sm"
                >
                  괜찮아요
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={submitting}
              className="w-full rounded-2xl bg-gray-900 text-white font-bold py-4 text-base disabled:opacity-40 active:scale-[0.99] transition-transform"
            >
              {submitting ? '신청 중…' : '신청 완료하기'}
            </button>
          )}

          <p className="text-xs leading-relaxed text-gray-400 text-center">
            첫 참여 무료 · 이후 회권 5,000원 / 시즌권(4주) 10,000원
          </p>
        </div>
      </div>
    </div>
  )
}

// 서비스 범위 — ONDO가 하는 것 / 안 하는 것 (랜딩·신청폼 공용)
export function ServiceScope() {
  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 text-xs leading-relaxed">
      <p className="font-bold text-gray-900 mb-1.5">ONDO가 하는 것</p>
      <ul className="space-y-1 text-gray-600">
        <li>✓ 최근 페이스·러닝 기록을 확인한 러너 매칭</li>
        <li>✓ 비슷한 페이스의 3~5명 소규모 그룹 구성</li>
        <li>✓ 집합 장소·시간·함께 뛸 분들의 페이스 안내</li>
        <li>✓ 3명 이상 성사 보장 (안 되면 2주 내 재매칭, 그래도 안 되면 환불)</li>
      </ul>
      <p className="font-bold text-gray-900 mt-3 mb-1.5">ONDO가 하지 않는 것</p>
      <ul className="space-y-1 text-gray-500">
        <li>✗ 현장 진행자·인솔자 (운영자가 함께 뛰지 않아요)</li>
        <li>✗ 러닝 코칭·페이스메이킹·기록 지도</li>
        <li>✗ 코스 리딩 (집합 장소까지만 안내해요)</li>
        <li>✗ 뒤풀이·커피·식사 운영</li>
      </ul>
      <p className="mt-3 text-gray-500">
        ONDO는 <span className="font-semibold text-gray-700">페이스가 맞는 사람</span>을 연결해요. 실제 러닝은 만난 분들끼리 자유롭게 진행하시면 됩니다. <span className="font-semibold text-gray-700">운영자가 이끄는 러닝 모임이 아니에요.</span>
      </p>
    </div>
  )
}

function Consent({
  checked,
  onChange,
  required,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer text-sm text-gray-600 leading-relaxed">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 shrink-0 accent-gray-900"
      />
      <span>
        <span className={required ? 'text-gray-900 font-semibold' : 'text-gray-400'}>
          [{required ? '필수' : '선택'}]
        </span>{' '}
        {children}
      </span>
    </label>
  )
}

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
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
