-- ════════════════════════════════════════════════════════════════════
--  ONDO 06 — 리드 수집 · 세션 후기
--  실행: Supabase SQL Editor 에 전체 붙여넣고 Run (멱등)
-- ════════════════════════════════════════════════════════════════════

-- leads: 진입 팝업에서 수집한 전화번호 (비로그인 방문자)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists leads_phone_unique on public.leads (phone);
alter table public.leads enable row level security;
-- anon 은 insert 만 가능 (조회는 운영자 RPC 로만)
drop policy if exists leads_insert_anon on public.leads;
create policy leads_insert_anon on public.leads
  for insert to anon, authenticated with check (true);

-- 운영자: 리드 목록 조회
create or replace function public.admin_list_leads(p_key text)
returns table (id uuid, phone text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_key) then raise exception 'unauthorized'; end if;
  return query
    select l.id, l.phone, l.created_at
    from public.leads l
    order by l.created_at desc;
end; $$;
revoke all on function public.admin_list_leads(text) from public;
grant execute on function public.admin_list_leads(text) to anon;

-- satisfaction_checks: 한 문장 후기 추가
alter table public.satisfaction_checks add column if not exists review_text text;

-- 최신 후기 (PII 없음 — 후기 텍스트만, 재참여 의향 O인 것 우선)
create or replace function public.get_recent_reviews(p_limit int default 5)
returns table (review_text text, created_at timestamptz)
language sql security definer set search_path = public as $$
  select s.review_text, s.created_at
  from public.satisfaction_checks s
  where s.review_text is not null and length(trim(s.review_text)) > 0
  order by s.q2_would_reapply desc, s.created_at desc
  limit p_limit;
$$;
grant execute on function public.get_recent_reviews(int) to anon, authenticated;
