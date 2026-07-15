-- ════════════════════════════════════════════════════════════════════
--  ONDO 08 — 신청자 구성 집계 (멤버 구성 시각화용)
--  실행: Supabase SQL Editor 에 전체 붙여넣고 Run (멱등)
-- ════════════════════════════════════════════════════════════════════

-- 신청자 구성 집계 (PII 없음): 페이스/연령대/성별 분포
create or replace function public.get_applicant_demographics()
returns table (dimension text, label text, cnt int)
language sql security definer set search_path = public as $$
  -- 페이스
  select 'pace'::text,
    case u.pace when 'C' then '6분 페이스' when 'B' then '7분 페이스' else '기타' end,
    count(*)::int
  from public.applications a join public.users u on u.id = a.user_id
  where a.status in ('applied','confirmed') group by 2
  union all
  -- 연령대 (age_range 는 숫자 문자열)
  select 'age',
    case
      when u.age_range ~ '^[0-9]+$' and u.age_range::int < 25 then '20대 초반'
      when u.age_range ~ '^[0-9]+$' and u.age_range::int < 30 then '20대 후반'
      when u.age_range ~ '^[0-9]+$' and u.age_range::int < 35 then '30대 초반'
      when u.age_range ~ '^[0-9]+$' and u.age_range::int < 40 then '30대 후반'
      when u.age_range ~ '^[0-9]+$' then '40대+'
      else '비공개'
    end, count(*)::int
  from public.applications a join public.users u on u.id = a.user_id
  where a.status in ('applied','confirmed') group by 2
  union all
  -- 성별
  select 'gender', coalesce(u.gender, '비공개'), count(*)::int
  from public.applications a join public.users u on u.id = a.user_id
  where a.status in ('applied','confirmed') group by 2;
$$;
grant execute on function public.get_applicant_demographics() to anon, authenticated;
