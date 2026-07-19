# ONDO 주간 리포트 체계 + UTM + GA4 설정

> ⚠️ **선행 검증**: `App.tsx`의 `?apply=1` 처리 시 `replaceState`가 모든 쿼리(UTM 포함)를 지움. gtag config가 먼저 실행되어 보통은 잡히지만, 배포 후 시크릿창에서 UTM 링크 접속 → GA4 실시간 "세션 소스"에 찍히는지 1회 검증. `(direct)`로 찍히면 apply 파라미터만 제거하도록 수정 필요.

## 1. 주간 리포트 템플릿 (금요일 30분, `weekly/2026-WXX.md`로 복사)

기간: 지난 금 00:00 ~ 이번 목 24:00 (GA4 필터와 SQL 7일 윈도우 통일)

```markdown
# ONDO 주간 리포트 — 2026-W__ (__/__ ~ __/__)

## 0. 북극성
| 지표 | 이번 주 | 지난주 | 4주 평균 | 누적 |
|---|---|---|---|---|
| WAR (confirmed+paid 고유 러너) |  |  |  |  |
| 목표 대비 (누적/100) |  | — | — |  |
<!-- Supabase [SQL-A]. 판정: 4주 평균 +50% 2주 연속 = 무료화 성공 신호 -->

## 1. 퍼널 4단계
| 단계 | 출처 | 이번 주 | 지난주 | 전환율 |
|---|---|---|---|---|
| ① 유입 (세션) | GA4 트래픽 획득 |  |  | — |
| ② 신청 시작 | application_modal_open |  |  | ②/① |
| ③ 신청 완료 | application_complete |  |  | ③/② |
| ④ 입금 완료 | Supabase paid=true |  |  | ④/③ |
<!-- ④는 GA로 세지 않는다(어드민 오염). 보조: apply_step_completed step별 낙차, deposit_copy_account -->

## 2. 채널별 유입 (GA4 트래픽 획득 → 세션 소스/매체 + 키 이벤트 열)
| 소스/매체 | 세션 | 신청 시작 | 신청 완료 | 완료/세션 | 판정 |
|---|---|---|---|---|---|
| instagram / bio·story·feed |  |  |  |  |  |
| daangn / community |  |  |  |  |  |
| kakao_open / community |  |  |  |  |  |
| blind / community |  |  |  |  |  |
| threads / feed |  |  |  |  |  |
| naver_blog / blog |  |  |  |  |  |
| kakao / crm (재참여) |  |  |  |  |  |
| share / referral |  |  |  |  |  |
| (direct) / (none) |  |  |  |  |  |

## 3. 리드 & 재참여
| 지표 | 이번 주 | 누적 |
|---|---|---|
| 신규 리드 |  |  |
| 미전환 리드 풀 | — |  |
| 재참여 신청 (kakao/crm) |  |  |

## 4. 실험 결과 (탐색 → "실험 대시보드", 주간 노출 30 미만이면 판정 유보)
| 실험 | variant | 노출 | 완료 | 완료율 | 판정 |

## 5. 다음 주 액션 (3개 이하 — 중단 채널은 대체 채널 지정)
```

### SQL 3종 (Supabase SQL Editor)

```sql
-- [SQL-A] WAR + 누적
select count(distinct coalesce(a.user_id::text, g.phone)) as war_this_week
from applications a left join guest_applicants g on g.application_id = a.id
where a.status='confirmed' and a.paid and a.created_at >= now() - interval '7 days';

select count(distinct coalesce(a.user_id::text, g.phone)) as runners_total
from applications a left join guest_applicants g on g.application_id = a.id
where a.status='confirmed' and a.paid;

-- [SQL-B] 신청→확정→입금 (최근 7일)
select
  count(*) filter (where status in ('applied','confirmed')) as apps,
  count(*) filter (where status='confirmed') as confirmed,
  count(*) filter (where status='confirmed' and paid) as paid
from applications where created_at >= now() - interval '7 days';

-- [SQL-C] 리드
select count(*) as new_leads from leads where created_at >= now() - interval '7 days';
select count(*) as unconverted_pool from leads l
where not exists (select 1 from guest_applicants g where g.phone = l.phone);
```

## 2. UTM 체계 확정판

규칙: 전부 소문자·영문. source: instagram/daangn/kakao_open/blind/threads/naver_blog/kakao/share. medium: bio/story/feed/community/blog/crm/notice/referral. campaign: `free100` 고정(재참여만 `rejoin`). content: `{종류}{번호}`.
**?apply=1 결합: 물음표는 하나** — `?apply=1&utm_source=...`

