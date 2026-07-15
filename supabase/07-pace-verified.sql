-- ════════════════════════════════════════════════════════════════════
--  ONDO 07 — 검증된 페이스 뱃지
--  실행: Supabase SQL Editor 에 전체 붙여넣고 Run (멱등)
-- ════════════════════════════════════════════════════════════════════

alter table public.users add column if not exists pace_verified boolean not null default false;

-- 운영자: 페이스 검증 토글 (참가 후 실제 기록 확인 시)
create or replace function public.admin_set_pace_verified(
  p_key text, p_user_id uuid, p_verified boolean
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_key) then raise exception 'unauthorized'; end if;
  update public.users set pace_verified = p_verified where id = p_user_id;
end; $$;
revoke all on function public.admin_set_pace_verified(text,uuid,boolean) from public;
grant execute on function public.admin_set_pace_verified(text,uuid,boolean) to anon;

-- admin_list_applications 재생성 (user_pace_verified 추가)
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
  user_marketing_consent boolean, user_mbti text, user_pace_verified boolean
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
      u.marketing_consent, u.mbti, u.pace_verified
    from public.applications a
    join public.users u on u.id = a.user_id
    left join public.slots s on s.id = a.slot_id
    order by a.created_at desc;
end; $$;
revoke all on function public.admin_list_applications(text) from public;
grant execute on function public.admin_list_applications(text) to anon;
