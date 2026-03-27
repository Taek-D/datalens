import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { uploadFile, analyzeDataset } from './analysisApi';

describe('uploadFile', () => {
  it('returns columns, preview, row_count, and file_id on success', async () => {
    const file = new File(['col1,col2\n1,a\n2,b'], 'test.csv', { type: 'text/csv' });
    const result = await uploadFile(file);

    expect(result.columns).toBeDefined();
    expect(result.columns.length).toBeGreaterThan(0);
    expect(result.preview).toBeDefined();
    expect(result.row_count).toBe(100);
    expect(result.file_id).toBe('test1234');
  });

  it('rejects on server error (413)', async () => {
    server.use(
      http.post('http://localhost:8000/api/upload', () =>
        new HttpResponse(null, { status: 413 })
      )
    );

    const file = new File(['x'.repeat(1024)], 'big.csv', { type: 'text/csv' });
    await expect(uploadFile(file)).rejects.toThrow();
  });
});

describe('analyzeDataset', () => {
  it('returns summary, correlation, outliers, and quality_alerts on success', async () => {
    const result = await analyzeDataset('test1234');

    expect(result.summary).toBeDefined();
    expect(result.correlation).toBeDefined();
    expect(result.correlation.columns).toBeInstanceOf(Array);
    expect(result.correlation.values).toBeInstanceOf(Array);
    expect(result.outliers).toBeInstanceOf(Array);
    expect(result.quality_alerts).toBeInstanceOf(Array);
    expect(result.row_count).toBe(100);
    expect(result.column_count).toBe(3);
    expect(typeof result.missing_ratio).toBe('number');
    expect(typeof result.duplicate_count).toBe('number');
  });

  it('rejects on server error (500)', async () => {
    server.use(
      http.post('http://localhost:8000/api/analyze', () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    await expect(analyzeDataset('test1234')).rejects.toThrow();
  });
});
