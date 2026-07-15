-- ════════════════════════════════════════════════════════════════════
--  ONDO 09 — 비로그인 신청 (게스트) + 로그인 시 자동 연결
--  실행: Supabase SQL Editor 에 전체 붙여넣고 Run (멱등)
--
--  설계: applications.user_id 를 nullable 로 바꾸고, 게스트 개인정보(이름/전화/
--  성별/나이/페이스/MBTI)는 별도 테이블 guest_applicants 에 저장한다.
--  applications 테이블은 이미 "select 는 누구나(PII 없음)" 정책이 걸려 있어서,
--  거기에 PII 컬럼을 직접 추가하면 공개 노출되므로 반드시 분리한다.
-- ════════════════════════════════════════════════════════════════════

-- 0) 방어적 컬럼 보강 (이미 있으면 무시)
alter table public.applications add column if not exists referral_code text;

-- 1) user_id nullable 화
alter table public.applications alter column user_id drop not null;

-- 2) 게스트 개인정보 테이블 (완전 비공개 — SECURITY DEFINER 함수로만 접근)
create table if not exists public.guest_applicants (
  application_id    uuid primary key references public.applications(id) on delete cascade,
  phone             text not null,
  name              text not null,
  gender            text check (gender in ('남','여')),
  age_range         text,
  pace              text check (pace in ('A','B','C','D')),
  mbti              text,
  marketing_consent boolean not null default false,
  created_at        timestamptz not null default now()
);
alter table public.guest_applicants enable row level security;
revoke all on public.guest_applicants from anon, authenticated;

-- 3) 게스트 신청 접수 (비로그인 anon 도 호출 가능 — SECURITY DEFINER 로 RLS 우회)
create or replace function public.submit_guest_application(
  p_name text, p_phone text, p_gender text, p_age_range text, p_pace text, p_mbti text,
  p_can_run_5k boolean, p_run_purpose text, p_plan text, p_record_proof text,
  p_referral_code text, p_marketing_consent boolean,
  p_wish_places_weekday text[], p_wish_places_weekend text[], p_wish_dates date[]
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_app_id uuid;
  v_dup_count int;
begin
  -- 최근 6시간 내 동일 번호로 접수된 미취소 신청 있으면 중복 차단
  select count(*) into v_dup_count
  from public.guest_applicants g
  join public.applications a on a.id = g.application_id
  where g.phone = p_phone
    and a.status in ('applied','confirmed')
    and a.created_at > now() - interval '6 hours';
  if v_dup_count > 0 then
    raise exception 'duplicate_recent';
  end if;

  insert into public.applications (
    user_id, can_run_5k, run_purpose, plan, record_proof, referral_code,
    wish_places_weekday, wish_places_weekend, wish_dates
  ) values (
    null, p_can_run_5k, p_run_purpose, p_plan, p_record_proof, p_referral_code,
    p_wish_places_weekday, p_wish_places_weekend, p_wish_dates
  ) returning id into v_app_id;

  insert into public.guest_applicants (
    application_id, phone, name, gender, age_range, pace, mbti, marketing_consent
  ) values (
    v_app_id, p_phone, p_name, p_gender, p_age_range, p_pace, p_mbti, coalesce(p_marketing_consent, false)
  );

  return v_app_id;
end; $$;
revoke all on function public.submit_guest_application(text,text,text,text,text,text,boolean,text,text,text,text,boolean,text[],text[],date[]) from public;
grant execute on function public.submit_guest_application(text,text,text,text,text,text,boolean,text,text,text,text,boolean,text[],text[],date[]) to anon, authenticated;

-- 4) 로그인 시 같은 번호의 게스트 신청을 내 계정으로 연결 (claim)
create or replace function public.claim_guest_applications(p_phone text)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_claimed int := 0;
  v_row record;
begin
  if v_uid is null or p_phone is null then
    return 0;
  end if;

  for v_row in
    select g.application_id, g.name, g.gender, g.age_range, g.pace, g.mbti, g.marketing_consent
    from public.guest_applicants g
    join public.applications a on a.id = g.application_id
    where g.phone = p_phone and a.user_id is null
  loop
    -- 내 프로필에 반영 (이미 있으면 게스트 값으로 덮어쓰지 않고 최초 1회만 채움)
    insert into public.users (id, phone, name, gender, age_range, pace, marketing_consent)
    values (v_uid, p_phone, v_row.name, v_row.gender, v_row.age_range, v_row.pace, v_row.marketing_consent)
    on conflict (id) do nothing;

    update public.applications set user_id = v_uid where id = v_row.application_id;
    v_claimed := v_claimed + 1;
  end loop;

  return v_claimed;
end; $$;
revoke all on function public.claim_guest_applications(text) from public;
grant execute on function public.claim_guest_applications(text) to authenticated;

-- 5) admin_list_applications 재생성: user 또는 guest 정보를 coalesce 로 반환
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
  is_guest boolean
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
      (a.user_id is null)
    from public.applications a
    left join public.users u on u.id = a.user_id
    left join public.guest_applicants g on g.application_id = a.id
    left join public.slots s on s.id = a.slot_id
    order by a.created_at desc;
end; $$;
revoke all on function public.admin_list_applications(text) from public;
grant execute on function public.admin_list_applications(text) to anon;

-- 6) 신청자 구성 집계 재생성: 게스트 포함 (LEFT JOIN + coalesce)
create or replace function public.get_applicant_demographics()
returns table (dimension text, label text, cnt int)
language sql security definer set search_path = public as $$
  with pool as (
    select coalesce(u.pace, g.pace) as pace,
           coalesce(u.age_range, g.age_range) as age_range,
           coalesce(u.gender, g.gender) as gender
    from public.applications a
    left join public.users u on u.id = a.user_id
    left join public.guest_applicants g on g.application_id = a.id
    where a.status in ('applied','confirmed')
  )
  select 'pace'::text,
    case pace when 'C' then '6분 페이스' when 'B' then '7분 페이스' else '기타' end,
    count(*)::int
  from pool group by 2
  union all
  select 'age',
    case
      when age_range ~ '^[0-9]+$' and age_range::int < 25 then '20대 초반'
      when age_range ~ '^[0-9]+$' and age_range::int < 30 then '20대 후반'
      when age_range ~ '^[0-9]+$' and age_range::int < 35 then '30대 초반'
      when age_range ~ '^[0-9]+$' and age_range::int < 40 then '30대 후반'
      when age_range ~ '^[0-9]+$' then '40대+'
      else '비공개'
    end, count(*)::int
  from pool group by 2
  union all
  select 'gender', coalesce(gender, '비공개'), count(*)::int
  from pool group by 2;
$$;
grant execute on function public.get_applicant_demographics() to anon, authenticated;

-- 7) 세션 확정 인원 페이스 집계 재생성: 게스트 포함
create or replace function public.get_confirmed_session_stats(p_session_date date)
returns table (pace text, cnt int)
language sql security definer set search_path = public as $$
  select coalesce(u.pace, g.pace), count(*)::int
  from public.applications a
  left join public.users u on u.id = a.user_id
  left join public.guest_applicants g on g.application_id = a.id
  where a.session_date = p_session_date and a.status = 'confirmed'
  group by 1;
$$;
grant execute on function public.get_confirmed_session_stats(date) to anon, authenticated;
