// Input form types
export interface HomeCalculatorInput {
  // Section 1: Personal Info
  isCouple: boolean;
  applicantIncome: number; // 세후 월소득 (만원)
  applicantPreTaxAnnual: number; // 세전 연봉 (만원) — DSR/생애최초용
  spouseIncome: number; // 배우자 세후 월소득 (만원)
  spousePreTaxAnnual: number; // 배우자 세전 연봉 (만원) — DSR/생애최초용

  // Section 2: Assets
  savings: number; // 만원
  parentGift: number; // 만원
  otherAssets: number; // 만원

  // Section 3: Additional Costs
  emergencyFund: number; // 만원
  interiorCost: number; // 만원
  movingCost: number; // 만원

  // Section 4: Region & Loan
  targetRegion: 'seoul' | 'gyeonggi' | 'metropolitan' | 'other';
  loanTermYears: 10 | 15 | 20 | 30;

  // Section 5: Credit Loan (영끌)
  useLifestyleLoan: boolean; // 신용대출(생활자금) 사용 여부
  creditScore: number; // 신용점수 (300-999, 영끌 한도 결정)
  useSpouseCreditLoan: boolean; // 배우자 신용대출 포함 (공동명의 시)
  spouseCreditScore: number; // 배우자 신용점수

  // Section 6: Extra
  interestRate: number; // 예상 주담대 금리 (%, e.g. 4.0)
  targetPropertyPrice: number; // 목표 주택가격 (만원, 0 = 미입력)
}

// Calculation result types
export interface AcquisitionTaxBreakdown {
  baseTax: number; // 기본 취득세
  educationTax: number; // 지방교육세
  specialTax: number; // 농어촌특별세
  subtotal: number; // 취득세 합계 (감면 전)
  exemption: number; // 생애최초 감면액
  finalTax: number; // 최종 취득세
}

export interface LoanInfo {
  ltv: number; // LTV 비율
  maxLoanByLTV: number; // LTV 기준 최대 대출
  maxLoanByDSR: number; // DSR 기준 최대 대출
  maxLoan: number; // 최종 최대 대출 = min(LTV, DSR, mortgageCap)
  maxLoanAtCap: number; // 정책금융 한도 기준 최대 대출 = min(LTV, mortgageCap), DSR 무시
  monthlyPaymentMin: number; // 최소 월 상환액 (금리 낮을 때)
  monthlyPaymentMax: number; // 최대 월 상환액 (금리 높을 때)
  loanTermYears: number; // 대출 기간 (년)
}

export interface CreditLoanInfo {
  maxLoan: number; // 신용대출 최대 한도 (연봉 기준 또는 100만원 상한)
  monthlyPayment: number; // 월 상환액 (금리 5%)
  eligible: boolean; // 신용대출 사용 가능 여부 (다주택자 제외)
  reason?: string; // 부적격 사유
}

export interface RegulationInfo {
  regionName: string;
  isRegulated: boolean; // 조정대상/투기과열/토지거래 규제 지역 여부
  mortgageCap: number; // 주택담보대출 상한 (조정지역 6억, 기타 무제한)
  ltvLimit: number; // 조정지역 LTV 제한
  stressTestRate: number; // 스트레스 테스트 금리 (규제지역 3.0%)
  details: string; // 지역 규제 설명
}

export interface PurchasePowerSummary {
  cashOnly: number; // 현금만으로 구매 가능
  withMortgage: number; // 주담대 포함
  withCreditLoan: number; // 신용대출까지 포함 (영끌)
  recommendedPrice: number; // 권장 구매가 (현금 + 적정 주담대)
}


export interface GovernmentLoanProduct {
  name: string;
  incomeLimit: string; // "단독 6천/부부 7천"
  priceLimit: string; // "5억 이하"
  ltv: number;
  interestRate: string; // "2.65%~3.95%"
  eligible: boolean;
  reason?: string; // 부적격 사유
}

