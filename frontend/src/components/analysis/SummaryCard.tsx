import React from 'react';
import { useStore } from '../../store';

interface StatCardProps {
  label: string;
  value: string;
  valueClassName?: string;
}

const StatCard = React.memo(function StatCard({ label, value, valueClassName }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClassName ?? 'text-gray-900'}`}>{value}</p>
    </div>
  );
});

function getMissingRatioColor(ratio: number): string {
  if (ratio < 0.05) return 'text-green-600';
  if (ratio <= 0.2) return 'text-yellow-600';
  return 'text-red-600';
}

export const SummaryCard = React.memo(function SummaryCard() {
  const analysisResult = useStore((s) => s.analysisResult);

  if (!analysisResult) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">데이터 개요</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['행 수', '컬럼 수', '결측 비율', '중복 행'].map((label) => (
            <div key={label} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-300">-</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { row_count, column_count, missing_ratio, duplicate_count } = analysisResult;
  const missingPercent = (missing_ratio * 100).toFixed(1) + '%';
  const missingColor = getMissingRatioColor(missing_ratio);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3 text-gray-800">데이터 개요</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="행 수" value={row_count.toLocaleString()} />
        <StatCard label="컬럼 수" value={column_count.toLocaleString()} />
        <StatCard label="결측 비율" value={missingPercent} valueClassName={missingColor} />
        <StatCard label="중복 행" value={duplicate_count.toLocaleString()} />
      </div>
    </div>
  );
});
