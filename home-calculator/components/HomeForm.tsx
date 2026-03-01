'use client';

import { FormEvent, useState } from 'react';
import { HomeCalculatorInput, CalculationResult } from '@/lib/types';

interface HomeFormProps {
  onSubmit: (result: CalculationResult) => void;
  isLoading?: boolean;
}

// ─── MoneyField 컴포넌트 (억 미리보기 + 퀵버튼) ───────────────────────────
function MoneyField({
  label,
  name,
  value,
  onChange,
  required = false,
  hint,
  presets = [1000, 5000, 10000, 50000],
}: {
  label: string;
  name: string;
  value: number;
  onChange: (name: string, value: number) => void;
  required?: boolean;
  hint?: string;
  presets?: number[];
}) {
  const eok = Math.floor(value / 10000);
  const man = value % 10000;
  const preview =
    value === 0
      ? ''
      : eok === 0
        ? `${man.toLocaleString()}만원`
        : man === 0
          ? `${eok}억원`
          : `${eok}억 ${man.toLocaleString()}만원`;

  const fmtBtn = (n: number) =>
    n >= 10000
      ? `+${n / 10000}억`
      : n >= 1000
        ? `+${n / 1000}천만`
        : `+${n}만`;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative flex items-center">
        <input
          type="number"
          name={name}
          value={value || ''}
          onChange={(e) => onChange(name, Math.max(0, parseInt(e.target.value) || 0))}
          min="0"
          className="w-full px-3 py-2 pr-14 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right tabular-nums"
          placeholder="0"
        />
        <span className="absolute right-3 text-sm text-gray-400 pointer-events-none">만원</span>
      </div>
      {preview && <p className="text-xs font-semibold text-blue-600 pl-1">= {preview}</p>}
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(name, value + p)}
            className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 rounded transition-colors"
          >
            {fmtBtn(p)}
          </button>
        ))}
        {value > 0 && (
          <button
            type="button"
            onClick={() => onChange(name, 0)}
            className="text-xs px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded transition-colors"
          >
            초기화
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ─── 섹션 헤더 ─────────────────────────────────────────────────────────────
function SectionHeader({
  num,
  color,
  title,
}: {
  num: number;
  color: string;
  title: string;
}) {
  return (
    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <span
        className={`${color} text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0`}
      >
        {num}
      </span>
      {title}
    </h2>
  );
}

// ─── 메인 폼 ───────────────────────────────────────────────────────────────
export default function HomeForm({ onSubmit, isLoading = false }: HomeFormProps) {
  const [input, setInput] = useState<HomeCalculatorInput>({
    isCouple: false,
    applicantIncome: 400,
    applicantPreTaxAnnual: 5000,
    spouseIncome: 0,
    spousePreTaxAnnual: 0,
    savings: 30000,
    parentGift: 0,
    otherAssets: 0,
    emergencyFund: 1000,
    interiorCost: 1000,
    movingCost: 100,
    targetRegion: 'seoul',
    loanTermYears: 30,
    useLifestyleLoan: false,
    creditScore: 700,
    useSpouseCreditLoan: false,
    spouseCreditScore: 700,
    interestRate: 4.0,
    targetPropertyPrice: 0,
  });

  const [error, setError] = useState('');

  // 일반 필드 (select, checkbox, range)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target;
    setInput((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number' || type === 'range'
            ? value === ''
              ? 0
              : parseFloat(value) || 0
            : value,
    }));
    setError('');
  };

  // 만원 단위 금액 필드
  const handleMoney = (name: string, value: number) => {
    setInput((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!input.applicantIncome || input.applicantIncome <= 0) {
      setError('신청자 세후 월소득을 입력해주세요.');
      return;
    }
    if (!input.applicantPreTaxAnnual || input.applicantPreTaxAnnual <= 0) {
      setError('신청자 세전 연봉을 입력해주세요.');
      return;
    }
    if (input.isCouple) {
      if (!input.spouseIncome || input.spouseIncome <= 0) {
        setError('배우자 세후 월소득을 입력해주세요.');
        return;
      }
      if (!input.spousePreTaxAnnual || input.spousePreTaxAnnual <= 0) {
        setError('배우자 세전 연봉을 입력해주세요.');
        return;
      }
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
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── TOP: 공동명의 여부 ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-5">
        <h2 className="text-base font-semibold text-blue-900 mb-3">명의 구조</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setInput((p) => ({ ...p, isCouple: false }))}
            className={`py-3 rounded-lg border-2 font-medium text-sm transition-all ${
              !input.isCouple
                ? 'border-blue-500 bg-blue-500 text-white shadow'
                : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
            }`}
          >
            단독 명의
          </button>
          <button
            type="button"
            onClick={() => setInput((p) => ({ ...p, isCouple: true }))}
            className={`py-3 rounded-lg border-2 font-medium text-sm transition-all ${
              input.isCouple
                ? 'border-blue-500 bg-blue-500 text-white shadow'
                : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
            }`}
          >
            공동명의 (부부합산)
          </button>
        </div>
        {input.isCouple && (
          <p className="text-xs text-blue-700 mt-2">
            부부 합산 소득으로 DSR·생애최초 자격을 계산합니다.
          </p>
        )}
      </div>

      {/* ── TOP: 목표 주택 가격 (선택) ──────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          목표 주택 가격{' '}
          <span className="text-xs font-normal text-gray-400">(선택 — 입력 시 달성 가능 여부 분석)</span>
        </h2>
        <MoneyField
          label=""
          name="targetPropertyPrice"
          value={input.targetPropertyPrice}
          onChange={handleMoney}
          presets={[30000, 50000, 80000, 100000, 150000]}
          hint="예: 10억 = 100000 입력"
        />
      </div>

      {/* ── Section 1: 소득 ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <SectionHeader num={1} color="bg-blue-600" title="소득 정보" />

        {/* 신청자 */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-semibold text-gray-700">
            {input.isCouple ? '신청자 소득' : '본인 소득'}
          </div>
          <MoneyField
            label="세후 월소득*"
            name="applicantIncome"
            value={input.applicantIncome}
            onChange={handleMoney}
            required
            presets={[50, 100, 200, 300]}
            hint="실수령액 (세금 제외)"
          />
          <MoneyField
            label="세전 연봉*"
            name="applicantPreTaxAnnual"
            value={input.applicantPreTaxAnnual}
            onChange={handleMoney}
            required
            presets={[500, 1000, 2000, 5000]}
            hint="DSR·생애최초 자격 계산에 사용"
          />
        </div>

        {/* 배우자 — 공동명의 시 */}
        {input.isCouple && (
          <div className="space-y-4 mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-semibold text-blue-800">배우자 소득</div>
            <MoneyField
              label="세후 월소득*"
              name="spouseIncome"
              value={input.spouseIncome}
              onChange={handleMoney}
              required
              presets={[50, 100, 200, 300]}
              hint="실수령액 (세금 제외)"
            />
            <MoneyField
              label="세전 연봉*"
              name="spousePreTaxAnnual"
              value={input.spousePreTaxAnnual}
              onChange={handleMoney}
              required
              presets={[500, 1000, 2000, 5000]}
              hint="DSR 계산에 합산됩니다"
            />
          </div>
        )}
      </div>

      {/* ── Section 2: 자산 ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <SectionHeader num={2} color="bg-purple-600" title="보유 자산" />
        <div className="space-y-5">
          <MoneyField
            label="현재 저축액 (현금화 가능)"
            name="savings"
            value={input.savings}
            onChange={handleMoney}
            presets={[1000, 5000, 10000, 50000]}
            hint="예: 은행 예금, 매도 가능 주식, 정기예금"
          />
          <MoneyField
            label="부모 증여 가능액"
            name="parentGift"
            value={input.parentGift}
            onChange={handleMoney}
            presets={[5000, 10000, 20000, 50000]}
          />
          <MoneyField
            label="기타 자산"
            name="otherAssets"
            value={input.otherAssets}
            onChange={handleMoney}
            presets={[1000, 5000, 10000]}
            hint="예: 자동차, 보험 환급금, 상속 예정액"
          />
        </div>
      </div>

      {/* ── Section 3: 여유 비용 ─────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <SectionHeader num={3} color="bg-orange-600" title="여유 비용" />
        <p className="text-sm text-gray-500 mb-4">
          예상치 못한 지출 대비, 자산에서 먼저 차감합니다. (취득세는 자동 계산)
        </p>
        <div className="space-y-5">
          <MoneyField
            label="긴급 자금"
            name="emergencyFund"
            value={input.emergencyFund}
            onChange={handleMoney}
            presets={[500, 1000, 2000]}
            hint="계약금, 긴급 수리 등 대비"
          />
          <MoneyField
            label="인테리어 비용"
            name="interiorCost"
            value={input.interiorCost}
            onChange={handleMoney}
            presets={[500, 1000, 2000, 3000]}
          />
          <MoneyField
            label="이사 및 생활용품"
            name="movingCost"
            value={input.movingCost}
            onChange={handleMoney}
            presets={[50, 100, 200, 500]}
          />
        </div>
      </div>

      {/* ── Section 4: 대출 조건 ─────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <SectionHeader num={4} color="bg-emerald-600" title="대출 조건" />
        <div className="space-y-5">

          {/* 목표 지역 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">목표 지역</label>
            <select
              name="targetRegion"
              value={input.targetRegion}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="seoul">서울 (투기과열 — 생애최초 LTV 80%, 한도 6억)</option>
              <option value="gyeonggi">경기 (조정대상 — 생애최초 LTV 80%, 한도 6억)</option>
              <option value="metropolitan">광역시 (조정 — 생애최초 LTV 80%, 한도 6억)</option>
              <option value="other">그외지방 (비규제 — LTV 85%, 한도 없음)</option>
            </select>
          </div>

          {/* 대출 기간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대출 기간</label>
            <div className="grid grid-cols-4 gap-2">
              {([10, 15, 20, 30] as const).map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setInput((p) => ({ ...p, loanTermYears: y }))}
                  className={`py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    input.loanTermYears === y
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-gray-200 hover:border-emerald-300 text-gray-600'
                  }`}
                >
                  {y}년
                </button>
              ))}
            </div>
          </div>

          {/* 예상 금리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              예상 주담대 금리{' '}
              <span className="font-bold text-emerald-700">{input.interestRate.toFixed(1)}%</span>
            </label>
            <input
              type="range"
              name="interestRate"
              min="2.0"
              max="8.0"
              step="0.1"
              value={input.interestRate}
              onChange={handleChange}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>2.0%</span>
              <span>4.0%</span>
              <span>6.0%</span>
              <span>8.0%</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-3 text-xs text-center">
              {[
                { label: '디딤돌', range: '2.65~3.95%' },
                { label: '보금자리론', range: '3.8%' },
                { label: '일반 주담대', range: '4.0~5.5%' },
              ].map((item) => (
                <div key={item.label} className="border border-emerald-200 rounded px-2 py-1.5 bg-emerald-50">
                  <div className="text-emerald-900 font-medium">{item.label}</div>
                  <div className="text-emerald-700">{item.range}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 5: 신용대출 (영끌) ──────────────────────────────────── */}
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <SectionHeader num={5} color="bg-red-600" title="신용대출 (영끌 옵션)" />

        <div className="space-y-4">
          {/* 신청자 신용대출 토글 */}
          <div className="flex items-center gap-3 p-3 bg-red-100 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <input
                type="checkbox"
                name="useLifestyleLoan"
                checked={input.useLifestyleLoan}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
              />
              <span className="text-sm font-medium">신용대출 포함 (영끌)</span>
            </label>
            <span className="text-xs text-red-600">⚠️ 높은 부채 비율</span>
          </div>

          {input.useLifestyleLoan && (
            <>
              {/* 배우자 신용대출 — 공동명의 시 */}
              {input.isCouple && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      name="useSpouseCreditLoan"
                      checked={input.useSpouseCreditLoan}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">배우자 신용대출도 포함</span>
                  </label>

                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── 에러 메시지 ──────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* ── 계산 버튼 ────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-base"
      >
        {isLoading ? '계산 중...' : '내 구매력 계산하기'}
      </button>
    </form>
  );
}
