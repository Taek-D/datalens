import { memo } from 'react';
import type { ColumnMeta } from '../../types/dataset';
import { CHART_MAP } from './chartMap';

interface ChartRouterProps {
  column: ColumnMeta;
  data: Record<string, unknown>[];
}

export const ChartRouter = memo(function ChartRouter({
  column,
  data,
}: ChartRouterProps) {
  const ChartComponent = CHART_MAP[column.type];
  return <ChartComponent columnName={column.name} data={data} />;
});
