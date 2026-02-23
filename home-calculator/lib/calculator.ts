import {
  HomeCalculatorInput,
  CalculationResult,
  AcquisitionTaxBreakdown,
  LoanInfo,
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

// Get LTV by region
function getLTVByRegion(
  region: 'seoul' | 'gyeonggi' | 'metropolitan' | 'other',
  isFirstTime: boolean
): number {
  const ltv = {
    seoul: isFirstTime ? 0.6 : 0.5,
    gyeonggi: isFirstTime ? 0.8 : 0.7,
    metropolitan: isFirstTime ? 0.8 : 0.7,
    other: 0.8,
  };
  return ltv[region];
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
      ltvFirst: isFirstTime ? 0.6 : 0.5,
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
  const maxLoanByDSR = calculateMaxLoanByDSR(
    totalPreTaxAnnual,
    input.loanTermYears
  );
  const maxLoanByLTV = (availableBudget * ltv) / (1 - ltv);
  const maxLoan = Math.min(maxLoanByLTV, maxLoanByDSR);

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
  // 보수적 가격: 대출 포함 (최대대출의 50% 또는 DSR 한도의 25% 중 작은 값)
  const modestLoan = Math.min(maxLoan * 0.5, maxLoanByDSR * 0.25);
  const conservativePrice = availableBudget + modestLoan;
  const recommendedPrice = availableBudget + maxLoan;
  const optimisticPrice = availableBudget + maxLoanByDSR;

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

  const loanInfo: LoanInfo = {
    ltv,
    maxLoanByLTV,
    maxLoanByDSR,
    maxLoan,
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
    acquisitionTax,
    conservativePrice,
    recommendedPrice,
    optimisticPrice,
    isPaymentHeavy,
    paymentRatioPercent,
    governmentLoans,
    regionalFeasibility,
    costBreakdown,
  };
}
