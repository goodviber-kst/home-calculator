# 영끌판독기 - 생애최초 주택구매 계산기

영끌족의 첫 집 꿈을 응원합니다. 첫 집을 구매하는 데 필요한 모든 것을 계산해드리는 한국 정책 맞춤형 주택구매 계산기입니다.

## 🎯 주요 기능

- **구매 가능 가격대**: 보수적/권장/낙관적 시나리오 제시
- **최대 대출액 계산**: LTV(주택담보비율) vs DSR(채무상환비율) 기준 자동 선택
- **월 예상 상환액**: 금리 범위별 상환액 시뮬레이션 (2.65%~6.0%)
- **취득세 자동 계산**: 생애최초 감면(최대 200만원) 포함
- **정부 대출 상품 비교**:
  - 디딤돌 대출 (생애최초 우대)
  - 보금자리론
  - 일반 주담대
- **지역별 구매 가능성**: 서울/경기/광역시/지방별 LTV 적용
- **비용 내역 분석**: 자산 내역과 차감 비용의 투명한 분석

## 🛠️ 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS 3.4
- **Deployment**: Vercel (standalone mode)
- **Node**: 18+ recommended

## 📦 설치 및 실행

### 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속
```

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 📊 계산 로직

### 입력값 (4개 섹션)

#### 섹션 1: 개인 정보
- `isCouple`: 부부 합산 여부
- `applicantIncome`: 신청자 월소득 (만원)
- `spouseIncome`: 배우자 월소득 (만원, 부부 합산 시에만)

#### 섹션 2: 보유 자산 (만원)
- `savings`: 현재 저축액
- `parentGift`: 부모 증여 가능액
- `otherAssets`: 기타 자산

#### 섹션 3: 추가 비용 (만원)
- `emergencyFund`: 여유자금 (기본값: 1,000만원)
- `interiorCost`: 인테리어 비용 (기본값: 1,000만원)
- `movingCost`: 이사비용 (기본값: 100만원)

#### 섹션 4: 지역 및 대출
- `targetRegion`: 서울/경기/광역시/그외지방
- `loanTermYears`: 10/15/20/30년

### 계산 결과

#### 취득세 (2024-2026 기준)
```
6억 미만:     1%
6억~9억:     1% + (가격 - 6억) / 3억 × 2% (누진)
9억 초과:    3%

+ 지방교육세: 취득세 × 10%
+ 농어촌특별세: 0 (MVP에서 제외)

생애최초 감면: min(취득세 합계, 200만원)
  - 단독: 연소득 5,000만원 이하
  - 부부: 연소득 7,000만원 이하
```

#### LTV (생애최초 우대 적용)
```
서울 (투기과열):   기본 50% → 생애최초 60%
경기 (조정대상):   기본 70% → 생애최초 80%
광역시 (조정):    기본 70% → 생애최초 80%
그외지방 (비규제): 기본 80% → 생애최초 80%
```

#### DSR (Debt Service Ratio) - 40% 규칙
```
최대 연간 상환액 = 부부합산 연소득 × 40%
DSR 기준 최대 대출 = 원리금균등상환 역산 공식
최종 대출 = min(LTV 기준 대출, DSR 기준 대출)
```

#### 구매 가능 가격
```
총 자산 = 저축 + 증여 + 기타
차감액 = 여유자금 + 인테리어 + 이사비 + 취득세 + 등기비(0.4%)
가용 예산 = 총 자산 - 차감액
총 구매력 = 가용 예산 + 최대 대출

보수적: 가용 예산만
권장: 가용 예산 + LTV 기준 대출
낙관적: 가용 예산 + DSR 기준 대출
```

## 📝 API 명세

### POST /api/calculate

```bash
curl -X POST http://localhost:3000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "isCouple": true,
    "applicantIncome": 400,
    "spouseIncome": 300,
    "savings": 8000,
    "parentGift": 3000,
    "otherAssets": 0,
    "emergencyFund": 1000,
    "interiorCost": 1500,
    "movingCost": 100,
    "targetRegion": "gyeonggi",
    "loanTermYears": 30
  }'
