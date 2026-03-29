import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChartData } from '../useChartData';
import type { OutlierResult } from '../../types/analysis';

// Mock the Zustand store
vi.mock('../../store', () => ({
  useStore: vi.fn(),
}));

import { useStore } from '../../store';

const mockUseStore = vi.mocked(useStore) as unknown as ReturnType<typeof vi.fn>;

const rawData: Record<string, unknown>[] = [
  { age: 25, name: 'Alice' },
  { age: 30, name: 'Bob' },
  { age: 200, name: 'Outlier' }, // index 2 is an outlier
  { age: 22, name: 'Carol' },
  { age: 300, name: 'Outlier2' }, // index 4 is an outlier
];

const outliers: OutlierResult[] = [
  {
    column: 'age',
    lower_bound: 0,
    upper_bound: 100,
    outlier_count: 2,
    outlier_indices: [2, 4],
  },
];

describe('useChartData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns full rawData when showOutliers is true', () => {
    mockUseStore.mockImplementation((selector: (s: Record<string, unknown>) => unknown) => {
      const state = {
        rawData,
        showOutliers: true,
        analysisResult: { outliers },
      };
      return selector(state as unknown as Parameters<typeof selector>[0]);
    });

    const { result } = renderHook(() => useChartData('age'));
    expect(result.current).toHaveLength(5);
    expect(result.current).toEqual(rawData);
  });

  it('filters out outlier-indexed rows when showOutliers is false', () => {
    mockUseStore.mockImplementation((selector: (s: Record<string, unknown>) => unknown) => {
      const state = {
        rawData,
        showOutliers: false,
        analysisResult: { outliers },
      };
      return selector(state as unknown as Parameters<typeof selector>[0]);
    });

    const { result } = renderHook(() => useChartData('age'));
    expect(result.current).toHaveLength(3);
    expect(result.current).toEqual([
      { age: 25, name: 'Alice' },
      { age: 30, name: 'Bob' },
      { age: 22, name: 'Carol' },
    ]);
  });
});
