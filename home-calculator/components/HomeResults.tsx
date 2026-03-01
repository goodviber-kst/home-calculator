'use client';

import { CalculationResult } from '@/lib/types';
import ResultCard from './ResultCard';
import { useState } from 'react';

interface HomeResultsProps {
  result: CalculationResult;
}

function formatPrice(price: number): string {
  // Input is already in 만원 unit from calculator
  if (price >= 1000) {
    // Convert to 억 (100M won = 10000 만원)
    return `${(price / 10000).toFixed(1)}억`;
  }
  // 천만 (10M won = 1000 만원)
  return `${(price / 100).toFixed(0)}천만`;
}

function formatWon(won: number): string {
  // Input is already in 만원 unit from calculator
  if (won >= 100) {
    return `${Math.floor(won).toLocaleString()}만원`;
  }
  return `${Math.floor(won * 10000).toLocaleString()}원`;
}

function generateSummaryText(result: CalculationResult): string {
  const summary = result.summary;
  return `【AI 계산 분석 Summary】

📊 DSR 기반 한도 (소득 기준)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 세전 연봉: ${formatWon(summary.dsr.annualIncome)}
• DSR 비율: ${(summary.dsr.dsrRatio * 100).toFixed(0)}%
• 월 최대 상환: ${formatWon(summary.dsr.maxMonthlyPayment)}
• 결과 최대 대출: ${formatPrice(summary.dsr.resultMaxLoan)}

🏠 LTV 기반 한도 (자산 기준)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 가용 자금: ${formatPrice(summary.ltv.availableBudget)}
• LTV 비율: ${(summary.ltv.ltvRatio * 100).toFixed(0)}%
• 결과 최대 대출: ${formatPrice(summary.ltv.resultMaxLoan)}

⚖️ 최종 제약 분석
━━━━━━━━━━━━━━━━━━━━━━━━━━━
• DSR 제약: ${formatPrice(summary.decision.maxLoanByDSR)}
• LTV 제약: ${formatPrice(summary.decision.maxLoanByLTV)}
• 규제 상한: ${formatPrice(summary.decision.mortgageCap)}
• 최종 최대 대출: ${formatPrice(summary.decision.maxLoan)}
• 제약 원인: ${summary.decision.reason}

📍 규제 지역 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 지역: ${summary.regulation.regionName}
• 규제 여부: ${summary.regulation.isRegulated ? '✗ 규제' : '✓ 비규제'}
• 주담대 상한: ${formatPrice(summary.regulation.mortgageCap)}
${
  summary.targetAnalysis
    ? `
🎯 목표가 달성 분석
━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 목표 주택가: ${formatPrice(summary.targetAnalysis.targetPrice)}
• 최대 구매 가능: ${formatPrice(summary.targetAnalysis.totalAvailable)}
• ${summary.targetAnalysis.analysis}`
    : ''
}`;
}

