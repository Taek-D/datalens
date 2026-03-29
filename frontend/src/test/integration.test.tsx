import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { useStore } from '../store';
import type { AnalysisResultResponse } from '../types/analysis';
import type { UploadResponse, ColumnMeta } from '../types/dataset';

// ─── Module-level mocks ────────────────────────────────────────────────────
// Mock CorrelationHeatmap — @nivo/heatmap uses SVG/D3 which fails in jsdom.
// Replicates the < 2 columns guard so edge-case tests work correctly.
vi.mock('../components/charts/CorrelationHeatmap', () => ({
  CorrelationHeatmap: ({
    matrix,
  }: {
    matrix: { columns: string[] };
    onCellClick: (colX: string, colY: string, value: number) => void;
  }) => {
    if (matrix.columns.length < 2) {
      return (
        <div data-testid="correlation-heatmap">
          상관관계 분석에는 2개 이상의 수치형 컬럼이 필요합니다.
        </div>
      );
    }
    return (
      <div data-testid="correlation-heatmap">
        Heatmap ({matrix.columns.length} cols)
      </div>
    );
  },
}));

// Mock DataTable — uses react-window List which requires ResizeObserver.
// ResizeObserver does not exist in jsdom; mock avoids the crash.
vi.mock('../components/DataTable', () => ({
  DataTable: ({ columns }: { columns: ColumnMeta[]; data: Record<string, unknown>[] }) => (
    <div data-testid="data-table">{columns.map((c) => c.name).join(',')}</div>
  ),
}));

// Mock OutlierPanel — uses react-window FixedSizeList when outliers > 50.
// Also avoids duplicate "수치형 컬럼이 없습니다." text with ColumnStatsTable.
vi.mock('../components/analysis/OutlierPanel', () => ({
  OutlierPanel: () => {
    const outliers = useStore.getState().analysisResult?.outliers;
    if (!outliers || outliers.length === 0) {
      return (
        <section data-testid="outlier-panel">
          <h2>이상값 분석</h2>
          <p>이상값 없음</p>
        </section>
      );
    }
    return (
      <section data-testid="outlier-panel">
        <h2>이상값 분석</h2>
        {outliers.map((o) => (
          <div key={o.column}>{o.column}: {o.outlier_count}</div>
        ))}
      </section>
    );
  },
}));

// Mock chart components that render SVG — avoid jsdom SVG rendering issues.
vi.mock('../components/charts/HistogramChart', () => ({
  HistogramChart: ({ columnName }: { columnName: string }) => (
    <div data-testid={`histogram-${columnName}`}>Histogram</div>
  ),
}));

vi.mock('../components/charts/BarChart', () => ({
  BarChart: ({ columnName }: { columnName: string }) => (
    <div data-testid={`barchart-${columnName}`}>BarChart</div>
  ),
}));

vi.mock('../components/charts/TimeseriesChart', () => ({
  TimeseriesChart: ({ columnName }: { columnName: string }) => (
    <div data-testid={`timeseries-${columnName}`}>TimeseriesChart</div>
  ),
}));

// Import App AFTER all vi.mock() calls are hoisted and registered.
import App from '../App';

// ─── Shared fixtures ───────────────────────────────────────────────────────

const baseUploadResponse: UploadResponse = {
  file_id: 'test1234',
  row_count: 100,
  columns: [
    { name: 'age', type: 'numeric', nullable: false, unique_count: 50 },
    { name: 'category', type: 'categorical', nullable: false, unique_count: 3 },
    { name: 'description', type: 'text', nullable: true, unique_count: 98 },
  ],
  preview: Array.from({ length: 5 }, (_, i) => ({
    age: 20 + i,
    category: ['A', 'B', 'C'][i % 3],
    description: `Sample description ${i + 1}`,
  })),
};

