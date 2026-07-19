-- ════════════════════════════════════════════════════════════════════
--  ONDO 10 — 참석(attended) 기록
--  실행: Supabase SQL Editor 에 전체 붙여넣고 Run (멱등)
--
--  목적: 보증금 이월/소멸 판정과 북극성 지표(주간 활성 러너)의 근거인
--  "실제 참석 여부"를 시스템 안으로. 어드민에서 세션 다음날 토글.
-- ════════════════════════════════════════════════════════════════════

-- 1) 참석 컬럼
alter table public.applications add column if not exists attended boolean;

-- 2) admin_update_application 재생성: p_attended 추가
drop function if exists public.admin_update_application(text,uuid,boolean,boolean,text,date);
-- p_attended 에 default 를 둬서 구버전 프론트(6개 인자 호출)도 이 함수로 해소되게 함
-- → "SQL 먼저 실행 → 프론트 배포" 순서가 무중단이 된다
create or replace function public.admin_update_application(
  p_key text, p_id uuid, p_paid boolean, p_invited boolean, p_status text,
  p_session_date date, p_attended boolean default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_key) then raise exception 'unauthorized'; end if;
  update public.applications set
    paid         = coalesce(p_paid, paid),
    invited      = coalesce(p_invited, invited),
    status       = coalesce(p_status, status),
    session_date = coalesce(p_session_date, session_date),
    attended     = coalesce(p_attended, attended)
  where id = p_id;
end; $$;
revoke all on function public.admin_update_application(text,uuid,boolean,boolean,text,date,boolean) from public;
grant execute on function public.admin_update_application(text,uuid,boolean,boolean,text,date,boolean) to anon;

-- 3) admin_list_applications 재생성: attended 반환 추가 (09 버전 + attended)
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
  user_marketing_consent boolean, user_mbti text, user_pace_verified boolean,
  is_guest boolean, attended boolean
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_key) then raise exception 'unauthorized'; end if;
  return query
    select a.id, a.status, a.paid, a.invited, a.created_at,
      a.wish_places_weekday, a.wish_places_weekend, a.wish_dates,
      a.can_run_5k, a.run_purpose, a.plan, a.record_proof, a.session_date,
      a.slot_id, s.date, s.place, s.pace_label, s.max_members, s.status,
      a.user_id,
      coalesce(u.name, g.name),
      coalesce(u.phone, g.phone),
      coalesce(u.gender, g.gender),
      coalesce(u.age_range, g.age_range),
      coalesce(u.pace, g.pace),
      coalesce(u.total_count, 0),
      (select count(*) from public.applications a2
        where a2.user_id is not null and a2.user_id = a.user_id
          and a2.status = 'confirmed' and a2.id <> a.id),
      coalesce(u.marketing_consent, g.marketing_consent, false),
      u.mbti,
      coalesce(u.pace_verified, false),
      (a.user_id is null),
      a.attended
    from public.applications a
    left join public.users u on u.id = a.user_id
    left join public.guest_applicants g on g.application_id = a.id
    left join public.slots s on s.id = a.slot_id
    order by a.created_at desc;
end; $$;
revoke all on function public.admin_list_applications(text) from public;
grant execute on function public.admin_list_applications(text) to anon;
