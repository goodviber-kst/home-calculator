import {
  HomeCalculatorInput,
  CalculationResult,
  CalculationSummary,
  AcquisitionTaxBreakdown,
  LoanInfo,
  CreditLoanInfo,
  RegulationInfo,
  PurchasePowerSummary,
  GovernmentLoanProduct,
  RegionalFeasibility,
  SimulationResult,
} from './types';

// Calculate acquisition tax (취득세) — 모든 값 만원 단위
export function calculateAcquisitionTax(
  purchasePrice: number, // 만원 단위
  isFirstTime: boolean
): AcquisitionTaxBreakdown {
  // 107,000만원 입력 예시:
  // baseTax = 107,000 × 0.03 = 3,210만원
  // exemption = 200만원 (생애최초)
  // baseTaxAfterExemption = 3,210 - 200 = 3,010만원
  // educationTax = 3,010 × 0.1 = 301만원
  // finalTax = 3,010 + 301 = 3,311만원

  const baseTax = purchasePrice * 0.03;
  const exemption = isFirstTime ? 200 : 0;
  const baseTaxAfterExemption = baseTax - exemption;
  const educationTax = baseTaxAfterExemption * 0.1;
  const subtotal = baseTaxAfterExemption + educationTax;

  return {
    baseTax: baseTax,
    educationTax: educationTax,
    specialTax: 0,
    subtotal: subtotal,
    exemption: exemption,
    finalTax: subtotal,
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
      mortgageCap: 60000, // 6억원 상한 (만원 단위: 60000만원 = 6억)
      ltvLimit: isFirstTime ? 0.7 : 0.6, // 생애최초 LTV 70%
      stressTestRate: 0.03, // 3.0% 스트레스 테스트
      details: '투기과열지구. 생애최초는 LTV 70% (최대 6억), 일반은 60%.',
    },
    gyeonggi: {
      regionName: '경기 (조정대상지역)',
      isRegulated: true,
      mortgageCap: 60000, // 6억원 상한 (만원 단위: 60000만원 = 6억)
      ltvLimit: isFirstTime ? 0.7 : 0.6,
      stressTestRate: 0.03,
      details: '조정대상지역. 주담대 6억 상한, 첫-구매자 LTV 70%',
    },
    metropolitan: {
      regionName: '광역시 (조정)',
      isRegulated: true,
      mortgageCap: 60000, // 6억원 상한 (만원 단위: 60000만원 = 6억)
      ltvLimit: isFirstTime ? 0.7 : 0.6,
      stressTestRate: 0.03,
      details: '조정대상지역. 서울과 동일한 규제 적용 (LTV 70%)',
    },
    other: {
      regionName: '기타 지역 (비규제)',
      isRegulated: false,
      mortgageCap: 999999, // 제한 없음
      ltvLimit: isFirstTime ? 0.8 : 0.7,
      stressTestRate: 0.015, // 1.5% 스트레스 테스트
      details: '규제 없음. 일반적인 금융기준 적용 (LTV 80%)',
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

  // 신용대출 한도: 연봉의 100%, 절대 상한 1억(10000만원)
  const maxByIncome = Math.min(annualIncome * 1.0, 10000);

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
  loanTermYears: number,
  interestRate: number = 0.045 // 소수 형태 (e.g. 0.04 = 4%)
): number {
  const dsrRatio = 0.4; // 40% DSR
  const maxAnnualPayment = annualIncome * dsrRatio;
  const maxMonthlyPayment = maxAnnualPayment / 12;

  const avgRate = interestRate;
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
// 소득 제한 없이 항상 생애최초 조건 적용
function isFirstTimeBuyerEligible(
  annualIncome: number, // 만원 단위 세전 연봉 (현재 미사용)
  isCouple: boolean
): boolean {
  return true; // 소득과 관계없이 항상 생애최초 조건 적용
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

// Generate simulations for "what-if" analysis
function generateSimulations(
  input: HomeCalculatorInput,
  baselineMetrics: {
    monthlyPaymentMin: number;
    monthlyPaymentMax: number;
    yeongkkulPrice: number;
    maxLoan: number;
    realDSRWithCreditLoan: number;
    totalPreTaxAnnual: number;
  }
): SimulationResult[] {
  const simulations: SimulationResult[] = [];

  // 1. 금리 시나리오 (현재, +1%, +1.5%)
  const currentRate = input.interestRate ?? 4.0;
  const ratesScenarios = [0, 1.0, 1.5];

  ratesScenarios.forEach((increase) => {
    const newRate = currentRate + increase;
    const monthlyPayment = calculateMonthlyPayment(
      baselineMetrics.maxLoan,
      newRate / 100,
      input.loanTermYears
    );

    simulations.push({
      type: 'interestRate',
      label: increase === 0 ? `현재 금리 ${currentRate}%` : `금리 +${increase}%`,
      change: increase,
      originalValue: currentRate,
      newValue: newRate,
      impact: {
        monthlyPaymentChange: monthlyPayment - baselineMetrics.monthlyPaymentMin,
        affordablePriceChange: 0, // 금리는 구매력에 직접 영향 없음 (DSR 기반)
      },
    });
  });

  // 2. 배우자/부부 소득 변화 시나리오
  if (input.isCouple) {
    const incomeIncreases = [500, 1000]; // 만원 단위

    incomeIncreases.forEach((increase) => {
      const newPreTaxAnnual = input.applicantPreTaxAnnual + input.spousePreTaxAnnual + increase * 12;
      const newMaxLoanByDSR = calculateMaxLoanByDSR(newPreTaxAnnual, input.loanTermYears, (input.interestRate ?? 4.0) / 100);
      const newAffordablePrice = 0; // 계산 복잡하므로 생략 (실제로는 재계산)

      simulations.push({
        type: 'income',
        label: `배우자 소득 +${increase}만원 (월)`,
        change: increase,
        originalValue: (input.applicantPreTaxAnnual + input.spousePreTaxAnnual) / 12,
        newValue: (input.applicantPreTaxAnnual + input.spousePreTaxAnnual) / 12 + increase,
        impact: {
          monthlyPaymentChange: 0,
          affordablePriceChange: (newMaxLoanByDSR - baselineMetrics.maxLoan) * (input.loanTermYears === 20 ? 1 : input.loanTermYears === 15 ? 1 : 1), // 근사값
        },
      });
    });
  }

  // 3. 목표가 시나리오
  if (input.targetPropertyPrice > 0) {
    const priceIncreases = [50000, 100000]; // 만원 단위 (5000만, 1억)

    priceIncreases.forEach((increase) => {
      const newTargetPrice = input.targetPropertyPrice + increase;
      const newAcquisitionTax = calculateAcquisitionTax(newTargetPrice, true);
      const newRegistrationFee = newTargetPrice * 0.0045; // 등기비 0.45%

      simulations.push({
        type: 'targetPrice',
        label: `목표가 +${(increase / 10000).toFixed(0)}억원`,
        change: increase,
        originalValue: input.targetPropertyPrice,
        newValue: newTargetPrice,
        impact: {
          monthlyPaymentChange: 0, // 목표가 변화는 월상환액에 직접 영향 없음
          affordablePriceChange: 0, // 이미 충분한 재정으로 가정
        },
        warning: newTargetPrice > baselineMetrics.yeongkkulPrice
          ? `⚠️ 현재 구매력(${(baselineMetrics.yeongkkulPrice / 10000).toFixed(1)}억) 초과`
          : undefined,
      });
    });
  }

  return simulations;
}

// Generate summary for AI interpretation and debugging
function generateSummary(
  totalPreTaxAnnual: number,
  availableBudget: number,
  ltv: number,
  loanTermYears: number,
  interestRate: number,
  maxLoanByDSR: number,
  maxLoanByLTV: number,
  regulationInfo: RegulationInfo,
  maxLoan: number,
  yeongkkulPrice: number,
  targetPropertyPrice: number
): CalculationSummary {
  // DSR 계산 과정
  const dsrRatio = 0.4;
  const maxAnnualPayment = totalPreTaxAnnual * dsrRatio;
  const maxMonthlyPayment = maxAnnualPayment / 12;

  // LTV 계산 과정
  const rate = interestRate / 100;

  // 최종 제약 분석
  let reason = '';
  if (maxLoan === Math.min(maxLoanByDSR, maxLoanByLTV, regulationInfo.mortgageCap)) {
    if (maxLoanByDSR <= maxLoanByLTV && maxLoanByDSR <= regulationInfo.mortgageCap) {
      reason = `DSR 제약 (월상환 ${Math.round(maxMonthlyPayment / 10000)}만원 한도)`;
    } else if (maxLoanByLTV <= maxLoanByDSR && maxLoanByLTV <= regulationInfo.mortgageCap) {
      reason = `LTV 제약 (${Math.round(ltv * 100)}% 한도)`;
    } else {
      reason = `규제상한 제약 (${regulationInfo.regionName} ${regulationInfo.mortgageCap / 10000}억원)`;
    }
  }

  const targetAnalysis =
    targetPropertyPrice > 0
      ? {
          targetPrice: targetPropertyPrice,
          totalAvailable: yeongkkulPrice,
          shortfall: targetPropertyPrice - yeongkkulPrice,
          analysis:
            targetPropertyPrice <= yeongkkulPrice
              ? `✓ 달성 가능 (여유금: ${Math.round((yeongkkulPrice - targetPropertyPrice) / 10000)}억원)`
              : `✗ 부족 (필요금: ${Math.round((targetPropertyPrice - yeongkkulPrice) / 10000)}억원)`,
        }
      : undefined;

  return {
    dsr: {
      annualIncome: totalPreTaxAnnual,
      dsrRatio,
      maxAnnualPayment,
      maxMonthlyPayment,
      resultMaxLoan: maxLoanByDSR,
    },
    ltv: {
      availableBudget,
      ltvRatio: ltv,
      resultMaxLoan: maxLoanByLTV,
    },
    regulation: {
      regionName: regulationInfo.regionName,
      mortgageCap: regulationInfo.mortgageCap,
      isRegulated: regulationInfo.isRegulated,
    },
    decision: {
      maxLoanByDSR,
      maxLoanByLTV,
      mortgageCap: regulationInfo.mortgageCap,
      maxLoan,
      reason,
    },
    targetAnalysis,
  };
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
  let registrationFee = purchasePrice * registrationFeeRate;

  // 목표가가 입력되었을 때는 목표가 기반으로 재계산
  if (input.targetPropertyPrice > 0) {
    acquisitionTax = calculateAcquisitionTax(input.targetPropertyPrice, isFirstTime);
    registrationFee = input.targetPropertyPrice * registrationFeeRate;
  }

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
  const rate = (input.interestRate ?? 4.0) / 100; // 소수 형태

  const maxLoanByDSR = calculateMaxLoanByDSR(
    totalPreTaxAnnual,
    input.loanTermYears,
    rate
  );
  const maxLoanByLTV = (availableBudget * ltv) / (1 - ltv);

  // 규제 상한 적용 (조정대상지역/투기과열지구: 6억)
  const maxLoanWithRegulation = Math.min(
    maxLoanByLTV,
    regulationInfo.mortgageCap
  );

  const maxLoan = Math.min(maxLoanWithRegulation, maxLoanByDSR);

  // 9. Calculate payment amounts based on user-provided interest rate ± 0.5%
  const rateMin = Math.max(0.01, rate - 0.005);
  const rateMax = rate + 0.005;
  const monthlyPaymentMin = calculateMonthlyPayment(maxLoan, rateMin, input.loanTermYears);
  const monthlyPaymentMax = calculateMonthlyPayment(maxLoan, rateMax, input.loanTermYears);

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

  // 14-b. 배우자 신용대출 (공동명의 + 배우자 신용대출 옵션 시)
  const spouseCreditLoanInfo =
    input.isCouple && input.useSpouseCreditLoan && input.useLifestyleLoan
      ? calculateCreditLoan(
          input.spousePreTaxAnnual,
          false,
          true,
          input.spouseCreditScore ?? 700,
          false
        )
      : null;

  const totalCreditLoan = creditLoanInfo.maxLoan + (spouseCreditLoanInfo?.maxLoan ?? 0);

  // 신용대출 월상환액 (DSR 포함 계산용)
  const creditLoanMonthlyPayment = creditLoanInfo.monthlyPayment + (spouseCreditLoanInfo?.monthlyPayment ?? 0);
  const totalMonthlyPaymentWithCreditLoan = monthlyPaymentMin + creditLoanMonthlyPayment;
  const realDSRWithCreditLoan = (totalMonthlyPaymentWithCreditLoan * 12) / totalPreTaxAnnual;
  const creditLoanDSRWarning = realDSRWithCreditLoan > 0.4
    ? `⚠️ 신용대출 포함 시 실제 DSR ${(realDSRWithCreditLoan * 100).toFixed(1)}% (기준 40% 초과!)`
    : '';

  // 15. Calculate final purchase power with credit loan (영끌)
  const yeongkkulPrice = availableBudget + maxLoan + totalCreditLoan;

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

  // 목표 주택가 달성 가능성 분석
  const targetPropertyFeasibility =
    input.targetPropertyPrice > 0
      ? {
          targetPrice: input.targetPropertyPrice,
          achievable: yeongkkulPrice >= input.targetPropertyPrice,
          shortfall: input.targetPropertyPrice - yeongkkulPrice,
          maxAffordable: yeongkkulPrice,
          targetAcquisitionTax: calculateAcquisitionTax(input.targetPropertyPrice, isFirstTime),
        }
      : null;

  // Generate summary for AI interpretation
  const summary = generateSummary(
    totalPreTaxAnnual,
    availableBudget,
    ltv,
    input.loanTermYears,
    input.interestRate ?? 4.0,
    maxLoanByDSR,
    maxLoanByLTV,
    regulationInfo,
    maxLoan,
    yeongkkulPrice,
    input.targetPropertyPrice ?? 0
  );

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
    interestRate: input.interestRate ?? 4.0,
    targetPropertyPrice: input.targetPropertyPrice ?? 0,
    spouseCreditLoanInfo,
    targetPropertyFeasibility,
    summary,
    realDSRWithCreditLoan,
    creditLoanDSRWarning: creditLoanDSRWarning || undefined,
    simulations: generateSimulations(input, {
      monthlyPaymentMin,
      monthlyPaymentMax,
      yeongkkulPrice,
      maxLoan,
      realDSRWithCreditLoan,
      totalPreTaxAnnual,
    }),
  };
}
