import {
  HomeCalculatorInput,
  CalculationResult,
  AcquisitionTaxBreakdown,
  LoanInfo,
  CreditLoanInfo,
  RegulationInfo,
  PurchasePowerSummary,
  GovernmentLoanProduct,
  RegionalFeasibility,
} from './types';

// Calculate acquisition tax (취득세) — 모든 값 만원 단위
export function calculateAcquisitionTax(
  purchasePrice: number, // 만원 단위
  isFirstTime: boolean
): AcquisitionTaxBreakdown {
  // Basic tax calculation: 2024-2026 rules (누진 계산)
  let baseTax = 0;
  if (purchasePrice < 60000) {
    // 6억 미만: 1%
    baseTax = purchasePrice * 0.01;
  } else if (purchasePrice < 90000) {
    // 6억~9억: 6억까지 1%, 초과분 2%
    baseTax = 60000 * 0.01 + (purchasePrice - 60000) * 0.02;
  } else {
    // 9억 이상: 6억까지 1%, 6억~9억은 2%, 9억 초과분 3%
    baseTax = 60000 * 0.01 + 30000 * 0.02 + (purchasePrice - 90000) * 0.03;
  }

  // Education tax: 10% of base tax
  const educationTax = baseTax * 0.1;

  // Rural tax: 0.2% (MVP excludes this)
  const specialTax = 0;

  const subtotal = baseTax + educationTax + specialTax;

  // First-time buyer exemption (만원 단위)
  let exemption = 0;
  if (isFirstTime) {
    exemption = Math.min(subtotal, 200); // max 200만원
  }

  const finalTax = subtotal - exemption;

  return {
    baseTax,
    educationTax,
    specialTax,
    subtotal,
    exemption,
    finalTax,
  };
}

// Get regulation info by region (2025년 규제 기준)
function getRegulationInfo(
  region: 'seoul' | 'gyeonggi' | 'metropolitan' | 'other',
  isFirstTime: boolean
): RegulationInfo {
  const regulations = {
    seoul: {
      regionName: '서울 (투기과열지구)',
      isRegulated: true,
      mortgageCap: 6000, // 6억원 상한
      ltvLimit: isFirstTime ? 0.8 : 0.5, // 2024년 생애최초 80% 완화
      stressTestRate: 0.03, // 3.0% 스트레스 테스트
      details: '투기과열지구. 생애최초는 LTV 80% (최대 6억), 일반은 50%.',
    },
    gyeonggi: {
      regionName: '경기 (조정대상지역)',
      isRegulated: true,
      mortgageCap: 6000, // 6억원 상한
      ltvLimit: isFirstTime ? 0.8 : 0.7,
      stressTestRate: 0.03,
      details: '조정대상지역. 주담대 6억 상한, 첫-구매자 LTV 80%',
    },
    metropolitan: {
      regionName: '광역시 (조정)',
      isRegulated: true,
      mortgageCap: 6000,
      ltvLimit: isFirstTime ? 0.8 : 0.7,
      stressTestRate: 0.03,
      details: '조정대상지역. 서울과 동일한 규제 적용',
    },
    other: {
      regionName: '기타 지역 (비규제)',
      isRegulated: false,
      mortgageCap: 999999, // 제한 없음
      ltvLimit: isFirstTime ? 0.85 : 0.8,
      stressTestRate: 0.015, // 1.5% 스트레스 테스트
      details: '규제 없음. 일반적인 금융기준 적용',
    },
  };
  return regulations[region];
}

// Get LTV by region
function getLTVByRegion(
  region: 'seoul' | 'gyeonggi' | 'metropolitan' | 'other',
  isFirstTime: boolean
): number {
  const regulation = getRegulationInfo(region, isFirstTime);
  return regulation.ltvLimit;
}

