import type { ComponentType } from 'react';
import type { ColumnType } from '../../types/dataset';
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
