import { memo, useCallback } from 'react';
import { useStore } from '../../store';
import { ChartCard } from '../charts/ChartCard';
import { ChartRouter } from '../charts/ChartRouter';
import { useChartData } from '../../hooks/useChartData';
import type { ColumnMeta } from '../../types/dataset';

interface ColumnChartRowProps {
  column: ColumnMeta;
  onFocus: (columnName: string) => void;
}

// Separate component per column so each useChartData call is isolated
const ColumnChartRow = memo(function ColumnChartRow({
  column,
  onFocus,
}: ColumnChartRowProps) {
  const data = useChartData(column.name);

  return (
    <ChartCard column={column} onFocus={onFocus}>
      <ChartRouter column={column} data={data} />
    </ChartCard>
  );
});

export const DistributionGrid = memo(function DistributionGrid() {
  const columns = useStore((s) => s.columns);

  const handleColumnFocus = useCallback((columnName: string) => {
    document
      .getElementById(`chart-${columnName}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  if (columns.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3 text-text">분포 차트</h2>
        <p className="text-sm text-text-subtle">
          데이터를 업로드하면 각 컬럼의 분포 차트가 여기에 표시됩니다.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 text-text">분포 차트</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {columns.map((col) => (
          <ColumnChartRow
            key={col.name}
            column={col}
            onFocus={handleColumnFocus}
          />
        ))}
      </div>
    </section>
  );
});
