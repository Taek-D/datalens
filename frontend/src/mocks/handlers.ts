import { http, HttpResponse } from 'msw';
import type { UploadResponse } from '../types/dataset';
import type { AnalysisResultResponse } from '../types/analysis';

const mockUploadResponse: UploadResponse = {
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

const mockAnalysisResponse: AnalysisResultResponse = {
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

export const handlers = [
  http.post('http://localhost:8000/api/upload', () => {
    return HttpResponse.json(mockUploadResponse);
  }),

  http.post('http://localhost:8000/api/analyze', () => {
    return HttpResponse.json(mockAnalysisResponse);
  }),
];
