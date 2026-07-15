-- ════════════════════════════════════════════════════════════════════
--  ONDO 05 — 매칭확정 · 소통 기능 (1단계)
--  실행: Supabase SQL Editor 에 전체 붙여넣고 Run (멱등)
-- ════════════════════════════════════════════════════════════════════

-- applications: 상태값 확장 + 세션(주차) 연결
alter table public.applications add column if not exists session_date date;

alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in ('applied','confirmed','cancelled','failed'));

-- session_info: 주차별 공지/오픈채팅 (PII 없음 — 공개 read)
create table if not exists public.session_info (
  id uuid primary key default gen_random_uuid(),
  session_date date not null unique,
  notice_text text,
  open_chat_url text,
  updated_at timestamptz not null default now()
);
alter table public.session_info enable row level security;
drop policy if exists session_info_select_all on public.session_info;
create policy session_info_select_all on public.session_info
  for select to anon, authenticated using (true);

-- satisfaction_checks: 세션 종료 후 O/X 2문항 (본인 것만 insert/select)
create table if not exists public.satisfaction_checks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  q1_intensity_ok boolean not null,
  q2_would_reapply boolean not null,
  created_at timestamptz not null default now()
);
alter table public.satisfaction_checks enable row level security;
drop policy if exists satisfaction_select_own on public.satisfaction_checks;
create policy satisfaction_select_own on public.satisfaction_checks
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists satisfaction_insert_own on public.satisfaction_checks;
create policy satisfaction_insert_own on public.satisfaction_checks
  for insert to authenticated with check (auth.uid() = user_id);

-- admin_update_application: session_date 파라미터 추가 (확정/실패 처리 시 주차 스탬프)
drop function if exists public.admin_update_application(text,uuid,boolean,boolean,text);
create or replace function public.admin_update_application(
  p_key text, p_id uuid, p_paid boolean, p_invited boolean, p_status text, p_session_date date
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_key) then raise exception 'unauthorized'; end if;
  update public.applications set
    paid         = coalesce(p_paid, paid),
    invited      = coalesce(p_invited, invited),
    status       = coalesce(p_status, status),
    session_date = coalesce(p_session_date, session_date)
  where id = p_id;
end; $$;
revoke all on function public.admin_update_application(text,uuid,boolean,boolean,text,date) from public;
grant execute on function public.admin_update_application(text,uuid,boolean,boolean,text,date) to anon;

-- admin_list_applications 재생성: session_date 반환 컬럼 추가
drop function if exists public.admin_list_applications(text);
create or replace function public.admin_list_applications(p_key text)
returns table (
  application_id uuid, status text, paid boolean, invited boolean, created_at timestamptz,
  wish_places_weekday text[], wish_places_weekend text[], wish_dates date[],
  can_run_5k boolean, run_purpose text, plan text, record_proof text, session_date date,
  slot_id uuid, slot_date date, slot_place text, slot_pace_label text,
  slot_max_members int, slot_status text,
  user_id uuid, user_name text, user_phone text, user_gender text,
  user_age_range text, user_pace text, user_total_count int, prior_participations bigint,
  user_marketing_consent boolean, user_mbti text
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_key) then raise exception 'unauthorized'; end if;
  return query
    select a.id, a.status, a.paid, a.invited, a.created_at,
      a.wish_places_weekday, a.wish_places_weekend, a.wish_dates,
      a.can_run_5k, a.run_purpose, a.plan, a.record_proof, a.session_date,
      a.slot_id, s.date, s.place, s.pace_label, s.max_members, s.status,
      u.id, u.name, u.phone, u.gender, u.age_range, u.pace, u.total_count,
      (select count(*) from public.applications a2
        where a2.user_id = u.id and a2.status = 'confirmed' and a2.id <> a.id),
      u.marketing_consent, u.mbti
    from public.applications a
    join public.users u on u.id = a.user_id
    left join public.slots s on s.id = a.slot_id
    order by a.created_at desc;
end; $$;
revoke all on function public.admin_list_applications(text) from public;
grant execute on function public.admin_list_applications(text) to anon;

-- admin_set_session_notice: 운영자가 이번 주 공지/오픈채팅 저장 (upsert)
create or replace function public.admin_set_session_notice(
  p_key text, p_session_date date, p_notice_text text, p_open_chat_url text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_key) then raise exception 'unauthorized'; end if;
  insert into public.session_info (session_date, notice_text, open_chat_url, updated_at)
  values (p_session_date, p_notice_text, p_open_chat_url, now())
  on conflict (session_date) do update set
    notice_text = excluded.notice_text,
    open_chat_url = excluded.open_chat_url,
    updated_at = now();
end; $$;
revoke all on function public.admin_set_session_notice(text,date,text,text) from public;
grant execute on function public.admin_set_session_notice(text,date,text,text) to anon;

-- get_confirmed_session_stats: PII 없는 인원수/페이스 구성 집계 (누구나 호출 가능, 페이스별 분리)
create or replace function public.get_confirmed_session_stats(p_session_date date)
returns table (pace text, cnt int)
language sql security definer set search_path = public as $$
  select u.pace, count(*)::int
  from public.applications a
  join public.users u on u.id = a.user_id
  where a.session_date = p_session_date and a.status = 'confirmed'
  group by u.pace;
$$;
grant execute on function public.get_confirmed_session_stats(date) to anon, authenticated;
