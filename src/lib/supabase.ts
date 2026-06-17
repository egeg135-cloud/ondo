import { createClient } from '@supabase/supabase-js'

// 환경변수에서 Supabase 연결 정보를 읽어옵니다. (코드에 하드코딩 금지)
// 값은 .env 파일에 넣고, .env 는 .gitignore 에 포함되어 커밋되지 않습니다.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 키가 비어 있으면 개발 중 바로 알아챌 수 있도록 경고를 남깁니다.
// (anon key 는 Supabase 대시보드 Settings → API 에서 가져와 .env 에 넣어주세요.)
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    '[ONDO] Supabase 환경변수가 설정되지 않았습니다. .env 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 를 넣어주세요.',
  )
}

// 키가 없어도 앱이 죽지 않도록 더미 값으로 클라이언트를 만들어 둡니다.
// (createClient 는 빈 문자열 키를 받으면 "supabaseKey is required" 에러를 던지므로
//  placeholder 문자열을 사용합니다. 실제 키가 .env 에 들어오면 정상 동작합니다.)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
)