// Calculate credit loan (신용대출/생활자금)
function calculateCreditLoan(
  annualIncome: number, // 만원 단위 세전 연봉
  isCouple: boolean,
  useLifestyleLoan: boolean,
  creditScore: number,
  isMultiPropertyOwner: boolean
): CreditLoanInfo {
  if (!useLifestyleLoan) {
    return {
      maxLoan: 0,
      monthlyPayment: 0,
      eligible: false,
      reason: '신용대출 미선택',
    };
  }

  // 다주택자는 신용대출 불가
  if (isMultiPropertyOwner) {
    return {
      maxLoan: 0,
      monthlyPayment: 0,
      eligible: false,
      reason: '다주택자는 신용대출 불가',
    };
  }

  // 신용점수에 따른 한도 결정 (간단한 모델)
  let loanLimit = 5000; // 기본 5000만원
  if (creditScore >= 800) {
    loanLimit = 10000; // 신용점수 높으면 1억원
  } else if (creditScore >= 750) {
    loanLimit = 8000; // 8000만원
  } else if (creditScore >= 700) {
    loanLimit = 6000; // 6000만원
  }

  // 연봉의 50% 이상은 대출 불가 (과도한 영끌 방지)
  const maxByIncome = Math.min(annualIncome * 0.5, loanLimit);

  // 월 상환액 (5% 고정금리, 10년 기준)
  const monthlyPayment = calculateMonthlyPayment(maxByIncome, 0.05, 10);

  return {
    maxLoan: maxByIncome,
    monthlyPayment,
    eligible: true,
  };
}

// Calculate monthly payment based on principal and interest
function calculateMonthlyPayment(
  loanAmount: number,
  annualRate: number,
  loanYears: number
): number {
  const monthlyRate = annualRate / 12;
  const numberOfPayments = loanYears * 12;

  if (monthlyRate === 0) {
    return loanAmount / numberOfPayments;
  }

  return (
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  );
}

// Calculate max loan based on DSR
function calculateMaxLoanByDSR(
  annualIncome: number,
  loanTermYears: number
): number {
  const dsrRatio = 0.4; // 40% DSR
  const maxAnnualPayment = annualIncome * dsrRatio;
  const maxMonthlyPayment = maxAnnualPayment / 12;

  // Use average interest rate for calculation
  const avgRate = 0.045; // 4.5% average
  const monthlyRate = avgRate / 12;
  const numberOfPayments = loanTermYears * 12;

  // Reverse-calculate loan amount from monthly payment
  if (monthlyRate === 0) {
    return maxMonthlyPayment * numberOfPayments;
  }

  return (
    (maxMonthlyPayment * (Math.pow(1 + monthlyRate, numberOfPayments) - 1)) /
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))
  );
}

// Check first-time buyer eligibility (만원 단위)
function isFirstTimeBuyerEligible(
  annualIncome: number, // 만원 단위 세전 연봉
  isCouple: boolean
): boolean {
  if (isCouple) {
    return annualIncome <= 7000; // 7천만원
  } else {
    return annualIncome <= 5000; // 5천만원
  }
}

// Get government loan products (만원 단위)
function getGovernmentLoans(
  purchasePrice: number, // 만원 단위
  annualIncome: number, // 만원 단위 세전 연봉
  isCouple: boolean,
  isFirstTime: boolean
): GovernmentLoanProduct[] {
  const loans: GovernmentLoanProduct[] = [];

  // 디딤돌 대출
  const didimdol: GovernmentLoanProduct = {
    name: '디딤돌 대출 (생애최초)',
    incomeLimit: isCouple ? '부부 7천만원' : '단독 6천만원',
    priceLimit: '5억 이하',
    ltv: 0.8,
    interestRate: '2.65%~3.95%',
    eligible:
      isFirstTime &&
      ((isCouple && annualIncome <= 7000) ||
        (!isCouple && annualIncome <= 6000)) &&
      purchasePrice <= 50000, // 5억 (만원 단위)
  };
  loans.push(didimdol);

  // 보금자리론
  const bogeumjari: GovernmentLoanProduct = {
    name: '보금자리론',
    incomeLimit: '제한 없음',
    priceLimit: '6억 이하',
    ltv: 0.7,
    interestRate: '3.8%',
    eligible: purchasePrice <= 60000, // 6억 (만원 단위)
  };
  loans.push(bogeumjari);

  // 일반 주담대
  const general: GovernmentLoanProduct = {
    name: '일반 주담대',
    incomeLimit: '제한 없음',
    priceLimit: '제한 없음',
    ltv: 0.7,
    interestRate: '4.0%~6.0%',
    eligible: true,
  };
  loans.push(general);

  return loans;
}

