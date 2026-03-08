'use client';

import { CalculationResult } from '@/lib/types';
import ResultCard from './ResultCard';
import { useState } from 'react';

interface HomeResultsProps {
  result: CalculationResult;
}

function formatPrice(price: number): string {
  if (price >= 1000) {
    return `${(price / 10000).toFixed(1)}억`;
  }
  return `${(price / 100).toFixed(0)}천만`;
}

function formatWon(won: number): string {
  if (won >= 100) {
    return `${Math.floor(won).toLocaleString()}만원`;
  }
  return `${Math.floor(won * 10000).toLocaleString()}원`;
}

// 취득세율 표시 헬퍼
function getTaxRateLabel(price: number): string {
  if (price <= 60000) return '1%';
  if (price <= 90000) {
    const rate = ((price / 10000) * 2 / 3 - 3);
    return `${rate.toFixed(1)}%`;
  }
  return '3%';
}

// 용어 설명 툴팁 컴포넌트
function Term({ label, desc }: { label: string; desc: string }) {
  return (
    <span className="relative group cursor-help border-b border-dashed border-gray-400">
      {label}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 max-w-[200px] text-center">
        {desc}
      </span>
    </span>
  );
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
  const [showDetails, setShowDetails] = useState(false);

  const handleCopySummary = () => {
    const text = generateSummaryText(result);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 신용대출 월상환액 계산
  const creditLoanPayment = result.creditLoanInfo.eligible ? result.creditLoanInfo.monthlyPayment : 0;
  const spouseCreditLoanPayment = result.spouseCreditLoanInfo?.eligible ? result.spouseCreditLoanInfo.monthlyPayment : 0;
  const totalCreditLoan = creditLoanPayment + spouseCreditLoanPayment;
  const totalMin = result.loanInfo.monthlyPaymentMin + totalCreditLoan;
  const totalMax = result.loanInfo.monthlyPaymentMax + totalCreditLoan;

  return (
    <div className="space-y-6">
      {/* ── 핵심 1: 구매 가능 가격대 ──────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-emerald-900 rounded-lg p-6 sm:p-8 text-white shadow-xl">
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
              = 가용 {formatPrice(result.availableBudget)} + <Term label="주담대" desc="주택담보대출: 집을 담보로 받는 대출" /> {formatPrice(result.loanInfo.maxLoan)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-75 mb-1 font-semibold"><Term label="영끌" desc="영혼까지 끌어모아 대출받는 전략" /></div>
            <div className="text-2xl font-bold text-red-400">
              {formatPrice(result.yeongkkulPrice)}
            </div>
            <div className="text-xs opacity-60 mt-2">신용대출 포함</div>
            <div className="text-xs opacity-40 mt-1">
              = 가용 {formatPrice(result.availableBudget)} + 주담대 + 신용대출
            </div>
          </div>
        </div>

        {result.loanInfo.maxLoanByDSR < result.loanInfo.maxLoanAtCap && (
          <div className="mt-5 p-3 bg-white bg-opacity-10 rounded-lg border border-yellow-400 border-opacity-60 text-sm">
            <span className="text-yellow-300 font-semibold">소득 제약 안내: </span>
            <span className="opacity-90">
              현재 소득 기준 주담대는 최대 {formatPrice(result.loanInfo.maxLoanByDSR)}이에요.
              {result.regulationInfo.isRegulated && (
                <span className="block mt-1 text-xs opacity-70">
                  (스트레스 금리 +{(result.regulationInfo.stressTestRate * 100).toFixed(1)}%p 적용됨)
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* ── 핵심 2: 월 예상 상환액 ──────────────────────────────── */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white shadow-lg">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3 opacity-90">
          월 예상 상환액
        </h2>
        <div className="text-3xl font-bold">
          {formatWon(totalMin)} ~ {formatWon(totalMax)}
        </div>
        <div className="text-sm opacity-90 mt-3 space-y-1">
          <div>주담대: {formatWon(result.loanInfo.monthlyPaymentMin)} ~ {formatWon(result.loanInfo.monthlyPaymentMax)} (금리 {(result.interestRate - 0.5).toFixed(1)}~{(result.interestRate + 0.5).toFixed(1)}%)</div>
          {totalCreditLoan > 0 && (
            <div>신용대출: {formatWon(totalCreditLoan)} (이자만 납부)</div>
          )}
          <div className="text-xs opacity-70">대출 기간: {result.loanInfo.loanTermYears}년 · 입력 금리: {result.interestRate.toFixed(1)}%</div>
        </div>
        {result.isPaymentHeavy ? (
          <div className="mt-3 p-2 bg-red-500 bg-opacity-30 rounded text-sm font-semibold">
            월 상환액이 세후 월급의 {result.paymentRatioPercent}% — 다소 무리일 수 있어요
          </div>
        ) : result.paymentRatioPercent >= 20 ? (
          <div className="mt-3 p-2 bg-yellow-500 bg-opacity-20 rounded text-sm font-semibold">
            월 상환액이 세후 월급의 {result.paymentRatioPercent}% — 적정 수준
          </div>
        ) : (
          <div className="mt-3 p-2 bg-green-500 bg-opacity-20 rounded text-sm font-semibold">
            월 상환액이 세후 월급의 {result.paymentRatioPercent}% — 여유 있는 수준
          </div>
        )}
      </div>

      {/* ── 핵심 3: 목표 달성 여부 ──────────────────────────────── */}
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
            </div>
          )}
        </div>
      )}

      {/* ── DSR 경고 ──────────────────────────────────────────── */}
      {result.creditLoanDSRWarning && (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
          <div className="text-red-900 space-y-2">
            <div className="font-bold text-lg">신용대출(영끌) 위험 경고</div>
            <div className="text-sm">
              <div className="mb-1">{result.creditLoanDSRWarning}</div>
              <div className="opacity-75 mt-2">
                신용대출을 포함한 실제 월상환액이 소득 기준을 초과하면, 신용등급 하락 및 금융 부채 위험이 높습니다.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 정부대출 자격 뱃지 ──────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-sm text-gray-600 mb-3">정부 대출 자격</h3>
        <div className="flex flex-wrap gap-2">
          {result.governmentLoans.map((loan) => (
            <div
              key={loan.name}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                loan.eligible
                  ? 'bg-green-50 border-green-300 text-green-800'
                  : 'bg-gray-50 border-gray-200 text-gray-400 line-through'
              }`}
            >
              {loan.eligible ? '✓ ' : '✗ '}
              {loan.name}
              <span className="ml-1 opacity-70">{loan.interestRate}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 공동명의 취득세 절감 ──────────────────────────────── */}
      {result.taxComparisonSavings && result.taxComparisonSavings > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <div className="font-semibold text-blue-800 mb-1">공동명의 취득세 절감 효과</div>
          <p className="text-blue-700">
            공동명의(50:50) 시 단독명의 대비 취득세 약 <span className="font-bold">{formatWon(result.taxComparisonSavings)}</span> 절감 가능.
            <span className="text-xs opacity-70 block mt-1">
              (구간별 세율 차이로 발생. 6~9억 구간에서 효과가 큼)
            </span>
          </p>
        </div>
      )}

      {/* ── 상세보기 토글 ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="w-full py-3 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
      >
        {showDetails ? '▲ 상세 정보 접기' : '▼ 상세 정보 펼치기 (대출 분석, 비용 내역, 시뮬레이션)'}
      </button>

      {showDetails && (
        <div className="space-y-6">
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
                  • <Term label="LTV" desc="담보인정비율: 집값 대비 대출 가능 비율" /> 기준:{' '}
                  {formatPrice(result.loanInfo.maxLoanByLTV)}
                  <span className="opacity-75"> ({(result.loanInfo.ltv * 100).toFixed(0)}%)</span>
                </div>
                <div>
                  • <Term label="DSR" desc="총부채원리금상환비율: 연소득 대비 연간 상환액 비율 (40% 상한)" /> 기준:{' '}
                  {formatPrice(result.loanInfo.maxLoanByDSR)}
                  <span className="opacity-75"> (40%)</span>
                </div>
                {result.regulationInfo.isRegulated && (
                  <div className="text-xs opacity-70 mt-1">
                    * DSR 계산 시 스트레스 금리 +{(result.regulationInfo.stressTestRate * 100).toFixed(1)}%p 적용
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
                <div>• 기본 취득세 ({getTaxRateLabel(result.targetPropertyPrice > 0 ? result.targetPropertyPrice : result.recommendedPrice)}): {formatWon(result.acquisitionTax.baseTax)}</div>
                {result.acquisitionTax.exemption > 0 && (
                  <div className="flex items-center gap-2">
                    <span>✓ <Term label="생애최초 감면" desc="생애 최초 주택 구매 시 취득세 200만원 감면" />:</span>
                    <span className="inline-block bg-white bg-opacity-20 px-2 py-1 rounded text-xs font-semibold">
                      {formatWon(result.acquisitionTax.exemption)}
                    </span>
                  </div>
                )}
                <div>• 지방교육세: {formatWon(result.acquisitionTax.educationTax)}</div>
              </div>
            </ResultCard>
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
                  {result.costBreakdown.brokerageFee > 0 && (
                    <div className="flex justify-between">
                      <span>중개수수료</span>
                      <span className="font-semibold">
                        {formatWon(result.costBreakdown.brokerageFee)}
                      </span>
                    </div>
                  )}
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

          {/* Purchase Power Summary */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-lg p-6 text-white shadow-2xl border-2 border-yellow-500">
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-4 opacity-90">
              구매력 비교
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            </div>
          </div>

          {/* 시뮬레이션: What-If 분석 */}
          {result.simulations && result.simulations.length > 0 && (
            <div className="rounded-lg border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                What-If 시뮬레이션 분석
              </h3>

              {result.simulations.filter((s) => s.type === 'interestRate').length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-semibold text-blue-700 mb-3">금리 변동 시나리오</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {result.simulations
                      .filter((s) => s.type === 'interestRate')
                      .map((sim, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-lg border border-blue-200 text-sm">
                          <div className="font-semibold text-blue-800 mb-2">{sim.label}</div>
                          <div className="space-y-1 text-xs text-gray-700">
                            <div>
                              월상환액: <span className="font-semibold">{formatWon(Math.max(0, sim.impact.monthlyPaymentChange))}</span>
                              {sim.impact.monthlyPaymentChange > 0 ? '↑' : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
