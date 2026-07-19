import { useState } from 'react'
import { formatPhoneInput, isValidPhone } from '../lib/format'
import { saveLead } from '../lib/api'
import { analytics } from '../lib/analytics'
import { POLICY } from '../types'

interface LeadPopupProps {
  onClose: () => void
  onApply: () => void
}

export function LeadPopup({ onClose, onApply }: LeadPopupProps) {
  const savedPhone = localStorage.getItem('ondo_lead_phone') ?? ''
  const [phone, setPhone] = useState(savedPhone)
  const [submitted, setSubmitted] = useState(false)

  // 이미 전화번호가 저장된 경우 바로 신청 화면으로
  const alreadySaved = !!savedPhone

  function dismiss() {
    localStorage.setItem('ondo_lead_seen', '1')
    onClose()
  }

  function handleSubmit() {
    if (!isValidPhone(phone)) return
    localStorage.setItem('ondo_lead_phone', phone)
    localStorage.setItem('ondo_lead_seen', '1')
    void saveLead(phone)
    analytics.leadSubmit()
    setSubmitted(true)
  }

  if (alreadySaved || submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
          <p className="text-3xl mb-3">🏃‍♂️</p>
          <p className="font-bold text-gray-900 text-lg">
            {alreadySaved ? '다시 오셨네요!' : '저장됐어요!'}
          </p>
          <p className="mt-1 text-sm text-gray-500">바로 신청하시겠어요?</p>
          <button
            type="button"
            onClick={() => { dismiss(); onApply() }}
            className="mt-5 w-full rounded-2xl bg-gray-900 text-white font-bold py-3.5"
          >
            러닝메이트 만나기
          </button>
          <button type="button" onClick={dismiss} className="mt-2 w-full text-xs text-gray-400 py-2">
            나중에 할게요
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-bold text-gray-900 text-lg leading-snug">
              이번 주는 어려우세요?
            </p>
            <p className="mt-1 text-sm text-gray-500">
              괜찮아요, ONDO는 이제 무료니까요.
              <br />
              다음 목요일 모집이 열리면 알려드릴게요.
            </p>
          </div>
          <button type="button" onClick={dismiss} className="text-gray-300 hover:text-gray-500 text-xl px-1 -mt-1">✕</button>
        </div>

        <input
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          placeholder="010-1234-5678"
          className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-lg text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-900"
        />

        {/* 개인정보 수집·광고성 수신 동의 고지 (정통망법·개보법 — 버튼 클릭으로 동의 갈음) */}
        <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
          버튼을 누르면 <span className="text-gray-500 font-medium">휴대전화번호 수집·이용</span>과{' '}
          <span className="text-gray-500 font-medium">모집 알림(광고성 정보) 수신</span>에 동의하는
          것으로 처리돼요. 보유 기간은 동의 철회 시 또는 수집일로부터 1년이며, 언제든 수신을 거부할
          수 있어요.{' '}
          <a
            href={POLICY.privacy}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-gray-500"
          >
            개인정보처리방침
          </a>
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValidPhone(phone)}
          className="mt-2 w-full rounded-2xl bg-gray-900 text-white font-bold py-3.5 disabled:opacity-30"
        >
          동의하고 다음 모집 알림 받기
        </button>
        <button type="button" onClick={dismiss} className="mt-2 w-full text-xs text-gray-400 py-2">
          괜찮아요, 그냥 볼게요
        </button>
      </div>
    </div>
  )
}
