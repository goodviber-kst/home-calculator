'use client';

import { FormEvent, useState } from 'react';
import { HomeCalculatorInput, CalculationResult } from '@/lib/types';

interface HomeFormProps {
  onSubmit: (result: CalculationResult) => void;
  isLoading?: boolean;
}

export default function HomeForm({ onSubmit, isLoading = false }: HomeFormProps) {
  const [input, setInput] = useState<HomeCalculatorInput>({
    isCouple: false,
    applicantIncome: 300, // 세후 월 300만원
    applicantPreTaxAnnual: 5000, // 세전 연봉 5000만원
    spouseIncome: 0,
    spousePreTaxAnnual: 0,
    savings: 5000,
    parentGift: 0,
    otherAssets: 0,
    emergencyFund: 1000,
    interiorCost: 1000,
    movingCost: 100,
    targetRegion: 'gyeonggi',
    loanTermYears: 30,
    useLifestyleLoan: false,
    creditScore: 700, // 기본 신용점수
  });

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Remove leading zeros but allow single "0"
    const cleaned = value === '' ? '' : String(parseInt(value) || 0);
    return cleaned;
  };

  const [error, setError] = useState<string>('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, type, value } = e.target;

    setInput((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? value === '' ? 0 : Math.max(0, parseInt(value) || 0)
            : value,
    }));

    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!input.applicantIncome || input.applicantIncome <= 0) {
      setError('신청자 세후 월소득을 입력해주세요.');
      return;
    }

    if (!input.applicantPreTaxAnnual || input.applicantPreTaxAnnual <= 0) {
      setError('신청자 세전 연봉을 입력해주세요.');
      return;
    }

    if (input.isCouple && (!input.spouseIncome || input.spouseIncome <= 0)) {
      setError('배우자 세후 월소득을 입력해주세요.');
      return;
    }

    if (input.isCouple && (!input.spousePreTaxAnnual || input.spousePreTaxAnnual <= 0)) {
      setError('배우자 세전 연봉을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || '계산에 실패했습니다.');
        return;
      }

      const result: CalculationResult = await response.json();
      onSubmit(result);
    } catch (err) {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Personal Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
            1
          </span>
          개인 정보
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isCouple"
                checked={input.isCouple}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
              />
              <span className="text-sm font-medium">부부 합산 계산</span>
            </label>
          </div>

          {/* 신청자 소득 */}
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm font-semibold text-gray-700">신청자 소득</div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                세후 월소득 (만원)*
              </label>
              <input
                type="number"
                name="applicantIncome"
                value={input.applicantIncome}
                onChange={handleChange}
                min="0"
                step="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 300"
              />
              <p className="text-xs text-gray-500 mt-1">실수령액 (세금 제외)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                세전 연봉 (만원)*
              </label>
              <input
                type="number"
                name="applicantPreTaxAnnual"
                value={input.applicantPreTaxAnnual}
                onChange={handleChange}
                min="0"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 5000"
              />
              <p className="text-xs text-gray-500 mt-1">세전 연간 급여 (DSR 계산용)</p>
            </div>
          </div>

          {input.isCouple && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-semibold text-gray-700">배우자 소득</div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  세후 월소득 (만원)
                </label>
                <input
                  type="number"
                  name="spouseIncome"
                  value={input.spouseIncome}
                  onChange={handleChange}
                  min="0"
                  step="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 250"
                />
                <p className="text-xs text-gray-500 mt-1">실수령액 (세금 제외)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  세전 연봉 (만원)
                </label>
                <input
                  type="number"
                  name="spousePreTaxAnnual"
                  value={input.spousePreTaxAnnual}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 4000"
                />
                <p className="text-xs text-gray-500 mt-1">세전 연간 급여 (DSR 계산용)</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Assets */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
            2
          </span>
          보유 자산 (만원)
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              현재 저축액 (현금화 가능 자산)
            </label>
            <input
              type="number"
              name="savings"
              value={input.savings}
              onChange={handleChange}
              min="0"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 5000"
            />
            <p className="text-xs text-gray-500 mt-1">예: 은행 예금, 매도 가능 주식, 정기예금 등</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              부모 증여 가능액
            </label>
            <input
              type="number"
              name="parentGift"
              value={input.parentGift}
              onChange={handleChange}
              min="0"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 3000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              기타 자산
            </label>
            <input
              type="number"
              name="otherAssets"
              value={input.otherAssets}
              onChange={handleChange}
              min="0"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 0"
            />
            <p className="text-xs text-gray-500 mt-1">예: 자동차, 보험 환급금, 상속 예정액 등</p>
          </div>
        </div>
      </div>

      {/* Section 3: Contingency Costs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
            3
          </span>
          여유 비용 (만원)
        </h2>
        <p className="text-sm text-gray-600 mb-4">예측하지 못한 비용을 대비하기 위해 미리 남겨둘 금액입니다. (취득세 포함)</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              긴급 자금 (기본값: 1,000만원)
            </label>
            <input
              type="number"
              name="emergencyFund"
              value={input.emergencyFund}
              onChange={handleChange}
              min="0"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">계약금 미지급, 긴급 수리 등에 대비한 여유자금</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              인테리어 비용 (기본값: 1,000만원)
            </label>
            <input
              type="number"
              name="interiorCost"
              value={input.interiorCost}
              onChange={handleChange}
              min="0"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이사 및 생활용품 비용 (기본값: 100만원)
            </label>
            <input
              type="number"
              name="movingCost"
              value={input.movingCost}
              onChange={handleChange}
              min="0"
              step="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Region & Loan */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
            4
          </span>
          지역 및 대출 조건
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              목표 지역
            </label>
            <select
              name="targetRegion"
              value={input.targetRegion}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="seoul">서울 (투기과열)</option>
              <option value="gyeonggi">경기 (조정대상)</option>
              <option value="metropolitan">광역시 (조정)</option>
              <option value="other">그외지방 (비규제)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              대출 기간
            </label>
            <select
              name="loanTermYears"
              value={input.loanTermYears}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10년</option>
              <option value={15}>15년</option>
              <option value={20}>20년</option>
              <option value={30}>30년</option>
            </select>
          </div>
        </div>

        {/* Interest Rate Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-semibold text-blue-900 mb-3">📊 현재 주요 금리 안내 (2025-2026 기준)</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="border border-blue-300 rounded px-2 py-2">
              <div className="text-blue-900 font-medium">디딤돌 대출</div>
              <div className="text-blue-700">2.65% ~ 3.95%</div>
            </div>
            <div className="border border-blue-300 rounded px-2 py-2">
              <div className="text-blue-900 font-medium">보금자리론</div>
              <div className="text-blue-700">3.8%</div>
            </div>
            <div className="border border-blue-300 rounded px-2 py-2">
              <div className="text-blue-900 font-medium">일반 주담대</div>
              <div className="text-blue-700">4.0% ~ 5.5%</div>
            </div>
            <div className="border border-blue-300 rounded px-2 py-2">
              <div className="text-blue-900 font-medium">계산기 기준</div>
              <div className="text-blue-700">3.3% ~ 4.5%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Credit Loan (영끌) */}
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
            5
          </span>
          신용대출 (영끌 옵션)
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-red-100 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="useLifestyleLoan"
                checked={input.useLifestyleLoan}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
              />
              <span className="text-sm font-medium">신용대출 포함 (영끌)</span>
            </label>
            <span className="text-xs text-gray-600">⚠️ 높은 부채 비율</span>
          </div>

          {input.useLifestyleLoan && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                신용점수 (300-950)
              </label>
              <input
                type="number"
                name="creditScore"
                value={input.creditScore}
                onChange={handleChange}
                min="300"
                max="950"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="예: 700"
              />
              <p className="text-xs text-gray-500 mt-1">
                점수가 높을수록 신용대출 한도 증가 (800+: 1억, 750-799: 8000만, 700-749: 6000만)
              </p>
            </div>
          )}

          <div className="p-3 bg-white rounded border border-red-200 text-xs text-gray-700">
            <div className="font-semibold mb-2">📌 신용대출 정보</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>한도: 신용점수와 연봉 기준으로 결정</li>
              <li>금리: 약 5% (변동금리)</li>
              <li>기간: 10년 고정</li>
              <li>제한: 다주택자는 불가</li>
              <li>주의: 과도한 영끌은 금융 위험</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '계산 중...' : '내 구매력 계산하기'}
      </button>
    </form>
  );
}
