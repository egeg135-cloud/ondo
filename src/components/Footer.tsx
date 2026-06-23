import { POLICY } from '../types'

export function Footer() {
  return (
    <footer className="bg-black">
      <div className="max-w-[550px] mx-auto px-4 py-10 space-y-6">

        <div>
          <p className="text-sm tracking-[0.4em] text-white font-extralight uppercase">ONDO</p>
          <p className="mt-1 text-xs text-white/50 leading-relaxed">
            소규모 웰니스 매칭 서비스
          </p>
        </div>

        {/* 사업자 정보 */}
        <div className="text-xs text-white/40 leading-relaxed">
          <p className="text-white/60 font-semibold">모티피플</p>
          <p className="mt-1">사업자 등록번호: 783-34-01846 ㅣ 대표: 김무관</p>
          <p>주소: 서울 노원구 동일로174길 27</p>
        </div>

        {/* 약관 · 정책 · 문의 */}
        <div className="flex flex-col gap-2 text-sm">
          <a
            href={POLICY.terms}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white transition-colors w-fit"
          >
            이용약관 및 안전·면책 고지
          </a>
          <a
            href={POLICY.privacy}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white transition-colors w-fit"
          >
            개인정보처리방침
          </a>
          <a
            href={`mailto:${POLICY.email}`}
            className="text-white/50 hover:text-white transition-colors w-fit"
          >
            {POLICY.email}
          </a>
          <a
            href="https://instagram.com/ondo.pm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors w-fit"
          >
            <InstagramIcon />
            @ondo.pm
          </a>
        </div>

        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-white/30">
            © 2026 ONDO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}
