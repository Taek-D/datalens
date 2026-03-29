import { memo } from 'react';
import type { ChartProps } from './HistogramChart';

export const TextColumnPlaceholder = memo(function TextColumnPlaceholder({
  columnName,
}: ChartProps) {
  return (
    <div className="flex items-center justify-center h-full text-text-subtle text-sm px-4 text-center">
      <span>
        <span className="font-medium text-text-muted">{columnName}</span> —
        텍스트 컬럼은 시각화를 지원하지 않습니다.
      </span>
    </div>
  );
});
