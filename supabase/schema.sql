-- ════════════════════════════════════════════════════════════════════
--  ONDO 데이터베이스 스키마 (Supabase / PostgreSQL)
--  실행 위치: Supabase 대시보드 → SQL Editor → New query → 붙여넣고 Run
--  안전하게 여러 번 실행 가능하도록 작성됨 (IF NOT EXISTS / DROP POLICY)
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────── 1) users (참가자) ───────────────────────────
-- 전화번호(phone)가 고유 식별자. 로그인 없음. 같은 번호 = 같은 사람.
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  phone         text unique not null,
  name          text not null,
  gender        text check (gender in ('남','여')),
  age_range     text,
  pace          text check (pace in ('A','B','C','D')),
  total_count   int  not null default 0,
  no_show_count int  not null default 0,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────── 2) slots (운영자가 만드는 모임) ───────────────────────────
create table if not exists public.slots (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  place       text not null check (place in ('반포','여의도','종로')),
  max_members int  not null default 5,
  pace_label  text,
  status      text not null default 'open' check (status in ('open','closed','confirmed')),
  created_at  timestamptz not null default now()
);

-- ─────────────────────────── 3) applications (신청) ───────────────────────────
-- slot_id 는 NULL 가능: 메인에서 "일반 신청"(희망 날짜/장소만)도 받기 때문.
-- wish_places / wish_dates: 슬롯 없이 들어온 "일반 신청"의 희망 장소·날짜(다중).
--   슬롯에서 들어온 신청은 이 두 컬럼이 NULL, 일반 신청은 slot_id 가 NULL.
create table if not exists public.applications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  slot_id     uuid references public.slots(id) on delete cascade,
  wish_places text[],
  wish_dates  date[],
  status      text not null default 'applied' check (status in ('applied','confirmed','cancelled')),
  paid        boolean not null default false,
  invited     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 이미 테이블이 있던 경우를 위해 컬럼 보강 (멱등)
alter table public.applications add column if not exists wish_places text[];
alter table public.applications add column if not exists wish_dates  date[];
-- 평일/주말 활동지역이 다를 수 있어 희망 장소를 평일/주말로 분리해 받는다.
-- (wish_places 는 구버전 호환용으로 남겨두고, 신규 신청은 아래 두 컬럼을 사용)
alter table public.applications add column if not exists wish_places_weekday text[];
alter table public.applications add column if not exists wish_places_weekend text[];

-- 같은 사람이 같은 슬롯에 중복 신청하지 못하도록 (slot_id 가 있을 때만)
create unique index if not exists applications_user_slot_unique
  on public.applications (user_id, slot_id)
  where slot_id is not null;

-- 조회 성능용 인덱스
create index if not exists applications_slot_idx on public.applications (slot_id);
create index if not exists slots_status_date_idx on public.slots (status, date);

-- 실시간(Realtime) 발행 대상에 추가 — 인원수 라이브 집계에 사용.
-- ⚠️ users 는 일부러 제외: Realtime 은 RLS(행)는 적용하지만 "컬럼 권한"은 적용하지
--    않아서, users 를 발행하면 변경 payload 로 name/phone 이 anon 구독자에게 샐 수 있음.
--    500명 카운터는 applications 이벤트에 맞춰 users 개수를 다시 읽는 방식으로 처리(4단계).
-- (publication 에 add 는 멱등이 아니라서, 이미 들어있으면 건너뛰도록 감쌈)
do $$
declare
  t text;
