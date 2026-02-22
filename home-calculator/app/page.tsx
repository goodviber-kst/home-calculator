'use client';

import { useState } from 'react';
import HomeForm from '@/components/HomeForm';
import HomeResults from '@/components/HomeResults';
import { CalculationResult } from '@/lib/types';

export default function Home() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (result: CalculationResult) => {
    setResult(result);
    setIsLoading(false);
    // Scroll to results
    setTimeout(() => {
      document.querySelector('#results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="space-y-12">
      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <HomeForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>

      {/* Results Section */}
      {result && (
        <div id="results" className="scroll-mt-8">
          <HomeResults result={result} />
        </div>
      )}

      {/* Info Section */}
      {!result && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">💡 이 계산기에서 할 수 있는 것</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <ul className="space-y-2 list-disc list-inside">
              <li>구매 가능 가격대 확인 (보수적/권장/낙관적)</li>
              <li>최대 대출 가능액 계산 (LTV vs DSR)</li>
              <li>월 예상 상환액 산출</li>
            </ul>
            <ul className="space-y-2 list-disc list-inside">
              <li>취득세 및 생애최초 감면액 계산</li>
              <li>정부 대출 상품 적격성 판단</li>
              <li>지역별 구매 가능성 검토</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
