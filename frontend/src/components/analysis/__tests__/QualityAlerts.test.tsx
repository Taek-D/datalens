import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QualityAlerts } from '../QualityAlerts';
import { useStore } from '../../../store';

const baseAnalysisResult = {
  summary: {},
  correlation: { columns: [], values: [] },
  outliers: [],
  quality_alerts: [],
  row_count: 100,
  column_count: 3,
  missing_ratio: 0.0,
  duplicate_count: 0,
};

beforeEach(() => {
  useStore.getState().resetStore();
});

describe('QualityAlerts', () => {
  it('renders severity-colored banner for warning alert', () => {
    useStore.getState().setAnalysisResult({
      ...baseAnalysisResult,
      quality_alerts: [
        {
          column: 'age',
          alert_type: 'high_missing',
          message: '결측값 비율이 높습니다.',
          severity: 'warning',
        },
      ],
    });

    render(<QualityAlerts />);

    const banner = screen.getByText('결측값 비율이 높습니다.');
    // The banner container should have yellow styling
    const bannerContainer = banner.closest('div');
    expect(bannerContainer?.className).toContain('bg-yellow-50');
    expect(screen.getByText('age')).toBeDefined();
  });

  it('renders severity-colored banner for critical alert', () => {
    useStore.getState().setAnalysisResult({
      ...baseAnalysisResult,
      quality_alerts: [
        {
          column: 'salary',
          alert_type: 'extreme_outliers',
          message: '극단적인 이상값이 감지되었습니다.',
          severity: 'critical',
        },
      ],
    });

    render(<QualityAlerts />);

    const banner = screen.getByText('극단적인 이상값이 감지되었습니다.');
    const bannerContainer = banner.closest('div');
    expect(bannerContainer?.className).toContain('bg-red-50');
    expect(screen.getByText('salary')).toBeDefined();
  });

  it('returns null when quality_alerts is empty', () => {
    useStore.getState().setAnalysisResult({
      ...baseAnalysisResult,
      quality_alerts: [],
    });

    const { container } = render(<QualityAlerts />);

    expect(container.firstChild).toBeNull();
  });
});