const baseAnalysisResponse: AnalysisResultResponse = {
  summary: {
    age: {
      mean: 35.5,
      std: 12.3,
      min: 18.0,
      max: 75.0,
      q1: 25.0,
      median: 35.0,
      q3: 48.0,
      skewness: 0.42,
    },
  },
  correlation: {
    columns: ['age', 'score'],
    values: [
      [1.0, 0.65],
      [0.65, 1.0],
    ],
  },
  outliers: [
    {
      column: 'age',
      lower_bound: 2.5,
      upper_bound: 68.5,
      outlier_count: 3,
      outlier_indices: [12, 45, 87],
    },
  ],
  quality_alerts: [
    {
      column: 'description',
      alert_type: 'high_null',
      message: '15% of values are missing',
      severity: 'warning',
    },
  ],
  row_count: 100,
  column_count: 3,
  missing_ratio: 0.05,
  duplicate_count: 2,
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function triggerFileUpload(file?: File): void {
  const csvFile = file ?? new File(['col1\n1'], 'test.csv', { type: 'text/csv' });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
  if (!input) throw new Error('File input not found — DropZone not rendered');
  fireEvent.change(input, { target: { files: [csvFile] } });
}

// ─── Setup / Teardown ──────────────────────────────────────────────────────

beforeEach(() => {
  useStore.getState().resetStore();
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('Integration: upload → analyze → render pipeline', () => {
  it('Test 1 — happy path: full pipeline renders analysis view', async () => {
    render(<App />);

    triggerFileUpload();

    await waitFor(
      () => expect(screen.getByText('행 수')).toBeInTheDocument(),
      { timeout: 8000 },
    );

    // SummaryCard row_count = 100
    expect(screen.getByText('100')).toBeInTheDocument();

    // SummaryCard column_count = 3 — use the stat card container to scope the query
    const columnCountCard = screen.getByText('컬럼 수').closest('div');
    expect(columnCountCard?.textContent).toContain('3');

    // Quality alert from mock response
    expect(screen.getByText('15% of values are missing')).toBeInTheDocument();

    // Outlier panel heading (from mocked OutlierPanel)
    expect(screen.getByText('이상값 분석')).toBeInTheDocument();
  });

  it('Test 2 — edge case: 0 numeric columns shows empty-state message', async () => {
    server.use(
      http.post('http://localhost:8000/api/upload', () => {
        const response: UploadResponse = {
          ...baseUploadResponse,
          columns: [
            { name: 'category', type: 'categorical', nullable: false, unique_count: 3 },
            { name: 'description', type: 'text', nullable: true, unique_count: 98 },
          ],
        };
        return HttpResponse.json(response);
      }),
      http.post('http://localhost:8000/api/analyze', () => {
        const response: AnalysisResultResponse = {
          ...baseAnalysisResponse,
          summary: {},
          correlation: { columns: [], values: [] },
          outliers: [],
          quality_alerts: [],
          row_count: 100,
          column_count: 2,
        };
        return HttpResponse.json(response);
      }),
    );

    render(<App />);
    triggerFileUpload();

    await waitFor(
      () => expect(screen.getByText('행 수')).toBeInTheDocument(),
      { timeout: 8000 },
    );

    // ColumnStatsTable renders empty state when summary is {}
    expect(screen.getByText('수치형 컬럼이 없습니다.')).toBeInTheDocument();
  });

  it('Test 3 — edge case: 1 numeric column disables correlation heatmap', async () => {
    server.use(
      http.post('http://localhost:8000/api/analyze', () => {
        const response: AnalysisResultResponse = {
          ...baseAnalysisResponse,
          correlation: { columns: ['age'], values: [[1.0]] },
        };
        return HttpResponse.json(response);
      }),
    );

    render(<App />);
    triggerFileUpload();

    await waitFor(
      () => expect(screen.getByText('행 수')).toBeInTheDocument(),
      { timeout: 8000 },
    );

    // Mocked CorrelationHeatmap renders guard text when columns.length < 2
    expect(
      screen.getByText('상관관계 분석에는 2개 이상의 수치형 컬럼이 필요합니다.'),
    ).toBeInTheDocument();
  });

  it('Test 4 — edge case: all-null column stats render "-" not crash', async () => {
    server.use(
      http.post('http://localhost:8000/api/analyze', () => {
        const response: AnalysisResultResponse = {
          ...baseAnalysisResponse,
          summary: {
            null_col: {
              mean: null,
              std: null,
              min: null,
              max: null,
              q1: null,
              median: null,
              q3: null,
              skewness: null,
            },
          },
        };
        return HttpResponse.json(response);
      }),
    );

    render(<App />);
    triggerFileUpload();

    await waitFor(
      () => expect(screen.getByText('행 수')).toBeInTheDocument(),
      { timeout: 8000 },
    );

    // ColumnStatsTable fmt() renders "-" for each null stat field (8 stats)
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(8);
  });

  it('Test 5 — sequential upload resets state: second upload shows new data', async () => {
    render(<App />);

    // First upload — default mock: row_count=100
    triggerFileUpload();
    await waitFor(
      () => expect(screen.getByText('행 수')).toBeInTheDocument(),
      { timeout: 8000 },
    );

    // Reset to idle via "새 파일 업로드" button
    fireEvent.click(screen.getByText('새 파일 업로드'));

    // Confirm DropZone is visible (file input back in DOM)
    await waitFor(() => {
      expect(document.querySelector('input[type="file"]')).not.toBeNull();
    });

    // Override MSW with second dataset: row_count=50
    server.use(
      http.post('http://localhost:8000/api/upload', () => {
        const response: UploadResponse = {
          file_id: 'test5678',
          row_count: 50,
          columns: [
            { name: 'value', type: 'numeric', nullable: false, unique_count: 40 },
            { name: 'label', type: 'categorical', nullable: false, unique_count: 5 },
          ],
          preview: Array.from({ length: 3 }, (_, i) => ({
            value: i * 10,
            label: `Label${i}`,
          })),
        };
        return HttpResponse.json(response);
      }),
      http.post('http://localhost:8000/api/analyze', () => {
        const response: AnalysisResultResponse = {
          summary: {
            value: {
              mean: 20.0,
              std: 5.0,
              min: 0.0,
              max: 40.0,
              q1: 10.0,
              median: 20.0,
              q3: 30.0,
              skewness: 0.0,
            },
          },
          correlation: { columns: ['value'], values: [[1.0]] },
          outliers: [],
          quality_alerts: [],
          row_count: 50,
          column_count: 2,
          missing_ratio: 0.0,
          duplicate_count: 0,
        };
        return HttpResponse.json(response);
      }),
    );

    // Second upload
    triggerFileUpload(new File(['value\n10'], 'second.csv', { type: 'text/csv' }));

    await waitFor(
      () => expect(screen.getByText('행 수')).toBeInTheDocument(),
      { timeout: 8000 },
    );

    // New row_count=50 visible in SummaryCard
    expect(screen.getByText('50')).toBeInTheDocument();

    // Old row_count=100 should be gone from the summary card
    const rowCountCard = screen.getByText('행 수').closest('div');
    expect(rowCountCard?.textContent).not.toContain('100');
  });

  it('Test 6 — cold-start warming banner: appears after 2s health delay', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });

    // Override /health to never resolve — simulates cold-start hang
    server.use(
      http.get('http://localhost:8000/health', () => {
        return new Promise<never>(() => {
          // Never resolves
        });
      }),
    );

    render(<App />);

    // Banner should NOT be visible yet — 2000ms timer hasn't fired
    expect(screen.queryByText(/분석 서버에 연결 중/)).not.toBeInTheDocument();

    // Advance past the 2000ms warmup setTimeout and flush React updates
    await act(async () => {
      vi.advanceTimersByTime(2001);
    });

    // Banner must now be visible
    expect(screen.getByText(/분석 서버에 연결 중/)).toBeInTheDocument();
  });
});
