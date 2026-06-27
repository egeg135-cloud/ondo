import { useEffect, useState } from 'react'
import { Chip } from './Chip'
import { Calendar } from './Calendar'
import { PACE_PICK, PLANS, POLICY, RUN_PURPOSES } from '../types'
import type { Gender, Pace, Slot } from '../types'
import { formatDateLabel, getNextThursdays } from '../lib/dates'
import { formatPhoneInput, getLastPhone, isValidPhone, saveLastPhone } from '../lib/format'
import {
  FriendlyError,
  getMyProfile,
  savePendingApplication,
  submitApplication,
  type ApplicationForm,
} from '../lib/api'
import { signInWithKakao, useSession } from '../lib/auth'
import { analytics } from '../lib/analytics'

const GENDERS: Gender[] = ['남', '여']
const FIXED_PLACE = '여의도' as const
const TOTAL_STEPS = 5

export interface ApplySuccessInfo {
  applicationId: string
  phone: string
  name: string
}

interface ApplyModalProps {
  open: boolean
  onClose: () => void
  slot?: Slot | null // (미사용) 호환용
  onSuccess: (info: ApplySuccessInfo) => void
}

export function ApplyModal({ open, onClose, onSuccess }: ApplyModalProps) {
  const { session } = useSession()

  const [step, setStep] = useState(0)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [ageRange, setAgeRange] = useState<string | null>(null)
  const [mbti, setMbti] = useState('')
  const [pace, setPace] = useState<Pace | null>(null)
  const [canRun5k, setCanRun5k] = useState<boolean | null>(null)
  const [runPurpose, setRunPurpose] = useState<string | null>(null)
  const [dates, setDates] = useState<string[]>([])
  const [plan, setPlan] = useState<string | null>(null)
  const [recordProof, setRecordProof] = useState('')

  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [askMarketing, setAskMarketing] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setStep(0)
      setError('')
      setAskMarketing(false)
      const last = getLastPhone()
      if (last) setPhone(last)
      void prefill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function prefill() {
    const user = await getMyProfile()
    if (!user) return
    if (user.name) setName(user.name)
    if (user.phone) setPhone(user.phone)
    if (user.gender) setGender(user.gender)
    if (user.age_range) setAgeRange(user.age_range)
    if (user.pace) setPace(user.pace)
    if (user.marketing_consent) setAgreeMarketing(true)
  }

  const ageValid = !!ageRange && /^\d{1,2}$/.test(ageRange.trim())

  // 각 단계 진행 가능 여부
  function stepValid(s: number): boolean {
    switch (s) {
      case 0:
        return isValidPhone(phone)
      case 1:
        return !!name.trim() && !!gender && ageValid
      case 2:
        return !!pace && canRun5k !== null && !!runPurpose
      case 3:
        return !!plan && dates.length > 0
      case 4:
        return agreeTerms && agreePrivacy
      default:
        return true
    }
  }

  // 이용권 선택 — 시즌권이면 다음 4주 목요일 자동 선택, 회권이면 직접 고르게 비움
  function choosePlan(code: string) {
    setPlan(code)
    analytics.planSelect(code === 'season' ? 'season' : 'single')
    if (code === 'season') setDates(getNextThursdays(4))
    else setDates([])
  }

  function buildForm(marketing: boolean): ApplicationForm {
    return {
      name: name.trim(),
      phone,
      gender: gender!,
      ageRange: ageRange!,
      pace: pace!,
      mbti,
      wishPlacesWeekday: [FIXED_PLACE],
      wishPlacesWeekend: [],
      wishDates: dates,
      marketingConsent: marketing,
      canRun5k: canRun5k ?? undefined,
      runPurpose: runPurpose ?? undefined,
      plan: plan ?? undefined,
      recordProof,
    }
  }

  // 마지막 단계 제출 클릭 → (마케팅 재확인) → 로그인 or 제출
  function handleFinishClick() {
    if (!stepValid(TOTAL_STEPS - 1)) return
    if (!agreeMarketing) {
      setAskMarketing(true)
      return
    }
    void proceed(agreeMarketing)
  }

  async function proceed(marketing: boolean) {
    setAskMarketing(false)
    setError('')
    analytics.applicationSubmit()
    const form = buildForm(marketing)
    saveLastPhone(phone.trim())
    if (!session) {
      // 로그인 없이 여기까지 옴 → 폼 저장 후 카카오 로그인(redirect). 복귀 후 App 이 자동 제출.
      savePendingApplication(form)
      await signInWithKakao()
      return
    }
    // 이미 로그인 상태면 바로 제출
    setSubmitting(true)
    try {
      const { applicationId } = await submitApplication(form)
      onSuccess({ applicationId, phone: phone.trim(), name: name.trim() })
    } catch (e) {
      setError(e instanceof FriendlyError ? e.message : '알 수 없는 오류가 발생했어요. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const progress = Math.round(((step + 1) / TOTAL_STEPS) * 100)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white border border-gray-200 rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 + 진행바 */}
        <div className="sticky top-0 bg-white/95 backdrop-blur px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">신청하기</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="text-gray-400 hover:text-gray-900 text-xl leading-none px-2 py-1"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-gray-900 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-gray-400">
              {step + 1}/{TOTAL_STEPS}
            </span>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5 min-h-[260px]">
          {/* STEP 0 — 연락처 */}
          {step === 0 && (
            <Field label="연락처" hint="매칭되면 이 번호로 안내드려요">
              <input
                type="tel"
                inputMode="numeric"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                placeholder="010-1234-5678"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-lg text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-900"
              />
              <p className="mt-2 text-xs text-gray-400">로그인 없이 시작해요. 마지막에 카카오로 1초 인증만 하면 끝!</p>
            </Field>
          )}

          {/* STEP 1 — 기본 정보 */}
          {step === 1 && (
            <>
              <Field label="이름">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-900"
                />
              </Field>
              <Field label="성별">
                <div className="flex gap-2">
                  {GENDERS.map((g) => (
                    <Chip key={g} selected={gender === g} onClick={() => setGender(g)} className="flex-1 justify-center">
                      {g}
                    </Chip>
                  ))}
                </div>
              </Field>
              <Field label="나이" hint="만 나이로 입력해 주세요">
                <input
                  type="number"
                  inputMode="numeric"
                  min={14}
                  max={99}
                  value={ageRange ?? ''}
                  onChange={(e) => setAgeRange(e.target.value)}
                  placeholder="예: 29"
                  className="w-32 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-900"
                />
                <span className="ml-2 text-sm text-gray-500">세</span>
              </Field>
              <Field label="MBTI" hint="선택 — 그룹 분위기 참고용">
                <input
                  type="text"
                  value={mbti}
                  onChange={(e) => setMbti(e.target.value.toUpperCase().slice(0, 4))}
                  placeholder="예: ENFP"
                  className="w-32 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-900 uppercase"
                />
              </Field>
            </>
          )}

          {/* STEP 2 — 페이스 · 5km · 목적 */}
          {step === 2 && (
            <>
              <Field label="러닝 페이스" hint="정확히 안 맞아도 더 가까운 쪽으로">
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
                    <p className="text-xs text-gray-400 mt-0.5">* 페이스 = 1km를 달리는 시간 (분/km)</p>
                  </div>
                )}
              </Field>
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
            </>
          )}

          {/* STEP 3 — 이용권 + 희망 날짜 */}
          {step === 3 && (
            <>
              <Field label="이용권" hint="시즌권은 목요일 4주가 자동 선택돼요">
                <div className="space-y-2">
                  {PLANS.map((p) => {
                    const on = plan === p.code
                    return (
                      <button
                        key={p.code}
                        type="button"
                        onClick={() => choosePlan(p.code)}
                        className={
                          'w-full text-left rounded-2xl border px-4 py-3 transition-colors ' +
                          (on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900')
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{p.label}</span>
                            {p.badge && (
                              <span
                                className={
                                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full ' +
                                  (on ? 'bg-white text-gray-900' : 'bg-rose-500 text-white')
                                }
                              >
                                {p.badge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {p.originalPrice && (
                              <span className={'text-xs line-through ' + (on ? 'text-white/40' : 'text-gray-300')}>
                                {p.originalPrice}
                              </span>
                            )}
                            <span className="font-bold">{p.price}</span>
                          </div>
                        </div>
                        <p className={'text-xs mt-1 ' + (on ? 'text-white/70' : 'text-gray-400')}>{p.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </Field>

              {plan === 'season' && <SeasonDetail />}

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
            </>
          )}

          {/* STEP 4 — 기록 인증 · 동의 · 마무리 */}
          {step === 4 && (
            <>
              <Field label="러닝 기록 인증" hint="선택 — 넣으면 더 정확히 매칭돼요">
                <input
                  type="text"
                  value={recordProof}
                  onChange={(e) => setRecordProof(e.target.value)}
                  placeholder="Strava 링크 또는 최근 기록 (예: 5km 27분, 주 3회)"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-900"
                />
              </Field>
              <div className="space-y-2">
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
              {!session && (
                <p className="text-xs text-gray-400">
                  ‘신청 완료’를 누르면 카카오로 1초 인증 후 접수돼요. 입력하신 내용은 그대로 유지됩니다.
                </p>
              )}
            </>
          )}

          {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        {/* 푸터 — 이전 / 다음 / 신청완료 */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur px-5 py-4 border-t border-gray-100">
          {askMarketing ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                딱 맞는 다음 모임·재참여 소식을 놓치지 않게 <span className="font-bold">안내받으시겠어요?</span>{' '}
                <span className="text-xs text-gray-400">(언제든 수신 거부 가능)</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAgreeMarketing(true)
                    void proceed(true)
                  }}
                  className="flex-1 rounded-xl bg-gray-900 text-white font-bold py-3 text-sm"
                >
                  네, 받을게요
                </button>
                <button
                  type="button"
                  onClick={() => void proceed(false)}
                  className="flex-1 rounded-xl bg-gray-200 text-gray-600 font-bold py-3 text-sm"
                >
                  괜찮아요
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-2xl bg-gray-100 text-gray-600 font-bold px-5 py-3.5"
                >
                  이전
                </button>
              )}
              {step < TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!stepValid(step)}
                  className="flex-1 rounded-2xl bg-gray-900 text-white font-bold py-3.5 disabled:opacity-30 active:scale-[0.99] transition-transform"
                >
                  다음
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishClick}
                  disabled={!stepValid(5) || submitting}
                  className="flex-1 rounded-2xl bg-gray-900 text-white font-bold py-3.5 disabled:opacity-30 active:scale-[0.99] transition-transform"
                >
                  {submitting ? '신청 중…' : session ? '신청 완료하기' : '카카오로 인증하고 신청 완료'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SEASON_TIMELINE: { week: string; title: string; desc: string }[] = [
  { week: '1주차', title: '첫 온도', desc: '어색함은 제로. 나와 페이스가 비슷한 러닝메이트와 기분 좋은 첫 한강 러닝.' },
  { week: '2주차', title: '체득', desc: '오버페이스 없는 달리기. 내 숨소리에 집중하며 5km를 지치지 않고 완주하는 경험.' },
  { week: '3주차', title: '전환', desc: '목요일 밤 8시가 기다려지기 시작합니다. 낮 동안 쌓인 업무 스트레스가 한강 바람과 함께 풀려요.' },
  { week: '4주차', title: '습관', desc: '4주 완주 완료. 달리기는 더 이상 결심해야 하는 숙제가 아니라, 삶 속의 기분 좋은 루틴이 됩니다.' },
]

// 시즌권 선택 시 노출되는 설명 · 4주 타임라인 · 안내문
function SeasonDetail() {
  return (
    <div className="rounded-2xl bg-gray-900 text-white p-4">
      <p className="text-sm leading-relaxed">
        의지보다 강력한 건, <span className="font-bold">나를 기다리는 동료들</span>입니다.
        <br />
        억지로 쥐어짜는 갓생 말고, 매주 목요일 밤 자연스럽게 몸이 먼저 반응하는 4주 러닝 루틴을 만들어보세요.
      </p>

      <div className="mt-4 relative pl-1">
        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-white/20" />
        <div className="space-y-3">
          {SEASON_TIMELINE.map((w) => (
            <div key={w.week} className="relative flex gap-3">
              <div className="relative z-10 mt-1 w-2.5 h-2.5 shrink-0 rounded-full bg-white" />
              <div>
                <p className="text-sm font-bold">
                  {w.week} · {w.title}
                </p>
                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-white/70 leading-relaxed border-t border-white/10 pt-3">
        시즌권 러너에게는 매주 페이스와 성향(T/F, 조용한 러닝 등)에 가장 잘 맞는 그룹을{' '}
        <span className="font-bold text-white">1순위로 정밀 매칭</span>해드려요.
      </p>
    </div>
  )
}

// 서비스 범위 — ONDO가 하는 것 / 안 하는 것 (랜딩·신청폼 공용)
export function ServiceScope() {
  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 text-xs leading-relaxed">
      <p className="font-bold text-gray-900 mb-1.5">ONDO가 하는 것</p>
      <ul className="space-y-1 text-gray-600">
        {[
          '최근 페이스·러닝 기록을 확인한 러너 매칭',
          '비슷한 페이스의 3~5명 소규모 그룹 구성',
          '집합 장소·시간·함께 뛸 분들의 페이스 안내',
          '3명 이상 성사 보장 (안 되면 2주 내 재매칭, 그래도 안 되면 환불)',
        ].map((t) => (
          <li key={t} className="flex gap-1.5">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <p className="font-bold text-gray-900 mt-3 mb-1.5">ONDO가 하지 않는 것</p>
      <ul className="space-y-1 text-gray-500">
        {[
          '현장 진행자·인솔자 (운영자가 함께 뛰지 않아요)',
          '러닝 코칭·페이스메이킹·기록 지도',
          '코스 리딩 (집합 장소까지만 안내해요)',
          '뒤풀이·커피·식사 운영',
        ].map((t) => (
          <li key={t} className="flex gap-1.5">
            <span className="text-rose-500 font-bold">✗</span>
            <span>{t}</span>
          </li>
        ))}
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
