import React from 'react';
import { useStore } from '../../store';

interface StatCardProps {
  label: string;
  value: string;
  valueClassName?: string;
}

const StatCard = React.memo(function StatCard({ label, value, valueClassName }: StatCardProps) {
  return (
    <div className="bg-surface-raised border border-border rounded-lg p-4 hover:shadow-sm hover:border-primary/30 transition-all">
      <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClassName ?? 'text-text'}`}>{value}</p>
    </div>
  );
});

function SkeletonCard() {
  return (
    <div className="bg-surface-raised border border-border rounded-lg p-4">
      <div className="h-3 w-12 bg-border-light rounded animate-skeleton mb-2" />
      <div className="h-7 w-16 bg-border-light rounded animate-skeleton" />
    </div>
  );
}

function getMissingRatioColor(ratio: number): string {
  if (ratio < 0.05) return 'text-success';
  if (ratio <= 0.2) return 'text-warning';
  return 'text-error';
}

export const SummaryCard = React.memo(function SummaryCard() {
  const analysisResult = useStore((s) => s.analysisResult);

  if (!analysisResult) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-text">데이터 개요</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
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
      <h2 className="text-lg font-semibold mb-3 text-text">데이터 개요</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="행 수" value={row_count.toLocaleString()} />
        <StatCard label="컬럼 수" value={column_count.toLocaleString()} />
        <StatCard label="결측 비율" value={missingPercent} valueClassName={missingColor} />
        <StatCard label="중복 행" value={duplicate_count.toLocaleString()} />
      </div>
    </div>
  );
});
