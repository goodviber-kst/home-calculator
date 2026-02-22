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
    applicantIncome: 400,
    spouseIncome: 0,
    savings: 5000,
    parentGift: 0,
    otherAssets: 0,
    emergencyFund: 1000,
    interiorCost: 1000,
    movingCost: 100,
    targetRegion: 'gyeonggi',
    loanTermYears: 30,
  });

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
            ? Number(value)
            : value,
    }));

    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!input.applicantIncome || input.applicantIncome <= 0) {
      setError('신청자 월소득을 입력해주세요.');
      return;
    }

    if (input.isCouple && (!input.spouseIncome || input.spouseIncome < 0)) {
      setError('배우자 월소득을 입력해주세요.');
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              신청자 월소득 (만원)*
            </label>
            <input
              type="number"
              name="applicantIncome"
              value={input.applicantIncome}
              onChange={handleChange}
              min="0"
              step="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 400"
            />
          </div>

          {input.isCouple && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                배우자 월소득 (만원)
              </label>
              <input
                type="number"
                name="spouseIncome"
                value={input.spouseIncome}
                onChange={handleChange}
                min="0"
                step="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 300"
              />
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
              현재 저축액
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
          </div>
        </div>
      </div>

      {/* Section 3: Additional Costs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
            3
          </span>
          추가 비용 (만원)
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              여유자금 (기본값: 1,000만원)
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
              이사비 (기본값: 100만원)
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
