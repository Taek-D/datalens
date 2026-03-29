import { memo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { ChartProps } from './HistogramChart';

interface DateCount {
  date: string;
  count: number;
}

function aggregateByDate(
  data: Record<string, unknown>[],
  columnName: string,
): DateCount[] {
  const freq: Record<string, number> = {};

  for (const row of data) {
    const val = row[columnName];
    if (val === null || val === undefined) continue;
    const d = new Date(String(val));
    if (isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    freq[key] = (freq[key] ?? 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
}

function formatDateKo(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export const TimeseriesChart = memo(function TimeseriesChart({
  columnName,
  data,
}: ChartProps) {
  const aggregated = aggregateByDate(data, columnName);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={aggregated}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          tickFormatter={formatDateKo}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 10 }} width={35} />
        <Tooltip
          formatter={(value: unknown) => [Number(value), '건수']}
          labelFormatter={(label: unknown) => formatDateKo(String(label))}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#00C73C"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});
