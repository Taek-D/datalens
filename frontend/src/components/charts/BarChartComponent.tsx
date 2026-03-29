import { memo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { ChartProps } from './HistogramChart';

interface CategoryCount {
  category: string;
  count: number;
}

function topCategories(
  data: Record<string, unknown>[],
  columnName: string,
  limit = 20,
): CategoryCount[] {
  const freq: Record<string, number> = {};

  for (const row of data) {
    const val = row[columnName];
    if (val === null || val === undefined) continue;
    const key = String(val);
    freq[key] = (freq[key] ?? 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category, count]) => ({ category, count }));
}

export const BarChartComponent = memo(function BarChartComponent({
  columnName,
  data,
}: ChartProps) {
  const top20 = topCategories(data, columnName);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={top20} layout="horizontal">
        <XAxis
          dataKey="category"
          tick={{ fontSize: 10 }}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={50}
        />
        <YAxis tick={{ fontSize: 10 }} width={35} />
        <Tooltip
          formatter={(value: number) => [value, '빈도']}
          labelFormatter={(label: string) => `범주: ${label}`}
        />
        <Bar dataKey="count" fill="#8b5cf6" />
      </BarChart>
    </ResponsiveContainer>
  );
});