// Get regional feasibility (만원 단위)
function getRegionalFeasibility(
  maxBudget: number, // 만원 단위
  isFirstTime: boolean
): RegionalFeasibility[] {
  const regions: RegionalFeasibility[] = [
    {
      region: '서울 (투기과열)',
      ltvBase: 0.5,
      ltvFirst: isFirstTime ? 0.8 : 0.5,
      maxPriceByLTV: 0,
      feasible: false,
      reason: '',
    },
    {
      region: '경기 (조정대상)',
      ltvBase: 0.7,
      ltvFirst: isFirstTime ? 0.8 : 0.7,
      maxPriceByLTV: 0,
      feasible: false,
      reason: '',
    },
    {
      region: '광역시 (조정)',
      ltvBase: 0.7,
      ltvFirst: isFirstTime ? 0.8 : 0.7,
      maxPriceByLTV: 0,
      feasible: false,
      reason: '',
    },
    {
      region: '그외지방 (비규제)',
      ltvBase: 0.8,
      ltvFirst: 0.8,
      maxPriceByLTV: 0,
      feasible: false,
      reason: '',
    },
  ];

  return regions.map((r) => {
    const ltv = r.ltvFirst;
    r.maxPriceByLTV = maxBudget / (1 - ltv);
    r.feasible = r.maxPriceByLTV > 0;
    r.reason = r.feasible
      ? `최대 ${(r.maxPriceByLTV / 10000).toFixed(1)}억원 구매 가능`
      : '조건 미충족';
    return r;
  });
}

