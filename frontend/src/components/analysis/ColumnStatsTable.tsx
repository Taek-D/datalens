import React from 'react';
import { useStore } from '../../store';
import type { SummaryStats } from '../../types/analysis';

function fmt(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return value.toFixed(2);
}

interface RowProps {
  columnName: string;
  stats: SummaryStats;
  isEven: boolean;
}

const StatsRow = React.memo(function StatsRow({ columnName, stats, isEven }: RowProps) {
  const rowClass = isEven ? 'bg-surface-raised' : 'bg-surface';
  return (
    <tr className={`${rowClass} transition-colors hover:bg-primary-light/40`}>
      <td className="px-3 py-2 font-medium text-text whitespace-nowrap">{columnName}</td>
      <td className="px-3 py-2 text-right text-text-muted">{fmt(stats.mean)}</td>
      <td className="px-3 py-2 text-right text-text-muted">{fmt(stats.std)}</td>
      <td className="px-3 py-2 text-right text-text-muted">{fmt(stats.min)}</td>
      <td className="px-3 py-2 text-right text-text-muted">{fmt(stats.max)}</td>
      <td className="px-3 py-2 text-right text-text-muted">{fmt(stats.q1)}</td>
      <td className="px-3 py-2 text-right text-text-muted">{fmt(stats.median)}</td>
      <td className="px-3 py-2 text-right text-text-muted">{fmt(stats.q3)}</td>
      <td className="px-3 py-2 text-right text-text-muted">{fmt(stats.skewness)}</td>
    </tr>
  );
});

export const ColumnStatsTable = React.memo(function ColumnStatsTable() {
  const summary = useStore((s) => s.analysisResult?.summary);

  if (!summary) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-text">컬럼별 통계</h2>
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-surface px-3 py-2">
            <div className="h-4 w-20 bg-border-light rounded animate-skeleton" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-4 px-3 py-3 border-t border-border-light">
              <div className="h-3 w-16 bg-border-light rounded animate-skeleton" />
              <div className="h-3 w-12 bg-border-light rounded animate-skeleton" />
              <div className="h-3 w-12 bg-border-light rounded animate-skeleton" />
              <div className="h-3 w-12 bg-border-light rounded animate-skeleton" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (Object.keys(summary).length === 0) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-text">컬럼별 통계</h2>
        <p className="text-sm text-text-subtle">수치형 컬럼이 없습니다.</p>
      </div>
    );
  }

  const entries = Object.entries(summary);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3 text-text">컬럼별 통계</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-surface text-left">
              <th className="px-3 py-2 font-semibold text-text">컬럼명</th>
              <th className="px-3 py-2 font-semibold text-text text-right">평균</th>
              <th className="px-3 py-2 font-semibold text-text text-right">표준편차</th>
              <th className="px-3 py-2 font-semibold text-text text-right">최소</th>
              <th className="px-3 py-2 font-semibold text-text text-right">최대</th>
              <th className="px-3 py-2 font-semibold text-text text-right">Q1</th>
              <th className="px-3 py-2 font-semibold text-text text-right">중앙값</th>
              <th className="px-3 py-2 font-semibold text-text text-right">Q3</th>
              <th className="px-3 py-2 font-semibold text-text text-right">왜도</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([colName, stats], index) => (
              <StatsRow
                key={colName}
                columnName={colName}
                stats={stats}
                isEven={index % 2 === 0}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
