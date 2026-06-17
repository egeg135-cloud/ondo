-- ════════════════════════════════════════════════════════════════════
--  ONDO 02 — 카카오 로그인(Supabase Auth) 기반으로 재설계
--  실행: Supabase SQL Editor 에 전체 붙여넣고 Run
--  ⚠️ users / applications 를 새로 만들며 기존(더미) 데이터는 사라집니다.
-- ════════════════════════════════════════════════════════════════════

-- 1) 옛 전화번호 기반 객체 제거
drop function if exists public.get_user_by_phone(text);
drop function if exists public.upsert_user_by_phone(text,text,text,text,text);
drop table if exists public.applications cascade;
drop table if exists public.users cascade;

-- 2) users — auth.users 와 1:1 (id = auth.uid())
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  phone         text,                 -- 연락처(고유키 아님)
  name          text,
  gender        text check (gender in ('남','여')),
  age_range     text,
  pace          text check (pace in ('A','B','C','D')),
  total_count   int  not null default 0,
  no_show_count int  not null default 0,
  created_at    timestamptz not null default now()
);

-- 3) applications
create table public.applications (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  slot_id             uuid references public.slots(id) on delete cascade,
  wish_places_weekday text[],
  wish_places_weekend text[],
  wish_dates          date[],
  status              text not null default 'applied' check (status in ('applied','confirmed','cancelled')),
  paid                boolean not null default false,
  invited             boolean not null default false,
  created_at          timestamptz not null default now()
);
create unique index applications_user_slot_unique
  on public.applications (user_id, slot_id) where slot_id is not null;
create index applications_slot_idx on public.applications (slot_id);

