# Supabase 설정 가이드 (Calculation Results Logging)

## 개요

이 가이드는 홈 계산기 계산 결과를 Supabase PostgreSQL 데이터베이스에 자동으로 저장하는 설정 방법을 설명합니다.

**목적**: 사용자 행동 분석 (지역별 구매력, 대출 패턴, 관심 지역 등)

**아키텍처**: Fire-and-forget 방식 (저장 실패가 사용자 응답을 지연시키지 않음)

---

## 단계 1: Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 방문
2. **"New Project"** 클릭
3. 프로젝트 이름: `home-calculator` (또는 원하는 이름)
4. Database password 설정 및 저장 (나중에 필요)
5. Region: 서울 또는 도쿄 (지연 최소화)
6. **"Create new project"** 클릭 (약 2-3분 소요)

---

## 단계 2: `calculations` 테이블 생성

### 방법 A: SQL Editor (권장)

1. Supabase Dashboard 로그인
2. 왼쪽 메뉴: **"SQL Editor"**
3. **"New Query"** 클릭
4. 다음 SQL 실행:

```sql
create table calculations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),

  -- 입력 (범주화 + 개인정보 최소화)
  region text,                    -- 'seoul' | 'gyeonggi' | 'metropolitan' | 'other'
  is_couple boolean,
  loan_term_years int,
  interest_rate numeric(4,2),
  use_lifestyle_loan boolean,

  -- 자산 범위 (1억 단위 구간)
  savings_band int,               -- floor(savings / 10000) * 10000
  total_assets_band int,

  -- 결과 요약
  recommended_price_band int,     -- floor(recommendedPrice / 10000) * 10000
  max_loan int,
  monthly_payment_min int,
  is_payment_heavy boolean,
  is_first_time_eligible boolean,

  -- 메타
  has_target_price boolean,
  target_achievable boolean        -- null if no target
);

-- 검색 성능 최적화
create index idx_calculations_region on calculations(region);
create index idx_calculations_created_at on calculations(created_at);
```

5. **"Run"** 클릭

### 방법 B: 테이블 UI (대안)

1. 왼쪽 메뉴: **"Table Editor"**
2. **"Create a new table"**
3. 이름: `calculations`
4. 위 스키마 대로 컬럼 추가

---

## 단계 3: API 키 획득

1. Supabase Dashboard
2. 왼쪽 메뉴: **"Settings"** → **"API"**
3. **"Project URL"** 복사 → `https://xxxx.supabase.co` 형태
4. **"service_role"** 탭 클릭
5. **Key** 값 복사 (⚠️ 민감 정보 - 절대 공개하지 말 것)

---

## 단계 4: 환경 변수 설정

### 로컬 개발 (.env.local)

파일: `/Users/user/study/home-calculator/.env.local`

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Vercel 배포 (프로덕션)

1. [Vercel Dashboard](https://vercel.com) 로그인
2. **home-calculator** 프로젝트 선택
3. **Settings** → **Environment Variables**
4. 두 변수 추가:
   - `SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (service_role 키)
5. **Redeploy** 클릭 (자동으로 트리거 가능)

---

## 단계 5: 로컬 테스트

```bash
cd /Users/user/study/home-calculator

# 개발 서버 시작
npm run dev

# 브라우저: http://localhost:3000
# 계산 수행 → 결과 확인

# Supabase 확인
# Dashboard → Table Editor → calculations
# → 새로운 행이 나타나는지 확인
```

---

## 단계 6: 프로덕션 배포

```bash
# 로컬에서 빌드 확인
npm run build

# 성공 시 git commit & push
git add .
git commit -m "feat: Add Supabase analytics for calculation tracking"
git push origin main

# Vercel에서 자동 배포 (또는 수동 redeploy)
```

### Vercel 배포 후 확인

1. [Vercel Dashboard](https://vercel.com) → home-calculator
2. 프로덕션 URL에서 계산 수행
3. Supabase Dashboard에서 행 추가 확인

---

## 분석 쿼리 예시

### Supabase SQL Editor에서 실행

```sql
-- 1. 지역별 평균 권장 구매가
SELECT
  region,
  AVG(recommended_price_band)/10000 AS avg_eok,
  COUNT(*) as cnt
FROM calculations
GROUP BY region
ORDER BY avg_eok DESC;

-- 2. 공동명의 vs 단독명의 비율
SELECT is_couple, COUNT(*) as cnt FROM calculations GROUP BY is_couple;

-- 3. 대출 부담 과중 비율
SELECT
  is_payment_heavy,
  COUNT(*) as cnt,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM calculations), 2) as pct
FROM calculations
GROUP BY is_payment_heavy;

-- 4. 최근 7일 사용 현황
SELECT
  DATE(created_at) as date,
  COUNT(*) as calculations,
  COUNT(DISTINCT region) as regions_used
FROM calculations
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 5. 목표 가격 달성률
SELECT
  COUNT(CASE WHEN has_target_price THEN 1 END) as has_target,
  COUNT(CASE WHEN target_achievable THEN 1 END) as achievable,
  COUNT(CASE WHEN target_achievable = false THEN 1 END) as not_achievable
FROM calculations;
```

---

## 보안 주의사항

✅ **안전한 처리**:
- 정확한 금액 저장 ❌ → 범주화 저장 ✅ (1억 단위 구간)
- 개인 신원 정보 저장 ❌ → 지역/상황만 저장 ✅
- 클라이언트에서 API 키 노출 ❌ → 서버 환경변수만 사용 ✅

⚠️ **절대 하지 말 것**:
- `.env.local` 또는 `SUPABASE_SERVICE_ROLE_KEY`를 Git에 커밋하지 말 것 (.gitignore 확인)
- 클라이언트 코드에 키 하드코딩하지 말 것
- 프로덕션 키를 공개 저장소에 노출시키지 말 것

---

## 문제 해결

### 1. "SUPABASE_URL is not set" 오류

**원인**: 환경 변수가 설정되지 않음

**해결**:
```bash
# .env.local 확인
cat /Users/user/study/home-calculator/.env.local

# 값이 비어있으면 추가
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key-here
```

### 2. "Permission denied" 오류

**원인**: service_role 키가 잘못됨 또는 권한 문제

**해결**:
- Supabase Dashboard → Settings → API → 키 재확인
- 키를 다시 복사하여 `.env.local` 업데이트
- Vercel의 Environment Variables도 동시에 업데이트

### 3. 로컬에서는 저장되나 프로덕션에서는 안 됨

**원인**: Vercel 환경 변수 설정 미흡

**해결**:
1. Vercel Dashboard에서 environment variables 재확인
2. 변수명이 정확한지 확인 (대소문자 구분)
3. **Redeploy** 클릭

### 4. 저장 속도 지연

**특징**: 저장 로직이 fire-and-forget이므로 문제 아님
- 계산 결과는 즉시 반환됨 (저장 완료 대기 없음)
- 백그라운드에서 비동기 저장
- 저장 실패는 무시됨 (사용자에게 영향 없음)

---

## 다음 단계

계산 결과 저장 후:

1. **대시보드**: Supabase Studio에서 쿼리로 기본 분석
2. **BI**: Metabase, Tableau 등으로 고급 분석
3. **자동화**: Supabase Webhooks로 알림 설정 (예: 특정 패턴 감지)

---

## 참고

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript SDK](https://supabase.com/docs/reference/javascript)
- [Next.js 환경 변수 관리](https://nextjs.org/docs/basic-features/environment-variables)
