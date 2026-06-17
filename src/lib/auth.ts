import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

/** 카카오 OAuth 로그인 시작 (현재 페이지로 복귀)
 *  scopes 를 닉네임으로만 제한 — 카카오에 설정 안 한 account_email/profile_image 를
 *  요청해서 나는 KOE205 에러를 피한다. (이메일·프로필사진은 우리 서비스에 불필요) */
export function signInWithKakao() {
  return supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: window.location.origin,
      scopes: 'profile_nickname',
    },
  })
}

export function signOut() {
  return supabase.auth.signOut()
}

/** 카카오 프로필에서 표시용 이름 추출 */
export function displayName(session: Session | null): string {
  if (!session) return ''
  const m = session.user.user_metadata ?? {}
  return (m.name as string) || (m.full_name as string) || (m.preferred_username as string) || '회원'
}

/** 현재 세션을 구독하는 훅 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, loading }
}