// Main calculation function
export function calculate(input: HomeCalculatorInput): CalculationResult {
  // 1. Calculate monthly and annual income (세후)
  const monthlyIncomeCouple = input.isCouple
    ? input.applicantIncome + input.spouseIncome
    : input.applicantIncome;
  const annualIncomeCouple = monthlyIncomeCouple * 12;

  // 2. Calculate pre-tax annual income (세전 연봉) for DSR and first-time eligibility
  const totalPreTaxAnnual = input.isCouple
    ? input.applicantPreTaxAnnual + input.spousePreTaxAnnual
    : input.applicantPreTaxAnnual;

  // 3. Check first-time buyer eligibility using pre-tax annual income
  const isFirstTime = isFirstTimeBuyerEligible(
    totalPreTaxAnnual,
    input.isCouple
  );

  // 4. Calculate total assets
  const totalAssets = input.savings + input.parentGift + input.otherAssets;

  // 5. Calculate LTV by region
  const ltv = getLTVByRegion(input.targetRegion, isFirstTime);

  // 6. Calculate registration fee (0.4%)
  const registrationFeeRate = 0.004;

  // Iterate to find stable purchase price (acquisition tax depends on price)
  // 만원 단위로 통일
  let purchasePrice = 40000; // Start with 4억 (만원 단위)
  let acquisitionTax: AcquisitionTaxBreakdown;
  let previousPrice = 0;
  let iterations = 0;

  while (Math.abs(purchasePrice - previousPrice) > 100 && iterations < 10) {
    // 100만원 수렴 임계값
    previousPrice = purchasePrice;
    acquisitionTax = calculateAcquisitionTax(purchasePrice, isFirstTime);
    const registrationFee = purchasePrice * registrationFeeRate;

    const totalDeductions =
      input.emergencyFund +
      input.interiorCost +
      input.movingCost +
      acquisitionTax.finalTax +
      registrationFee;

    const availableBudget = Math.max(0, totalAssets - totalDeductions);

    // Calculate max loan using pre-tax annual income for DSR
    const maxLoanByDSR = calculateMaxLoanByDSR(
      totalPreTaxAnnual,
      input.loanTermYears
    );
    const maxLoanByLTV = availableBudget / (1 - ltv);

    purchasePrice = availableBudget + Math.min(maxLoanByLTV, maxLoanByDSR);
    iterations++;
  }

  acquisitionTax = calculateAcquisitionTax(purchasePrice, isFirstTime);
  const registrationFee = purchasePrice * registrationFeeRate;

  // 7. Final cost calculation
  const totalDeductions =
    input.emergencyFund +
    input.interiorCost +
    input.movingCost +
    acquisitionTax.finalTax +
    registrationFee;

  const availableBudget = Math.max(0, totalAssets - totalDeductions);

  // 8. Calculate max loans using pre-tax annual income for DSR
  const regulationInfo = getRegulationInfo(input.targetRegion, isFirstTime);

  const maxLoanByDSR = calculateMaxLoanByDSR(
    totalPreTaxAnnual,
    input.loanTermYears
  );
  const maxLoanByLTV = (availableBudget * ltv) / (1 - ltv);

  // 규제 상한 적용 (조정대상지역/투기과열지구: 6억)
  const maxLoanWithRegulation = Math.min(
    maxLoanByLTV,
    regulationInfo.mortgageCap
  );

  const maxLoan = Math.min(maxLoanWithRegulation, maxLoanByDSR);

  // 9. Calculate payment amounts with narrowed interest rate range (3.3% - 4.5%)
  const monthlyPaymentMin = calculateMonthlyPayment(
    maxLoan,
    0.033, // 3.3% (현실적 최저)
    input.loanTermYears
  );
  const monthlyPaymentMax = calculateMonthlyPayment(
    maxLoan,
    0.045, // 4.5% (현실적 최고)
    input.loanTermYears
  );

  // 10. Calculate purchase prices
  // maxLoanAtCap: 정책금융 한도 기준 (LTV와 mortgageCap 적용, DSR 무시) — "생애최초 목표"
  const maxLoanAtCap = maxLoanWithRegulation; // min(maxLoanByLTV, mortgageCap)
  // 보수적: 대출 없이 현금만
  const conservativePrice = availableBudget;
  // 권장: 소득 기준 최대 대출 (LTV + DSR + 규제 상한 모두 적용)
  const recommendedPrice = availableBudget + maxLoan;
  // 낙관적: 생애최초 정책한도 기준 (6억 한도, DSR은 목표 소득 기준이므로 제외)
  const optimisticPrice = availableBudget + maxLoanAtCap;

  // 11. Calculate payment burden
  const monthlyIncomeAfterTax = monthlyIncomeCouple;
  const isPaymentHeavy = monthlyIncomeAfterTax > 0 && (monthlyPaymentMin / monthlyIncomeAfterTax) > 0.30;
  const paymentRatioPercent = monthlyIncomeAfterTax > 0
    ? Math.round((monthlyPaymentMin / monthlyIncomeAfterTax) * 100)
    : 0;

  // 12. Get government loans using pre-tax annual income
  const governmentLoans = getGovernmentLoans(
    recommendedPrice,
    totalPreTaxAnnual,
    input.isCouple,
    isFirstTime
  );

  // 13. Get regional feasibility
  const regionalFeasibility = getRegionalFeasibility(
    availableBudget,
    isFirstTime
  );

  // 14. Calculate credit loan (신용대출/영끌)
  const creditLoanInfo = calculateCreditLoan(
    totalPreTaxAnnual,
    input.isCouple,
    input.useLifestyleLoan,
    input.creditScore,
    false // 다주택자 아님 (첫 계산이라 가정)
  );

  // 15. Calculate final purchase power with credit loan (영끌)
  const yeongkkulPrice = availableBudget + maxLoan + creditLoanInfo.maxLoan;

  // 17. Calculate purchase power summary (한눈에 보기)
  const purchasePower: PurchasePowerSummary = {
    cashOnly: availableBudget,
    withMortgage: availableBudget + maxLoan,
    withCreditLoan: yeongkkulPrice,
    recommendedPrice: recommendedPrice,
  };

  const loanInfo: LoanInfo = {
    ltv,
    maxLoanByLTV,
    maxLoanByDSR,
    maxLoan,
    maxLoanAtCap,
    monthlyPaymentMin,
    monthlyPaymentMax,
    loanTermYears: input.loanTermYears,
  };

  const costBreakdown = {
    savings: input.savings,
    parentGift: input.parentGift,
    otherAssets: input.otherAssets,
    emergencyFund: input.emergencyFund,
    interiorCost: input.interiorCost,
    movingCost: input.movingCost,
    acquisitionTax: acquisitionTax.finalTax,
    registrationFee,
  };

  return {
    monthlyIncomeCouple,
    annualIncomeCouple,
    totalPreTaxAnnual,
    monthlyIncomeAfterTax,
    isFirstTimeEligible: isFirstTime,
    totalAssets,
    totalDeductions,
    availableBudget,
    loanInfo,
    creditLoanInfo,
    acquisitionTax,
    conservativePrice,
    recommendedPrice,
    optimisticPrice,
    yeongkkulPrice,
    isPaymentHeavy,
    paymentRatioPercent,
    purchasePower,
    governmentLoans,
    regionalFeasibility,
    regulationInfo,
    costBreakdown,
  };
}