| # | 용도 | URL |
|---|---|---|
| 1 | 인스타 바이오 | `https://ondo-match.vercel.app/?utm_source=instagram&utm_medium=bio&utm_campaign=free100` |
| 2 | 인스타 스토리 | `...?utm_source=instagram&utm_medium=story&utm_campaign=free100&utm_content=story0724` |
| 3 | 인스타 피드·릴스 댓글 | `...?utm_source=instagram&utm_medium=feed&utm_campaign=free100&utm_content=reel01` |
| 4 | 당근 글 | `...?utm_source=daangn&utm_medium=community&utm_campaign=free100&utm_content=post01` |
| 5 | 당근 모임 소개 | `...?utm_source=daangn&utm_medium=bio&utm_campaign=free100` |
| 6 | 오픈카톡 공지 | `...?utm_source=kakao_open&utm_medium=community&utm_campaign=free100` |
| 7 | 블라인드 | `...?utm_source=blind&utm_medium=community&utm_campaign=free100&utm_content=post01` |
| 8 | 스레드 | `...?utm_source=threads&utm_medium=feed&utm_campaign=free100&utm_content=post01` |
| 9 | 네이버 블로그 | `...?utm_source=naver_blog&utm_medium=blog&utm_campaign=free100` |
| 10 | 카톡 재참여 | `...?apply=1&utm_source=kakao&utm_medium=crm&utm_campaign=rejoin` |
| 11 | 매칭 확정 공지 (notice.ts APPLY_LINK 교체) | `...?apply=1&utm_source=kakao&utm_medium=notice&utm_campaign=rejoin` |
| 12 | 공유 카드 (shareCard.ts) | `...?utm_source=share&utm_medium=referral&utm_campaign=free100` |

**코드 반영 필요 2건**: notice.ts APPLY_LINK → 11번 / shareCard.ts 공유 페이로드 → 12번. 없으면 재참여·바이럴이 전부 (direct)로 뭉개짐.

## 3. GA4 이번 주 설정 체크리스트

1. **키 이벤트 3개**: 관리 → 데이터 표시 → 이벤트 → `application_complete`·`lead_submit`·`deposit_copy_account` "키 이벤트로 표시" ON
2. **맞춤 측정기준 4개** (오늘 바로 — 소급 안 됨): 이벤트 범위로 `step_name`, `experiment`, `variant`, `source`
3. **퍼널 탐색**: 탐색 → 유입경로 — session_start → application_modal_open → apply_step_completed → application_complete, 세분화 "세션 소스/매체"
4. **폼 이탈 탐색**: 위 복제, 세분화를 step_name으로
5. **트래픽 획득 보고서**: 차원 "세션 소스/매체" + 키 이벤트 열 저장
6. **실험 대시보드**: 자유 형식 — 행 experiment·variant / 값 experiment_view·application_complete
7. **UTM 생존 검증** (5분): 위 ⚠️ 참조

## 4. 채널 판정 기준 (첫 게시 2주 후 금요일)

| 채널 | 주당 투입 | 2주 최소선 (미달=동결) | 확대 신호 |
|---|---|---|---|
| 인스타 | 2~3h | 세션 60 + 완료 2 | 완료 5+ 또는 완료/세션 5%+ |
| 당근 | 1h | 세션 40 + 완료 2 | 완료 4+ (완료/세션 7%+가 정상) |
| 오픈카톡 | 0.5h | 세션 20 + 완료 1 | 완료 3+ |
| 블라인드 | 0.5h | 세션 30 + 완료 1 | 완료 3+ |
| 스레드 | 1h | 세션 30 + 완료 1 | 완료 3+ |
| 블로그 | 2h/글 | 4주 유예 (프리렌더링 후 유효) | 검색 유입 발생 자체 |
| 카톡 재참여 | 0.3h | 클릭 20% + 재신청 1 | 재신청률 30%+ → 정례화 |
| 공유 카드 | 0 | click 10 + 세션 5 | 완료 1+ 시 인센티브 실험 |

판정 규칙: ①중단=동결(게시물은 유지, 시간만 0) ②세션 있는데 완료 0이면 소재 교체 1회 후 재판정 ③세션 20 미만이면 전환율 계산 금지("세션 확보 실패"로 판정).
