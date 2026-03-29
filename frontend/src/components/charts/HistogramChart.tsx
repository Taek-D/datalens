import { memo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export interface ChartProps {
  columnName: string;
  data: Record<string, unknown>[];
}

interface BinData {
  label: string;
  count: number;
}

function binData(values: number[], binCount = 20): BinData[] {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return [{ label: String(min), count: values.length }];
  }

  const binWidth = (max - min) / binCount;
  const bins: BinData[] = Array.from({ length: binCount }, (_, i) => ({
    label: (min + i * binWidth).toFixed(2),
    count: 0,
  }));

  for (const v of values) {
    const idx = Math.min(
      Math.floor((v - min) / binWidth),
      binCount - 1,
    );
    bins[idx].count += 1;
  }

  return bins;
}

export const HistogramChart = memo(function HistogramChart({
  columnName,
  data,
}: ChartProps) {
  const values: number[] = data
    .map((row) => row[columnName])
    .filter((v): v is number => v !== null && v !== undefined && !isNaN(Number(v)))
    .map(Number);

  const binnedData = binData(values);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={binnedData} barCategoryGap={0}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 10 }} width={35} />
        <Tooltip
          formatter={(value: number) => [value, '빈도']}
          labelFormatter={(label: string) => `구간: ${label}`}
        />
        <Bar dataKey="count" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
});
