import { memo } from 'react';
import type { ReactNode } from 'react';
import type { ColumnMeta, ColumnType } from '../../types/dataset';

interface ChartCardProps {
  column: ColumnMeta;
  children: ReactNode;
  onFocus?: (columnName: string) => void;
}

const TYPE_BADGE_CLASS: Record<ColumnType, string> = {
  numeric: 'bg-primary-light text-primary-hover',
  categorical: 'bg-slate-50 text-slate-600',
  datetime: 'bg-sky-50 text-sky-700',
  text: 'bg-border-light text-text-muted',
};

const TYPE_LABEL: Record<ColumnType, string> = {
  numeric: '수치형',
  categorical: '범주형',
  datetime: '날짜형',
  text: '텍스트',
};

export const ChartCard = memo(function ChartCard({
  column,
  children,
  onFocus,
}: ChartCardProps) {
  const badgeClass = TYPE_BADGE_CLASS[column.type];

  return (
    <div
      id={`chart-${column.name}`}
      className="bg-surface-raised border border-border rounded-lg overflow-hidden h-[300px] flex flex-col hover:shadow-sm hover:border-primary/30 transition-all"
    >
      {/* Header */}
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 border-b border-border-light cursor-pointer hover:bg-surface transition-colors text-left w-full focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
        onClick={() => onFocus?.(column.name)}
        aria-label={`${column.name} 차트로 이동`}
      >
        <span className="font-semibold text-sm text-text truncate flex-1">
          {column.name}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badgeClass}`}
        >
          {TYPE_LABEL[column.type]}
        </span>
      </button>

      {/* Chart body */}
      <div className="flex-1 overflow-hidden p-1">
        {children}
      </div>
    </div>
  );
});
