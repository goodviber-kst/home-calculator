import { NextRequest, NextResponse } from 'next/server';
import { calculate } from '@/lib/calculator';
import { HomeCalculatorInput } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body: HomeCalculatorInput = await request.json();

    // Validate input
    if (
      !body.applicantIncome ||
      body.applicantIncome <= 0 ||
      !body.targetRegion ||
      !body.loanTermYears
    ) {
      return NextResponse.json(
        { error: '필수 입력값이 없습니다.' },
        { status: 400 }
      );
    }

    // Calculate
    const result = calculate(body);

    // Fire-and-forget: save calculation without blocking response
    saveCalculation(body, result).catch((error) => {
      console.error('Failed to save calculation:', error);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json(
      { error: '계산 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

async function saveCalculation(input: HomeCalculatorInput, result: any) {
  try {
    await supabase.from('calculations').insert({
      region: input.targetRegion,
      is_couple: input.isCouple,
      loan_term_years: input.loanTermYears,
      interest_rate: input.interestRate,
      use_lifestyle_loan: input.useLifestyleLoan,
      savings_band: Math.floor(input.savings / 10000) * 10000,
      total_assets_band: Math.floor(result.totalAssets / 10000) * 10000,
      recommended_price_band: Math.floor(
        result.recommendedPrice / 10000
      ) * 10000,
      max_loan: Math.round(result.loanInfo.maxLoan),
      monthly_payment_min: Math.round(result.loanInfo.monthlyPaymentMin),
      is_payment_heavy: result.isPaymentHeavy,
      is_first_time_eligible: result.isFirstTimeEligible,
      has_target_price: input.targetPropertyPrice > 0,
      target_achievable:
        result.targetPropertyFeasibility?.achievable ?? null,
    });
  } catch (error) {
    // Silently fail - calculation already succeeded and was returned to user
    console.error('Supabase insert error:', error);
  }
}
