-- ════════════════════════════════════════════════════════════════════
--  ONDO 03 — 운영 프로토콜 v3.1 신청 항목
--  실행: Supabase SQL Editor 에 전체 붙여넣고 Run (멱등)
-- ════════════════════════════════════════════════════════════════════

-- 마케팅 동의 (users) — 이미 실행했으면 무시됨
alter table public.users add column if not exists marketing_consent boolean not null default false;

-- 신청 추가 항목 (applications)
alter table public.applications add column if not exists can_run_5k boolean;
alter table public.applications add column if not exists run_purpose text;   -- 'record' | 'steady'
alter table public.applications add column if not exists plan text;          -- 'single' | 'season'
alter table public.applications add column if not exists record_proof text;  -- 기록 인증 링크/메모

-- admin_list_applications 재생성 (반환 컬럼 추가: v3.1 항목 + 마케팅동의)
drop function if exists public.admin_list_applications(text);
create or replace function public.admin_list_applications(p_key text)
returns table (
  application_id uuid, status text, paid boolean, invited boolean, created_at timestamptz,
  wish_places_weekday text[], wish_places_weekend text[], wish_dates date[],
  can_run_5k boolean, run_purpose text, plan text, record_proof text,
  slot_id uuid, slot_date date, slot_place text, slot_pace_label text,
  slot_max_members int, slot_status text,
  user_id uuid, user_name text, user_phone text, user_gender text,
  user_age_range text, user_pace text, user_total_count int, prior_participations bigint,
  user_marketing_consent boolean
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_key) then raise exception 'unauthorized'; end if;
  return query
    select a.id, a.status, a.paid, a.invited, a.created_at,
      a.wish_places_weekday, a.wish_places_weekend, a.wish_dates,
      a.can_run_5k, a.run_purpose, a.plan, a.record_proof,
      a.slot_id, s.date, s.place, s.pace_label, s.max_members, s.status,
      u.id, u.name, u.phone, u.gender, u.age_range, u.pace, u.total_count,
      (select count(*) from public.applications a2
        where a2.user_id = u.id and a2.status = 'confirmed' and a2.id <> a.id),
      u.marketing_consent
    from public.applications a
    join public.users u on u.id = a.user_id
    left join public.slots s on s.id = a.slot_id
    order by a.created_at desc;
end; $$;
revoke all on function public.admin_list_applications(text) from public;
grant execute on function public.admin_list_applications(text) to anon;
