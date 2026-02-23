'use client';

import { CalculationResult } from '@/lib/types';
import ResultCard from './ResultCard';

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

export default function HomeResults({ result }: HomeResultsProps) {
  return (
    <div className="space-y-8">
      {/* HERO: Purchase Price Range */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-emerald-900 rounded-lg p-8 text-white shadow-xl">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-2 opacity-90">
          생애최초 구매 가능 가격대
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm opacity-75 mb-1">보수적</div>
            <div className="text-2xl font-bold">
              {formatPrice(result.conservativePrice)}
            </div>
          </div>
          <div className="text-center border-l border-r border-white border-opacity-30">
            <div className="text-sm opacity-75 mb-1">권장</div>
            <div className="text-2xl font-bold">
              {formatPrice(result.recommendedPrice)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-75 mb-1">낙관적</div>
            <div className="text-2xl font-bold">
              {formatPrice(result.optimisticPrice)}
            </div>
          </div>
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
            <div>• 금리 3.3% 시: {formatWon(result.loanInfo.monthlyPaymentMin)}</div>
            <div>• 금리 4.5% 시: {formatWon(result.loanInfo.monthlyPaymentMax)}</div>
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

        {/* Government Loans */}
        <ResultCard
          title="추천 정부 대출 상품"
          icon="🏦"
          className="from-emerald-600 to-teal-600"
        >
          <div className="space-y-2">
            {result.governmentLoans.map((loan) => (
              <div
                key={loan.name}
                className={`text-sm p-2 rounded ${
                  loan.eligible
                    ? 'bg-white bg-opacity-20'
                    : 'opacity-50 line-through'
                }`}
              >
                <div className="font-semibold">{loan.name}</div>
                {loan.eligible && (
                  <div className="text-xs opacity-90">{loan.interestRate}</div>
                )}
              </div>
            ))}
          </div>
        </ResultCard>
      </div>

      {/* Full Width: Government Loan Comparison */}
      <div className="rounded-lg border border-gray-200 p-6 overflow-x-auto">
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

      {/* Regional Feasibility */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-lg mb-4">지역별 구매 가능성</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.regionalFeasibility.map((region) => (
            <div
              key={region.region}
              className={`p-4 rounded-lg border-2 ${
                region.feasible
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="font-semibold mb-2">{region.region}</div>
              <div className="text-sm space-y-1">
                <div>• LTV: {(region.ltvFirst * 100).toFixed(0)}%</div>
                <div>
                  • 최대: {formatPrice(region.maxPriceByLTV)}
                </div>
                <div className={`font-medium ${region.feasible ? 'text-green-600' : 'text-gray-600'}`}>
                  {region.reason}
                </div>
              </div>
            </div>
          ))}
        </div>
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

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-xs text-gray-700">
        <div className="font-semibold mb-2">⚠️ 참고사항</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>본 계산기는 참고용이며, 정확한 금액은 금융기관과 상담 후 확인하세요.</li>
          <li>금리, 대출한도, 세제혜택은 정책 변경에 따라 달라질 수 있습니다.</li>
          <li>생애최초 감면은 소정의 요건 확인 후 적용됩니다.</li>
          <li>DSR 및 DTI 규제는 금융기관별로 상이할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
}
