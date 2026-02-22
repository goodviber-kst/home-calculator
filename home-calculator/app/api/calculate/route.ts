import { NextRequest, NextResponse } from 'next/server';
import { calculate } from '@/lib/calculator';
import { HomeCalculatorInput } from '@/lib/types';

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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json(
      { error: '계산 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
