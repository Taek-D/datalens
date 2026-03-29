import { useMemo } from 'react';
import { useStore } from '../store';
import type { OutlierResult } from '../types/analysis';

/**
 * Returns filtered row data for a given column.
 * When showOutliers is false, rows whose index is in the column's outlier_indices are removed.
 * Uses fine-grained Zustand selectors to avoid unnecessary re-renders.
 */
export function useChartData(columnName: string): Record<string, unknown>[] {
  const rawData = useStore((s) => s.rawData);
  const showOutliers = useStore((s) => s.showOutliers);
  const outliers = useStore((s) => s.analysisResult?.outliers);

  return useMemo(() => {
    if (showOutliers || !outliers) {
      return rawData;
    }

    const outlierResult: OutlierResult | undefined = outliers.find(
      (o) => o.column === columnName,
    );

    if (!outlierResult || outlierResult.outlier_indices.length === 0) {
      return rawData;
    }

    const outlierSet = new Set(outlierResult.outlier_indices);
    return rawData.filter((_, idx) => !outlierSet.has(idx));
  }, [rawData, showOutliers, outliers, columnName]);
}
