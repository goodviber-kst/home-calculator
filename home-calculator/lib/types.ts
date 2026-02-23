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
  creditScore: number; // 신용점수 (300-950, 영끌 한도 결정)
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
}
