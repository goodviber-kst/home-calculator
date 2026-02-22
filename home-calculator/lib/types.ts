// Input form types
export interface HomeCalculatorInput {
  // Section 1: Personal Info
  isCouple: boolean;
  applicantIncome: number; // 만원
  spouseIncome: number; // 만원

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
  maxLoan: number; // 최종 최대 대출 = min(LTV, DSR)
  monthlyPaymentMin: number; // 최소 월 상환액 (금리 낮을 때)
  monthlyPaymentMax: number; // 최대 월 상환액 (금리 높을 때)
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
  monthlyIncomeCouple: number; // 부부합산 월소득
  annualIncomeCouple: number; // 부부합산 연소득
  isFirstTimeEligible: boolean; // 생애최초 감면 대상 여부

  // Assets & Costs
  totalAssets: number; // 총 자산
  totalDeductions: number; // 차감액
  availableBudget: number; // 가용 예산

  // Loan
  loanInfo: LoanInfo;

  // Acquisition Tax
  acquisitionTax: AcquisitionTaxBreakdown;

  // Purchase Power
  conservativePrice: number; // 보수적 (가용 예산만)
  recommendedPrice: number; // 권장 (가용 예산 + 최대 대출)
  optimisticPrice: number; // 낙관적 (가용 예산 + DSR 최대)

  // Government Loans
  governmentLoans: GovernmentLoanProduct[];

  // Regional Feasibility
  regionalFeasibility: RegionalFeasibility[];

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