export default function HomeResults({ result }: HomeResultsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const text = generateSummaryText(result);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* HERO: Final Purchase Power Summary (한눈에 보기) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-lg p-8 text-white shadow-2xl border-2 border-yellow-500">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-6 opacity-90">
          🎯 최종 구매력 한눈에 보기 (영끌 계산기)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20">
            <div className="text-xs opacity-75 mb-1">현금만</div>
            <div className="text-2xl font-bold text-yellow-300">
              {formatPrice(result.purchasePower.cashOnly)}
            </div>
            <div className="text-xs opacity-60 mt-1">대출 없이 가용자금만</div>
            <div className="text-xs opacity-40 mt-1">= 자산 - 비용</div>
          </div>

          <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20">
            <div className="text-xs opacity-75 mb-1">+ 주담대</div>
            <div className="text-2xl font-bold text-blue-300">
              {formatPrice(result.purchasePower.withMortgage)}
            </div>
            <div className="text-xs opacity-60 mt-1">소득 기준 최대 대출</div>
            <div className="text-xs opacity-40 mt-1">
              {formatPrice(result.availableBudget)} + {formatPrice(result.loanInfo.maxLoan)}
            </div>
          </div>

          {result.creditLoanInfo.eligible && (
            <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg border border-red-500 border-opacity-50">
              <div className="text-xs opacity-75 mb-1">+ 신용대출</div>
              <div className="text-2xl font-bold text-red-300">
                {formatPrice(result.purchasePower.withCreditLoan)}
              </div>
              <div className="text-xs opacity-60 mt-1">신용대출까지 영끌</div>
              <div className="text-xs opacity-40 mt-1">
                주담대포함 + {formatPrice(result.creditLoanInfo.maxLoan)}
              </div>
            </div>
          )}

          <div className="text-center p-3 bg-yellow-500 bg-opacity-20 rounded-lg border border-yellow-500">
            <div className="text-xs opacity-90 mb-1 font-semibold">생애최초 한도</div>
            <div className="text-2xl font-bold">
              {formatPrice(result.availableBudget + result.loanInfo.maxLoanAtCap)}
            </div>
            <div className="text-xs opacity-75 mt-1">정책금융 6억 한도 기준</div>
            <div className="text-xs opacity-50 mt-1">
              {formatPrice(result.availableBudget)} + {formatPrice(result.loanInfo.maxLoanAtCap)}
            </div>
          </div>
        </div>
      </div>

      {/* HERO: Purchase Price Range */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-emerald-900 rounded-lg p-8 text-white shadow-xl">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-4 opacity-90">
          생애최초 구매 가능 가격대
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center border-r border-white border-opacity-30">
            <div className="text-sm opacity-75 mb-1">권장</div>
            <div className="text-2xl font-bold">
              {formatPrice(result.recommendedPrice)}
            </div>
            <div className="text-xs opacity-60 mt-2">소득기준 최적 대출</div>
            <div className="text-xs opacity-40 mt-1">
              = 가용 {formatPrice(result.availableBudget)} + 주담대 {formatPrice(result.loanInfo.maxLoan)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-75 mb-1">낙관적</div>
            <div className="text-2xl font-bold">
              {formatPrice(result.optimisticPrice)}
            </div>
            <div className="text-xs opacity-60 mt-2">생애최초 6억 한도 기준</div>
            <div className="text-xs opacity-40 mt-1">
              = 가용 {formatPrice(result.availableBudget)} + {formatPrice(result.loanInfo.maxLoanAtCap)}
            </div>
          </div>
        </div>

        {/* DSR 제약 안내 박스 */}
        {result.loanInfo.maxLoanByDSR < result.loanInfo.maxLoanAtCap && (
          <div className="mt-5 p-3 bg-white bg-opacity-10 rounded-lg border border-yellow-400 border-opacity-60 text-sm">
            <span className="text-yellow-300 font-semibold">💡 소득 제약 안내: </span>
            <span className="opacity-90">
              현재 소득 기준 주담대는 최대 {formatPrice(result.loanInfo.maxLoanByDSR)}이에요.
              낙관적 목표({formatPrice(result.optimisticPrice)})를 달성하려면 연소득이 더 높아야 해요.
            </span>
          </div>
        )}
      </div>

      {/* 목표 주택 달성 가능성 분석 */}
      {result.targetPropertyFeasibility && (
        <div
          className={`rounded-lg p-5 border-2 ${
            result.targetPropertyFeasibility.achievable
              ? 'bg-green-50 border-green-400'
              : 'bg-amber-50 border-amber-400'
          }`}
        >
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            {result.targetPropertyFeasibility.achievable ? '✅' : '🎯'}
            목표 주택 {formatPrice(result.targetPropertyFeasibility.targetPrice)} 분석
          </h3>
          {result.targetPropertyFeasibility.achievable ? (
            <div className="text-green-700 space-y-1">
              <p className="font-bold text-xl">달성 가능합니다!</p>
              <p className="text-sm">
                현재 최대 구매가 {formatPrice(result.targetPropertyFeasibility.maxAffordable)} —
                목표보다{' '}
                <span className="font-semibold">
                  {formatPrice(Math.abs(result.targetPropertyFeasibility.shortfall))} 여유
                </span>
              </p>
            </div>
          ) : (
            <div className="text-amber-800 space-y-2">
              <p className="font-bold text-xl">
                {formatPrice(result.targetPropertyFeasibility.shortfall)} 부족
              </p>
              <p className="text-sm">
                현재 최대 구매가: {formatPrice(result.targetPropertyFeasibility.maxAffordable)} →
                목표: {formatPrice(result.targetPropertyFeasibility.targetPrice)}
              </p>
              <div className="p-2 bg-amber-100 rounded text-xs text-amber-900">
                추가 저축이나 소득 증가 시 달성 가능한 목표입니다.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Regulation & Credit Loan Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Region Regulation Info */}
        <div className="rounded-lg border border-gray-200 p-6 bg-gradient-to-br from-orange-50 to-amber-50">
          <h3 className="font-semibold text-lg mb-4">📍 {result.regulationInfo.regionName}</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">규제 여부:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${result.regulationInfo.isRegulated ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                {result.regulationInfo.isRegulated ? '✗ 규제 지역' : '✓ 비규제'}
              </span>
            </div>
            <div>
              <span className="font-medium">주담대 상한:</span>
              <span className="ml-2">{result.regulationInfo.isRegulated ? '6억원' : '제한 없음'}</span>
            </div>
            <div>
              <span className="font-medium">LTV 한도:</span>
              <span className="ml-2">{(result.regulationInfo.ltvLimit * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="font-medium">스트레스 테스트:</span>
              <span className="ml-2">{(result.regulationInfo.stressTestRate * 100).toFixed(1)}%</span>
            </div>
            <div className="pt-2 border-t border-amber-300">
              <p className="text-xs text-gray-700">{result.regulationInfo.details}</p>
            </div>
          </div>
        </div>

        {/* Credit Loan Info */}
        <div className={`rounded-lg border-2 p-6 ${result.creditLoanInfo.eligible ? 'border-red-300 bg-gradient-to-br from-red-50 to-rose-50' : 'border-gray-300 bg-gray-50'}`}>
          <h3 className="font-semibold text-lg mb-4">💳 신용대출 (영끌)</h3>
          {result.creditLoanInfo.eligible ? (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">신청자 한도:</span>
                <span className="ml-2 text-lg font-bold text-red-600">{formatPrice(result.creditLoanInfo.maxLoan)}</span>
              </div>
              {result.spouseCreditLoanInfo?.eligible && (
                <div>
                  <span className="font-medium">배우자 한도:</span>
                  <span className="ml-2 text-lg font-bold text-orange-600">{formatPrice(result.spouseCreditLoanInfo.maxLoan)}</span>
                </div>
              )}
              {result.spouseCreditLoanInfo?.eligible && (
                <div className="pt-1 border-t border-red-200">
                  <span className="font-semibold">합산 한도:</span>
                  <span className="ml-2 font-bold text-red-700">
                    {formatPrice(result.creditLoanInfo.maxLoan + result.spouseCreditLoanInfo.maxLoan)}
                  </span>
                </div>
              )}
              <div>
                <span className="font-medium">월 상환액:</span>
                <span className="ml-2">{formatWon(result.creditLoanInfo.monthlyPayment)}</span>
              </div>
              <div className="pt-2 border-t border-red-300 bg-red-100 p-2 rounded text-xs">
                <span className="font-semibold">⚠️ 주의:</span> 신용대출은 높은 금리와 리스크가 있습니다. 신중하게 사용하세요.
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">❌ 신용대출 불가</p>
              <p>{result.creditLoanInfo.reason}</p>
            </div>
          )}
        </div>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Max Loan */}
        <ResultCard
          title="최대 대출 가능액"
          icon="💰"
          className="from-blue-600 to-cyan-600"
        >
          <div className="text-3xl font-bold">
            {formatPrice(result.loanInfo.maxLoan)}
          </div>
          <div className="text-sm opacity-90 space-y-1 mt-3">
            <div>
              • LTV 기준:{' '}
              {formatPrice(result.loanInfo.maxLoanByLTV)}
              <span className="opacity-75"> ({(result.loanInfo.ltv * 100).toFixed(0)}%)</span>
            </div>
            <div>
              • DSR 기준:{' '}
              {formatPrice(result.loanInfo.maxLoanByDSR)}
              <span className="opacity-75"> (40%)</span>
            </div>
          </div>
        </ResultCard>

        {/* Monthly Payment */}
        <ResultCard
          title="월 예상 상환액"
          icon="📊"
          className="from-purple-600 to-pink-600"
        >
          <div className="text-3xl font-bold">
            {formatWon(result.loanInfo.monthlyPaymentMin)} ~{' '}
            {formatWon(result.loanInfo.monthlyPaymentMax)}
          </div>
          <div className="text-sm opacity-90 space-y-1 mt-3">
            <div>• 금리 {(result.interestRate - 0.5).toFixed(1)}% 시: {formatWon(result.loanInfo.monthlyPaymentMin)}</div>
            <div>• 금리 {(result.interestRate + 0.5).toFixed(1)}% 시: {formatWon(result.loanInfo.monthlyPaymentMax)}</div>
            <div className="opacity-60">· 입력 금리: {result.interestRate.toFixed(1)}%</div>
            <div>• 대출 기간: {result.loanInfo.loanTermYears} 년</div>
            {result.isPaymentHeavy && (
              <div className="mt-2 pt-2 border-t border-white border-opacity-30">
                <div className="text-red-100 font-semibold">
                  🔴 월 상환액이 세후 월급의 {result.paymentRatioPercent}% — 다소 무리일 수 있어요
                </div>
              </div>
            )}
            {!result.isPaymentHeavy && result.paymentRatioPercent >= 20 && (
              <div className="mt-2 pt-2 border-t border-white border-opacity-30">
                <div className="text-yellow-100 font-semibold">
                  🟡 월 상환액이 세후 월급의 {result.paymentRatioPercent}% — 적정 수준
                </div>
              </div>
            )}
            {result.paymentRatioPercent < 20 && (
              <div className="mt-2 pt-2 border-t border-white border-opacity-30">
                <div className="text-green-100 font-semibold">
                  🟢 월 상환액이 세후 월급의 {result.paymentRatioPercent}% — 여유 있는 수준
                </div>
              </div>
            )}
          </div>
        </ResultCard>

        {/* Acquisition Tax */}
        <ResultCard
          title="취득세"
          icon="📋"
          className="from-orange-600 to-amber-600"
        >
          <div className="text-3xl font-bold">
            {formatWon(result.acquisitionTax.finalTax)}
          </div>
          <div className="text-sm opacity-90 space-y-1 mt-3">
            <div>• 기본 취득세: {formatWon(result.acquisitionTax.baseTax)}</div>
            <div>
              {result.acquisitionTax.exemption > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <span>✓ 생애최초 감면:</span>
                    <span className="inline-block bg-white bg-opacity-20 px-2 py-1 rounded text-xs font-semibold">
                      {formatWon(result.acquisitionTax.exemption)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </ResultCard>

      </div>

      {/* Removed: Government Loan Comparison */}
      <div style={{ display: 'none' }}>
        <h3 className="font-semibold text-lg mb-4">정부 대출 상품 전체 비교</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-2 px-3 font-semibold">상품명</th>
              <th className="text-left py-2 px-3 font-semibold">소득 한도</th>
              <th className="text-left py-2 px-3 font-semibold">가격 한도</th>
              <th className="text-left py-2 px-3 font-semibold">LTV</th>
              <th className="text-left py-2 px-3 font-semibold">금리</th>
              <th className="text-center py-2 px-3 font-semibold">가능</th>
            </tr>
          </thead>
          <tbody>
            {result.governmentLoans.map((loan) => (
              <tr
                key={loan.name}
                className={`border-b border-gray-100 ${
                  loan.eligible ? '' : 'opacity-50'
                }`}
              >
                <td className="py-2 px-3 font-medium">{loan.name}</td>
                <td className="py-2 px-3">{loan.incomeLimit}</td>
                <td className="py-2 px-3">{loan.priceLimit}</td>
                <td className="py-2 px-3">{(loan.ltv * 100).toFixed(0)}%</td>
                <td className="py-2 px-3">{loan.interestRate}</td>
                <td className="py-2 px-3 text-center">
                  {loan.eligible ? '✓' : '✗'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cost Breakdown */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-lg mb-4">총 비용 내역</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm font-semibold text-gray-600 uppercase mb-3">
              자산
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>저축액</span>
                <span className="font-semibold">
                  {formatWon(result.costBreakdown.savings)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>부모 증여</span>
                <span className="font-semibold">
                  {formatWon(result.costBreakdown.parentGift)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>기타 자산</span>
                <span className="font-semibold">
                  {formatWon(result.costBreakdown.otherAssets)}
                </span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
                <span>총 자산</span>
                <span>{formatWon(result.totalAssets)}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-600 uppercase mb-3">
              차감
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>여유자금</span>
                <span className="font-semibold">
                  {formatWon(result.costBreakdown.emergencyFund)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>인테리어</span>
                <span className="font-semibold">
                  {formatWon(result.costBreakdown.interiorCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>이사비</span>
                <span className="font-semibold">
                  {formatWon(result.costBreakdown.movingCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>취득세</span>
                <span className="font-semibold">
                  {formatWon(result.costBreakdown.acquisitionTax)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>등기비</span>
                <span className="font-semibold">
                  {formatWon(result.costBreakdown.registrationFee)}
                </span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
                <span>합계</span>
                <span>{formatWon(result.totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">가용 예산</span>
              <span className="text-lg font-bold text-blue-600">
                {formatWon(result.availableBudget)}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              = 총 자산({formatWon(result.totalAssets)}) - 차감({formatWon(result.totalDeductions)})
            </div>
          </div>
        </div>
      </div>

      {/* AI 해석용 Summary (로직 검증/수정 용도) */}
      <div className="rounded-lg border-2 border-purple-400 bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            🤖 AI 해석용 Summary (로직 검증/수정)
          </h3>
          <button
            onClick={handleCopySummary}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
          >
            {copied ? '✓ 복사됨' : '📋 텍스트 복사'}
          </button>
        </div>

        {/* 텍스트 형식 Summary (복사용) */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-purple-300 font-mono text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">
          {generateSummaryText(result)}
        </div>

        {/* DSR 제약 분석 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-white rounded-lg border border-blue-300">
            <div className="text-sm font-semibold text-blue-700 mb-3">📊 DSR 기반 한도</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>세전 연봉:</span>
                <span className="font-semibold">{formatWon(result.summary.dsr.annualIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span>DSR 비율:</span>
                <span className="font-semibold">{(result.summary.dsr.dsrRatio * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>월 최대 상환:</span>
                <span className="font-semibold">{formatWon(result.summary.dsr.maxMonthlyPayment)}</span>
              </div>
              <div className="pt-2 border-t border-blue-200">
                <div className="flex justify-between font-bold text-blue-700">
                  <span>결과 최대 대출:</span>
                  <span>{formatPrice(result.summary.dsr.resultMaxLoan)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-green-300">
            <div className="text-sm font-semibold text-green-700 mb-3">🏠 LTV 기반 한도</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>가용 자금:</span>
                <span className="font-semibold">{formatPrice(result.summary.ltv.availableBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span>LTV 비율:</span>
                <span className="font-semibold">{(result.summary.ltv.ltvRatio * 100).toFixed(0)}%</span>
              </div>
              <div className="text-xs text-gray-600">
                공식: 가용자금 × LTV / (1 - LTV)
              </div>
              <div className="pt-2 border-t border-green-200">
                <div className="flex justify-between font-bold text-green-700">
                  <span>결과 최대 대출:</span>
                  <span>{formatPrice(result.summary.ltv.resultMaxLoan)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 최종 결정 분석 */}
        <div className="p-4 bg-white rounded-lg border-2 border-purple-400">
          <div className="text-sm font-semibold text-purple-700 mb-3">⚖️ 최종 제약 분석</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="text-xs text-gray-600">DSR</div>
              <div className="font-bold text-purple-700">{formatPrice(result.summary.decision.maxLoanByDSR)}</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="text-xs text-gray-600">LTV</div>
              <div className="font-bold text-purple-700">{formatPrice(result.summary.decision.maxLoanByLTV)}</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="text-xs text-gray-600">규제 상한</div>
              <div className="font-bold text-purple-700">{formatPrice(result.summary.decision.mortgageCap)}</div>
            </div>
            <div className="text-center p-2 bg-yellow-100 rounded border border-yellow-400">
              <div className="text-xs font-semibold text-yellow-800">최종</div>
              <div className="font-bold text-yellow-800">{formatPrice(result.summary.decision.maxLoan)}</div>
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded border border-amber-400">
            <div className="text-sm">
              <span className="font-semibold text-amber-800">🔍 제약 원인: </span>
              <span className="text-amber-900">{result.summary.decision.reason}</span>
            </div>
          </div>
        </div>

        {/* 규제 정보 */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-orange-300">
          <div className="text-sm font-semibold text-orange-700 mb-2">📍 규제 지역 정보</div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>지역:</span>
              <span className="font-semibold">{result.summary.regulation.regionName}</span>
            </div>
            <div className="flex justify-between">
              <span>규제 여부:</span>
              <span className="font-semibold">{result.summary.regulation.isRegulated ? '✗ 규제' : '✓ 비규제'}</span>
            </div>
            <div className="flex justify-between">
              <span>주담대 상한:</span>
              <span className="font-semibold">{formatPrice(result.summary.regulation.mortgageCap)}</span>
            </div>
          </div>
        </div>

        {/* 목표가 분석 */}
        {result.summary.targetAnalysis && (
          <div className="mt-6 p-4 bg-white rounded-lg border border-indigo-300">
            <div className="text-sm font-semibold text-indigo-700 mb-2">🎯 목표가 달성 분석</div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>목표 주택가:</span>
                <span className="font-semibold">{formatPrice(result.summary.targetAnalysis.targetPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>최대 구매 가능:</span>
                <span className="font-semibold">{formatPrice(result.summary.targetAnalysis.totalAvailable)}</span>
              </div>
              <div className="pt-2 border-t border-indigo-200">
                <div className="font-semibold text-indigo-700">{result.summary.targetAnalysis.analysis}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
