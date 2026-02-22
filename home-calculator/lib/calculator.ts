import {
  HomeCalculatorInput,
  CalculationResult,
  AcquisitionTaxBreakdown,
  LoanInfo,
  GovernmentLoanProduct,
  RegionalFeasibility,
} from './types';

// Calculate acquisition tax (취득세)
export function calculateAcquisitionTax(
  purchasePrice: number,
  isFirstTime: boolean
): AcquisitionTaxBreakdown {
  // Basic tax calculation: 2024-2026 rules
  let baseTax = 0;
  if (purchasePrice < 600000000) {
    baseTax = purchasePrice * 0.01; // 1%
  } else if (purchasePrice < 900000000) {
    baseTax = 600000000 * 0.01 + (purchasePrice - 600000000) * 0.03; // 1% + 2%
  } else {
    baseTax = purchasePrice * 0.03; // 3%
  }

  // Education tax: 10% of base tax
  const educationTax = baseTax * 0.1;

  // Rural tax: 0.2% (MVP excludes this)
  const specialTax = 0; // purchasePrice > 85m² ? purchasePrice * 0.002 : 0;

  const subtotal = baseTax + educationTax + specialTax;

  // First-time buyer exemption
  let exemption = 0;
  if (isFirstTime) {
    exemption = Math.min(subtotal, 2000000); // max 200만원
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

// Check first-time buyer eligibility
function isFirstTimeBuyerEligible(
  annualIncome: number,
  isCouple: boolean
): boolean {
  if (isCouple) {
    return annualIncome <= 70000000; // 7천만원
  } else {
    return annualIncome <= 50000000; // 5천만원
  }
}

// Get government loan products
function getGovernmentLoans(
  purchasePrice: number,
  annualIncome: number,
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
      ((isCouple && annualIncome <= 70000000) ||
        (!isCouple && annualIncome <= 60000000)) &&
      purchasePrice <= 500000000,
  };
  loans.push(didimdol);

  // 보금자리론
  const bogeumjari: GovernmentLoanProduct = {
    name: '보금자리론',
    incomeLimit: '제한 없음',
    priceLimit: '6억 이하',
    ltv: 0.7,
    interestRate: '3.8%',
    eligible: purchasePrice <= 600000000,
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

// Get regional feasibility
function getRegionalFeasibility(
  maxBudget: number,
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
      ? `최대 ${Math.floor(r.maxPriceByLTV / 10000000)}억원 구매 가능`
      : '조건 미충족';
    return r;
  });
}

// Main calculation function
export function calculate(input: HomeCalculatorInput): CalculationResult {
  // 1. Calculate monthly and annual income
  const monthlyIncomeCouple = input.isCouple
    ? input.applicantIncome + input.spouseIncome
    : input.applicantIncome;
  const annualIncomeCouple = monthlyIncomeCouple * 12;

  // 2. Check first-time buyer eligibility
  const isFirstTime = isFirstTimeBuyerEligible(
    annualIncomeCouple,
    input.isCouple
  );

  // 3. Calculate total assets
  const totalAssets = input.savings + input.parentGift + input.otherAssets;

  // 4. Calculate LTV by region
  const ltv = getLTVByRegion(input.targetRegion, isFirstTime);

  // 5. Calculate registration fee (0.4%)
  const registrationFeeRate = 0.004;

  // Iterate to find stable purchase price (acquisition tax depends on price)
  let purchasePrice = 400000000; // Start with 4억
  let acquisitionTax: AcquisitionTaxBreakdown;
  let previousPrice = 0;
  let iterations = 0;

  while (Math.abs(purchasePrice - previousPrice) > 1000000 && iterations < 10) {
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

    // Calculate max loan
    const maxLoanByDSR = calculateMaxLoanByDSR(
      annualIncomeCouple,
      input.loanTermYears
    );
    const maxLoanByLTV = availableBudget / (1 - ltv); // = (available / (1-LTV)) - available

    purchasePrice = availableBudget + Math.min(maxLoanByLTV, maxLoanByDSR);
    iterations++;
  }

  acquisitionTax = calculateAcquisitionTax(purchasePrice, isFirstTime);
  const registrationFee = purchasePrice * registrationFeeRate;

  // 6. Final cost calculation
  const totalDeductions =
    input.emergencyFund +
    input.interiorCost +
    input.movingCost +
    acquisitionTax.finalTax +
    registrationFee;

  const availableBudget = Math.max(0, totalAssets - totalDeductions);

  // 7. Calculate max loans
  const maxLoanByDSR = calculateMaxLoanByDSR(
    annualIncomeCouple,
    input.loanTermYears
  );
  const maxLoanByLTV = (availableBudget * ltv) / (1 - ltv);
  const maxLoan = Math.min(maxLoanByLTV, maxLoanByDSR);

  // 8. Calculate payment amounts
  const monthlyPaymentMin = calculateMonthlyPayment(
    maxLoan,
    0.0265, // 디딤돌 최저 금리
    input.loanTermYears
  );
  const monthlyPaymentMax = calculateMonthlyPayment(
    maxLoan,
    0.06, // 일반 최고 금리
    input.loanTermYears
  );

  // 9. Calculate purchase prices
  const conservativePrice = availableBudget;
  const recommendedPrice = availableBudget + maxLoan;
  const optimisticPrice = availableBudget + maxLoanByDSR;

  // 10. Get government loans
  const governmentLoans = getGovernmentLoans(
    recommendedPrice,
    annualIncomeCouple,
    input.isCouple,
    isFirstTime
  );

  // 11. Get regional feasibility
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
    isFirstTimeEligible: isFirstTime,
    totalAssets,
    totalDeductions,
    availableBudget,
    loanInfo,
    acquisitionTax,
    conservativePrice,
    recommendedPrice,
    optimisticPrice,
    governmentLoans,
    regionalFeasibility,
    costBreakdown,
  };
}
