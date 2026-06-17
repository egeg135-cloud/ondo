import { supabase } from './supabase'

/**
 * applications / slots 테이블의 변경을 실시간 구독한다.
 * 변경이 생기면 onChange 를 호출해 호출측이 다시 집계를 읽도록 한다.
 * (users 는 Realtime 발행 제외 — PII 누수 방지. 카운터는 applications 변경에 맞춰 다시 읽음)
 *
 * 반환된 함수를 호출하면 구독이 해제된다.
 */
export function subscribeToApplications(onChange: () => void): () => void {
  const channel = supabase
    .channel('ondo-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, onChange)
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
