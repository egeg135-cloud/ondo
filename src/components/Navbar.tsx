import type { Session } from '@supabase/supabase-js'
import { displayName, signInWithKakao, signOut } from '../lib/auth'

interface NavbarProps {
  session: Session | null
  onMyApps: () => void
}

export function Navbar({ session, onMyApps }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-black border-b border-white/10">
      <div className="max-w-[550px] mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-sm tracking-[0.4em] text-white font-extralight uppercase">ONDO</span>
        </a>

        {session ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60">
              <span className="font-semibold text-white">{displayName(session)}</span>님
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-xs text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors"
            >
              로그아웃
            </button>
            <button
              type="button"
              onClick={onMyApps}
              className="flex items-center rounded-lg bg-white text-[#191600] font-semibold text-xs px-3 py-1.5"
            >
              내 신청 내역
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void signInWithKakao()}
            className="flex items-center gap-1.5 rounded-lg bg-[#FEE500] text-[#191600] font-semibold text-xs px-3 py-1.5"
          >
            <img src="/kakao.png" alt="" className="w-4 h-4" /> 카카오 로그인
          </button>
        )}
      </div>
    </header>
  )
}
