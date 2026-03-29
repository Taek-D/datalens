import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCard } from '../SummaryCard';
import { useStore } from '../../../store';

const mockAnalysisResult = {
  summary: {},
  correlation: { columns: [], values: [] },
  outliers: [],
  quality_alerts: [],
  row_count: 1500,
  column_count: 8,
  missing_ratio: 0.12,
  duplicate_count: 25,
};

beforeEach(() => {
  useStore.getState().resetStore();
});

describe('SummaryCard', () => {
  it('renders 4 stat cards with correct labels', () => {
    useStore.getState().setAnalysisResult(mockAnalysisResult);

    render(<SummaryCard />);

    expect(screen.getByText('행 수')).toBeDefined();
    expect(screen.getByText('컬럼 수')).toBeDefined();
    expect(screen.getByText('결측 비율')).toBeDefined();
    expect(screen.getByText('중복 행')).toBeDefined();
  });

  it('displays missing_ratio as percentage', () => {
    useStore.getState().setAnalysisResult(mockAnalysisResult);

    render(<SummaryCard />);

    // missing_ratio 0.12 -> "12.0%"
    expect(screen.getByText('12.0%')).toBeDefined();
  });

  it('renders fallback dashes when analysisResult is null', () => {
    // store is reset to null in beforeEach
    render(<SummaryCard />);

    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBe(4);
  });
});