-- 4) Realtime 발행 (라이브 카운트용) — users 는 제외(PII)
do $$
declare t text;
begin
  foreach t in array array['applications'] loop
    if not exists (select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
--  RLS — 본인 행만
-- ════════════════════════════════════════════════════════════════════
alter table public.users        enable row level security;
alter table public.applications enable row level security;

-- users: anon 은 일절 접근 불가, 로그인 유저는 본인 프로필만
revoke all on public.users from anon;
create policy users_select_own on public.users
  for select to authenticated using (auth.uid() = id);
create policy users_insert_own on public.users
  for insert to authenticated with check (auth.uid() = id);
create policy users_update_own on public.users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- applications:
--   SELECT 는 누구나 허용 (이 테이블엔 이름/전화 없음 — 실시간 카운트·집계용).
--   INSERT/UPDATE 는 본인 것만. (운영자 변경은 키 검증 함수로 별도)
create policy apps_select_all on public.applications
  for select to anon, authenticated using (true);
create policy apps_insert_own on public.applications
  for insert to authenticated with check (user_id = auth.uid());
create policy apps_update_own on public.applications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- slots: 조회는 누구나(예전 정책 유지), 쓰기 정책 제거 → 생성/수정은 admin 함수로만
drop policy if exists "anon_write_slots" on public.slots;

-- ════════════════════════════════════════════════════════════════════
--  랜딩 집계 함수 (PII 없이 숫자/라벨만) — 비로그인도 호출 가능
-- ════════════════════════════════════════════════════════════════════

-- open 슬롯 + 신청 집계 (이름/전화 노출 0)
create or replace function public.get_open_slots_with_stats()
returns table (
  id uuid, date date, place text, max_members int, pace_label text, status text,
  cnt int, female int, male int, age_label text
)
language sql
security definer
set search_path = public
as $$
  select s.id, s.date, s.place, s.max_members, s.pace_label, s.status,
    coalesce(st.cnt, 0)::int,
    coalesce(st.female, 0)::int,
    coalesce(st.male, 0)::int,
    st.age_label
  from public.slots s
  left join lateral (
    select
      count(*)::int as cnt,
      count(*) filter (where u.gender = '여')::int as female,
      count(*) filter (where u.gender = '남')::int as male,
      (
        select case when d is null then null else d || ' 위주' end
        from (
          select case
                   when u2.age_range like '20%' then '20대'
                   when u2.age_range like '30%' then '30대'
                   when u2.age_range like '40%' then '40대+'
                   else u2.age_range
                 end as d,
                 count(*) as c
          from public.applications a2
          join public.users u2 on u2.id = a2.user_id
          where a2.slot_id = s.id and a2.status <> 'cancelled'
          group by 1
          order by c desc, 1
          limit 1
        ) m
      ) as age_label
    from public.applications a
    join public.users u on u.id = a.user_id
    where a.slot_id = s.id and a.status <> 'cancelled'
  ) st on true
  where s.status = 'open'
  order by s.date asc;
$$;
grant execute on function public.get_open_slots_with_stats() to anon, authenticated;

-- 참여 인원 수 (500 카운터)
create or replace function public.get_member_count()
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.users;
$$;
grant execute on function public.get_member_count() to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
--  운영자 쓰기 함수 (키 검증) — slots 쓰기/application 변경
-- ════════════════════════════════════════════════════════════════════
create or replace function public.admin_create_slot(
  p_key text, p_date date, p_place text, p_max int, p_pace_label text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_key) then raise exception 'unauthorized'; end if;
  insert into public.slots (date, place, max_members, pace_label, status)
  values (p_date, p_place, p_max, p_pace_label, 'open');
end; $$;
revoke all on function public.admin_create_slot(text,date,text,int,text) from public;
grant execute on function public.admin_create_slot(text,date,text,int,text) to anon;

create or replace function public.admin_update_application(
  p_key text, p_id uuid, p_paid boolean, p_invited boolean, p_status text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_key) then raise exception 'unauthorized'; end if;
  update public.applications set
    paid    = coalesce(p_paid, paid),
    invited = coalesce(p_invited, invited),
    status  = coalesce(p_status, status)
  where id = p_id;
end; $$;
revoke all on function public.admin_update_application(text,uuid,boolean,boolean,text) from public;
grant execute on function public.admin_update_application(text,uuid,boolean,boolean,text) to anon;

-- 운영자: 신청을 특정 슬롯에 배정/해제 (매칭). p_slot_id 가 null 이면 일반 신청으로 되돌림.
create or replace function public.admin_assign_slot(
  p_key text, p_id uuid, p_slot_id uuid
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_key) then raise exception 'unauthorized'; end if;
  update public.applications set slot_id = p_slot_id where id = p_id;
end; $$;
revoke all on function public.admin_assign_slot(text,uuid,uuid) from public;
grant execute on function public.admin_assign_slot(text,uuid,uuid) to anon;

-- admin_list_applications 재생성 (새 테이블 기준, 컬럼 동일)
create or replace function public.admin_list_applications(p_key text)
returns table (
  application_id uuid, status text, paid boolean, invited boolean, created_at timestamptz,
  wish_places_weekday text[], wish_places_weekend text[], wish_dates date[],
  slot_id uuid, slot_date date, slot_place text, slot_pace_label text,
  slot_max_members int, slot_status text,
  user_id uuid, user_name text, user_phone text, user_gender text,
  user_age_range text, user_pace text, user_total_count int, prior_participations bigint
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(p_key) then raise exception 'unauthorized'; end if;
  return query
    select a.id, a.status, a.paid, a.invited, a.created_at,
      a.wish_places_weekday, a.wish_places_weekend, a.wish_dates,
      a.slot_id, s.date, s.place, s.pace_label, s.max_members, s.status,
      u.id, u.name, u.phone, u.gender, u.age_range, u.pace, u.total_count,
      (select count(*) from public.applications a2
        where a2.user_id = u.id and a2.status = 'confirmed' and a2.id <> a.id)
    from public.applications a
    join public.users u on u.id = a.user_id
    left join public.slots s on s.id = a.slot_id
    order by a.created_at desc;
end; $$;
revoke all on function public.admin_list_applications(text) from public;
grant execute on function public.admin_list_applications(text) to anon;
