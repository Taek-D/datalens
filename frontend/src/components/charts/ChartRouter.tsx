import { memo } from 'react';
import type { ComponentType } from 'react';
import type { ColumnMeta, ColumnType } from '../../types/dataset';
import type { ChartProps } from './HistogramChart';
import { HistogramChart } from './HistogramChart';
import { BarChartComponent } from './BarChartComponent';
import { TimeseriesChart } from './TimeseriesChart';
import { TextColumnPlaceholder } from './TextColumnPlaceholder';

export const CHART_MAP: Record<ColumnType, ComponentType<ChartProps>> = {
  numeric: HistogramChart,
  categorical: BarChartComponent,
  datetime: TimeseriesChart,
  text: TextColumnPlaceholder,
};

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
