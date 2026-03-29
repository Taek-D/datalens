import { memo } from 'react';
import type { ReactNode } from 'react';
import type { ColumnMeta, ColumnType } from '../../types/dataset';

interface ChartCardProps {
  column: ColumnMeta;
  children: ReactNode;
  onFocus?: (columnName: string) => void;
}

const TYPE_BADGE_CLASS: Record<ColumnType, string> = {
  numeric: 'bg-blue-100 text-blue-700',
  categorical: 'bg-purple-100 text-purple-700',
  datetime: 'bg-green-100 text-green-700',
  text: 'bg-gray-100 text-gray-700',
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
      className="bg-white border border-gray-200 rounded-lg overflow-hidden h-[300px] flex flex-col"
    >
      {/* Header */}
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors text-left w-full"
        onClick={() => onFocus?.(column.name)}
      >
        <span className="font-semibold text-sm text-gray-800 truncate flex-1">
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