export interface RegionalFeasibility {
  region: string;
  ltvBase: number; // 기본 LTV
  ltvFirst: number; // 생애최초 LTV
  maxPriceByLTV: number;
  feasible: boolean;
  reason: string;
}

// AI 해석용 Summary (로직 검증/수정 용도)
export interface CalculationSummary {
  // 소득 기반 한도
  dsr: {
    annualIncome: number; // 세전 연봉 (만원)
    dsrRatio: number; // 40%
    maxAnnualPayment: number; // 연 최대 상환액
    maxMonthlyPayment: number; // 월 최대 상환액
    resultMaxLoan: number; // 계산된 최대 대출 (만원)
  };

  // 자산 기반 한도
  ltv: {
    availableBudget: number; // 가용 예산 (만원)
    ltvRatio: number; // 지역별 LTV
    resultMaxLoan: number; // 계산된 최대 대출 (만원)
  };

  // 규제
  regulation: {
    regionName: string;
    mortgageCap: number; // 상한 (만원)
    isRegulated: boolean;
  };

  // 최종 결정
  decision: {
    maxLoanByDSR: number; // (만원)
    maxLoanByLTV: number; // (만원)
    mortgageCap: number; // (만원)
    maxLoan: number; // 최종 결정 (만원)
    reason: string; // "DSR 제약", "LTV 제약", "규제상한 제약" 등
  };

  // 목표가 분석
  targetAnalysis?: {
    targetPrice: number;
    totalAvailable: number; // 현금 + 주담대 + 신용대출
    shortfall: number;
    analysis: string;
  };
}

export interface CalculationResult {
  // Input summary
  monthlyIncomeCouple: number; // 부부합산 월소득 (세후)
  annualIncomeCouple: number; // 부부합산 연소득 (세후)
  totalPreTaxAnnual: number; // 부부합산 세전 연봉
  monthlyIncomeAfterTax: number; // 합산 세후 월소득 (30% 경고용)
  isFirstTimeEligible: boolean; // 생애최초 감면 대상 여부

  // Assets & Costs
  totalAssets: number; // 총 자산
  totalDeductions: number; // 차감액
  availableBudget: number; // 가용 예산

  // Loan
  loanInfo: LoanInfo;
  creditLoanInfo: CreditLoanInfo; // 신용대출(생활자금) 정보

  // Acquisition Tax
  acquisitionTax: AcquisitionTaxBreakdown;

  // Purchase Power
  conservativePrice: number; // 보수적 (가용 예산 + 적정 대출)
  recommendedPrice: number; // 권장 (가용 예산 + 최대 대출)
  optimisticPrice: number; // 낙관적 (가용 예산 + DSR 최대)
  yeongkkulPrice: number; // 영끌 (현금 + 주담대 + 신용대출)

  // Payment Burden
  isPaymentHeavy: boolean; // 월상환액 > 세후 월소득 30%
  paymentRatioPercent: number; // 상환 비율 (%)

  // Final Purchase Power Summary
  purchasePower: PurchasePowerSummary;

  // Government Loans
  governmentLoans: GovernmentLoanProduct[];

  // Regional Feasibility
  regionalFeasibility: RegionalFeasibility[];

  // Regulation Info
  regulationInfo: RegulationInfo;

  // Extra
  interestRate: number; // 계산에 사용된 금리 (%)
  targetPropertyPrice: number; // 목표 가격 (0 = 미입력)
  spouseCreditLoanInfo: CreditLoanInfo | null; // 배우자 신용대출 정보
  targetPropertyFeasibility: {
    targetPrice: number;
    achievable: boolean;
    shortfall: number; // 양수=부족, 음수=여유
    maxAffordable: number; // 현재 최대 구매가
  } | null;

  // Cost Breakdown
  costBreakdown: {
    savings: number;
    parentGift: number;
    otherAssets: number;
    emergencyFund: number;
    interiorCost: number;
    movingCost: number;
    acquisitionTax: number;
    registrationFee: number;
  };

  // AI 해석용 Summary
  summary: CalculationSummary;
}
