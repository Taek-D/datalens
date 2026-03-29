import React from 'react';
import { useStore } from '../../store';

interface StatCardProps {
  label: string;
  value: string;
  description?: string;
  variant?: 'primary' | 'default';
  valueClassName?: string;
}

const StatCard = React.memo(function StatCard({ label, value, description, variant = 'default', valueClassName }: StatCardProps) {
  if (variant === 'primary') {
    return (
      <div className="bg-gradient-to-br from-primary to-[#009E30] rounded-xl p-5 text-white hover:shadow-lg hover:shadow-primary/20 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-white/80">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
        </div>
        {description && <p className="text-xs text-white/60 mt-3">{description}</p>}
      </div>
    );
  }

  return (
    <div className="bg-surface-raised border border-border rounded-xl p-5 hover:shadow-sm hover:border-primary/20 transition-all">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-text-muted">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${valueClassName ?? 'text-text'}`}>{value}</p>
        </div>
        <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
        </div>
      </div>
      {description && <p className="text-xs text-text-subtle mt-3">{description}</p>}
    </div>
  );
});

function SkeletonCard() {
  return (
    <div className="bg-surface-raised border border-border rounded-xl p-5">
      <div className="flex justify-between items-start">
        <div>
          <div className="h-3 w-14 bg-border-light rounded animate-skeleton" />
          <div className="h-8 w-20 bg-border-light rounded animate-skeleton mt-2" />
        </div>
        <div className="w-10 h-10 bg-border-light rounded-full animate-skeleton" />
      </div>
      <div className="h-2.5 w-24 bg-border-light rounded animate-skeleton mt-4" />
    </div>
  );
}

function getMissingRatioColor(ratio: number): string {
  if (ratio < 0.05) return 'text-success';
  if (ratio <= 0.2) return 'text-warning';
  return 'text-error';
}

function getMissingDescription(ratio: number): string {
  if (ratio < 0.05) return '양호한 데이터 품질';
  if (ratio <= 0.2) return '일부 결측값 존재';
  return '결측값 비율이 높음';
}

export const SummaryCard = React.memo(function SummaryCard() {
  const analysisResult = useStore((s) => s.analysisResult);

  if (!analysisResult) {
    return (
      <div id="overview" className="scroll-mt-20">
        <h2 className="text-lg font-semibold mb-4 text-text">데이터 개요</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const { row_count, column_count, missing_ratio, duplicate_count } = analysisResult;
  const missingPercent = (missing_ratio * 100).toFixed(1) + '%';

  return (
    <div id="overview" className="scroll-mt-20">
      <h2 className="text-lg font-semibold mb-4 text-text">데이터 개요</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard
          label="행 수"
          value={row_count.toLocaleString()}
          description="전체 데이터 행 수"
          variant="primary"
        />
        <StatCard
          label="컬럼 수"
          value={column_count.toLocaleString()}
          description="분석 대상 컬럼"
        />
        <StatCard
          label="결측 비율"
          value={missingPercent}
          valueClassName={getMissingRatioColor(missing_ratio)}
          description={getMissingDescription(missing_ratio)}
        />
        <StatCard
          label="중복 행"
          value={duplicate_count.toLocaleString()}
          description={duplicate_count > 0 ? '중복 데이터 존재' : '중복 없음'}
        />
      </div>
    </div>
  );
});