begin
  foreach t in array array['slots','applications'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
--  RLS (Row Level Security) — 익명(anon) insert / select 허용
--  ⚠️ 보안 의미는 아래 별도 설명 참고. 개인정보 노출 주의.
-- ════════════════════════════════════════════════════════════════════

alter table public.users        enable row level security;
alter table public.slots        enable row level security;
alter table public.applications enable row level security;

-- users: 행(row) 단위로는 anon 이 조회 가능 (집계·성별/나이 표시에 필요).
-- 단, name/phone "컬럼"은 아래 [컬럼 단위 PII 보호] 섹션에서 읽기 차단함.
drop policy if exists "anon_select_users" on public.users;
create policy "anon_select_users" on public.users
  for select to anon using (true);

drop policy if exists "anon_insert_users" on public.users;
create policy "anon_insert_users" on public.users
  for insert to anon with check (true);

drop policy if exists "anon_update_users" on public.users;
create policy "anon_update_users" on public.users
  for update to anon using (true) with check (true);

-- slots: 누구나 조회 가능 (생성/수정은 운영자 대시보드에서 anon 으로 처리 → 아래 주석)
drop policy if exists "anon_select_slots" on public.slots;
create policy "anon_select_slots" on public.slots
  for select to anon using (true);

-- ⚠️ 슬롯 생성/수정도 현재는 anon 으로 허용 (운영자 대시보드가 별도 인증 없이 동작).
--    즉 anon key 를 가진 누구나 슬롯을 만들/바꿀 수 있음. MVP 단계에서만 허용하고,
--    운영자 기능은 추후 Service Role 키 또는 Edge Function 으로 옮기는 것을 권장.
drop policy if exists "anon_write_slots" on public.slots;
create policy "anon_write_slots" on public.slots
  for all to anon using (true) with check (true);

-- applications: 누구나 신청(insert)·집계 및 내역 조회(select)·취소/상태변경(update) 가능
drop policy if exists "anon_select_applications" on public.applications;
create policy "anon_select_applications" on public.applications
  for select to anon using (true);

drop policy if exists "anon_insert_applications" on public.applications;
create policy "anon_insert_applications" on public.applications
  for insert to anon with check (true);

drop policy if exists "anon_update_applications" on public.applications;
create policy "anon_update_applications" on public.applications
  for all to anon using (true) with check (true);

-- ════════════════════════════════════════════════════════════════════
--  [컬럼 단위 PII 보호]  name / phone 은 anon 이 직접 읽지 못하게 차단
--  - 집계(개수)·성별·나이대·페이스 는 그대로 읽힘 (개인 식별 불가)
--  - 본인 프로필 불러오기는 아래 get_user_by_phone() 보안 함수로만 가능
-- ════════════════════════════════════════════════════════════════════

-- Supabase 는 기본적으로 anon 에게 테이블 전체 SELECT 권한을 주므로 먼저 회수하고,
-- PII 가 아닌 컬럼만 다시 SELECT 허용한다. (name, phone 은 의도적으로 제외)
revoke select on public.users from anon;
grant select (id, gender, age_range, pace, total_count, no_show_count, created_at)
  on public.users to anon;

-- INSERT / UPDATE 는 컬럼 전체 허용 유지 (신청 시 본인이 name/phone 을 쓰는 건 정상).
-- 단, 신청 후 .select() 로 name/phone 을 돌려받으려 하면 막히므로
-- 프론트엔드에서는 upsert 후 .select('id') 처럼 허용 컬럼만 돌려받아야 함.
grant insert, update on public.users to anon;

-- ── 본인 프로필 조회용 보안 함수 ──
-- SECURITY DEFINER: 함수 소유자 권한으로 실행되어 name/phone 까지 돌려줄 수 있음.
-- 정확한 전화번호 1건만 매칭 → 목록 덤프/열거(enumeration) 불가.
-- returns setof: 매칭 없으면 [] , 있으면 [{...}] 로 깔끔하게 반환.
drop function if exists public.get_user_by_phone(text);
create function public.get_user_by_phone(p_phone text)
returns setof public.users
language sql
security definer
set search_path = public
as $$
  select * from public.users where phone = p_phone limit 1;
$$;

-- 함수 실행 권한은 anon 에게만 (public 일반 권한은 회수)
revoke all on function public.get_user_by_phone(text) from public;
grant execute on function public.get_user_by_phone(text) to anon;

-- ── 전화번호 기준 upsert 보안 함수 ──
-- INSERT ... ON CONFLICT(upsert) 는 테이블 전체 SELECT 권한을 요구하는데,
-- 우리는 PII 보호로 컬럼 단위 SELECT 만 허용 → anon 의 직접 upsert 가 막힌다.
-- 그래서 upsert 를 SECURITY DEFINER 함수로 감싸 소유자 권한으로 실행한다.
-- total_count / no_show_count 는 건드리지 않아 기존 값이 유지된다.
create or replace function public.upsert_user_by_phone(
  p_phone     text,
  p_name      text,
  p_gender    text,
  p_age_range text,
  p_pace      text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.users (phone, name, gender, age_range, pace)
  values (p_phone, p_name, p_gender, p_age_range, p_pace)
  on conflict (phone) do update
    set name      = excluded.name,
        gender    = excluded.gender,
        age_range = excluded.age_range,
        pace      = excluded.pace
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.upsert_user_by_phone(text,text,text,text,text) from public;
grant execute on function public.upsert_user_by_phone(text,text,text,text,text) to anon;

-- ════════════════════════════════════════════════════════════════════
--  [운영자(/admin) 보안]  이름/연락처 등 PII 를 키 검증 후에만 반환
--  - 운영자 비밀키는 admin_config 테이블에 저장(anon 접근 불가, 번들·코드에 없음)
--  - 모든 admin 함수는 키를 인자로 받아 검증 → 틀리면 예외
-- ════════════════════════════════════════════════════════════════════

-- 운영자 비밀키 보관용 (정책 없음 = anon 은 일절 접근 불가, 함수만 SECURITY DEFINER 로 읽음)
create table if not exists public.admin_config (
  id         int primary key default 1,
  secret_key text not null,
  constraint admin_config_singleton check (id = 1)
);
alter table public.admin_config enable row level security;
-- (의도적으로 anon 정책을 만들지 않음 → 직접 조회/수정 불가)

-- 키 검증 헬퍼
create or replace function public.is_admin(p_key text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_config where id = 1 and secret_key = p_key
  );
$$;
revoke all on function public.is_admin(text) from public;
grant execute on function public.is_admin(text) to anon;

-- 전체 신청 목록 (이름/연락처 포함) — 키가 맞을 때만 반환.
-- 신규/재참여 판별용으로 user_total_count, prior_participations 도 함께 반환.
create or replace function public.admin_list_applications(p_key text)
returns table (
  application_id       uuid,
  status               text,
  paid                 boolean,
  invited              boolean,
  created_at           timestamptz,
  wish_places_weekday  text[],
  wish_places_weekend  text[],
  wish_dates           date[],
  slot_id              uuid,
  slot_date            date,
  slot_place           text,
  slot_pace_label      text,
  slot_max_members     int,
  slot_status          text,
  user_id              uuid,
  user_name            text,
  user_phone           text,
  user_gender          text,
  user_age_range       text,
  user_pace            text,
  user_total_count     int,
  prior_participations bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(p_key) then
    raise exception 'unauthorized';
  end if;
  return query
    select
      a.id, a.status, a.paid, a.invited, a.created_at,
      a.wish_places_weekday, a.wish_places_weekend, a.wish_dates,
      a.slot_id, s.date, s.place, s.pace_label, s.max_members, s.status,
      u.id, u.name, u.phone, u.gender, u.age_range, u.pace, u.total_count,
      (select count(*) from public.applications a2
         where a2.user_id = u.id and a2.status = 'confirmed' and a2.id <> a.id) as prior_participations
    from public.applications a
    join public.users u on u.id = a.user_id
    left join public.slots s on s.id = a.slot_id
    order by a.created_at desc;
end;
$$;
revoke all on function public.admin_list_applications(text) from public;
grant execute on function public.admin_list_applications(text) to anon;