```

### 응답 예시

```json
{
  "monthlyIncomeCouple": 700,
  "annualIncomeCouple": 8400,
  "isFirstTimeEligible": true,
  "totalAssets": 11000,
  "totalDeductions": 2801.6,
  "availableBudget": 8198.4,
  "loanInfo": {
    "ltv": 0.8,
    "maxLoanByLTV": 32793.6,
    "maxLoanByDSR": 55261.12,
    "maxLoan": 32793.6,
    "monthlyPaymentMin": 132.15,
    "monthlyPaymentMax": 196.61
  },
  "acquisitionTax": {
    "baseTax": 504,
    "educationTax": 50.4,
    "specialTax": 0,
    "subtotal": 554.4,
    "exemption": 554.4,
    "finalTax": 0
  },
  "conservativePrice": 8198.4,
  "recommendedPrice": 40992,
  "optimisticPrice": 63459.52,
  "governmentLoans": [
    {
      "name": "디딤돌 대출 (생애최초)",
      "incomeLimit": "부부 7천만원",
      "priceLimit": "5억 이하",
      "ltv": 0.8,
      "interestRate": "2.65%~3.95%",
      "eligible": true
    },
    {
      "name": "보금자리론",
      "incomeLimit": "제한 없음",
      "priceLimit": "6억 이하",
      "ltv": 0.7,
      "interestRate": "3.8%",
      "eligible": true
    },
    {
      "name": "일반 주담대",
      "incomeLimit": "제한 없음",
      "priceLimit": "제한 없음",
      "ltv": 0.7,
      "interestRate": "4.0%~6.0%",
      "eligible": true
    }
  ],
  "regionalFeasibility": [
    {
      "region": "서울 (투기과열)",
      "ltvBase": 0.5,
      "ltvFirst": 0.6,
      "maxPriceByLTV": 20496,
      "feasible": true,
      "reason": "최대 2억원 구매 가능"
    },
    {
      "region": "경기 (조정대상)",
      "ltvBase": 0.7,
      "ltvFirst": 0.8,
      "maxPriceByLTV": 40992,
      "feasible": true,
      "reason": "최대 4억원 구매 가능"
    }
  ],
  "costBreakdown": {
    "savings": 8000,
    "parentGift": 3000,
    "otherAssets": 0,
    "emergencyFund": 1000,
    "interiorCost": 1500,
    "movingCost": 100,
    "acquisitionTax": 0,
    "registrationFee": 1.6
  }
}
```

## 🚀 Vercel 배포

### GitHub 연동 배포

1. 프로젝트를 GitHub로 푸시
   ```bash
   git init
   git add .
   git commit -m "feat: Add home-calculator MVP"
   git push -u origin main
   ```

2. [Vercel 대시보드](https://vercel.com)에서 새 프로젝트 생성
   - GitHub 저장소 선택
   - `home-calculator` 디렉토리 설정 (Root Directory)
   - 환경 변수 설정 (필요 시)
   - 배포

### 환경 변수

현재 MVP는 환경 변수가 필요 없습니다. 추후 확장 시 고려:
- `NEXT_PUBLIC_GA_ID`: Google Analytics (선택)
- `NEXT_PUBLIC_API_BASE`: API 기본 URL (다른 서버 사용 시)

## 🔄 재사용 패턴

saju-analysis 프로젝트와 동일한 패턴 사용:

```
components/ResultCard.tsx      ← 재사용 가능한 카드 컴포넌트
components/HomeResults.tsx     ← 결과 표시 (SajuResults 패턴)
components/HomeForm.tsx        ← 입력 폼 (SajuForm 패턴)
app/api/calculate/route.ts     ← API 엔드포인트 (analyze 패턴)
lib/calculator.ts              ← 순수 계산 로직
lib/types.ts                   ← TypeScript 타입 정의
```

## 📋 구현 완료사항

### ✅ MVP 완성
- [x] TypeScript 타입 정의
- [x] 핵심 계산 로직 (취득세, LTV, DSR)
- [x] API 엔드포인트
- [x] React 컴포넌트 (Form, Results, Card)
- [x] Tailwind CSS 스타일링
- [x] 한국 메타데이터
- [x] 프로덕션 빌드 설정

### 🔮 향후 개선사항
- [ ] 실시간 금리 데이터 통합
- [ ] 지역별 평균 집값 정보
- [ ] 정부정책 업데이트 자동화
- [ ] 대출 상환 시뮬레이터
- [ ] 모바일 앱 (React Native)
- [ ] 데이터베이스 (계산 이력 저장)

## ⚖️ 주의사항

- **참고용**: 이 계산기는 교육 목적이며, 정확한 금액은 금융기관과 상담 후 확인하세요.
- **정책 변경**: 금리, 대출한도, 세제혜택은 정책 변경에 따라 달라질 수 있습니다.
- **개인 차이**: DSR, DTI, 신용도 등은 금융기관별로 상이할 수 있습니다.
- **세금**: 취득세 계산은 2024-2026년 기준이며, 지역별 특수세제는 별도 확인이 필요합니다.

## 📄 라이선스

MIT License

## 👨‍💻 작성자

AI Native Development with Claude Code

---

**Updated**: February 2026
