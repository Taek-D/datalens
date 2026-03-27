/**
 * Analysis result types — mirrors backend/schemas/analysis.py (Pydantic v2).
 * snake_case preserved (no camelCase transform).
 * Must remain in sync with backend response schemas.
 */

export interface SummaryStats {
  mean: number | null;
  std: number | null;
  min: number | null;
  max: number | null;
  q1: number | null;
  median: number | null;
  q3: number | null;
  skewness: number | null;
}

export interface CorrelationMatrix {
  columns: string[];
  values: (number | null)[][];
}

export interface OutlierResult {
  column: string;
  lower_bound: number;
  upper_bound: number;
  outlier_count: number;
  outlier_indices: number[];
}

export interface QualityAlert {
  column: string;
  alert_type: string;
  message: string;
  severity: string;
}

export interface AnalysisResultResponse {
  summary: Record<string, SummaryStats>;
  correlation: CorrelationMatrix;
  outliers: OutlierResult[];
  quality_alerts: QualityAlert[];
  row_count: number;
  column_count: number;
  missing_ratio: number;
  duplicate_count: number;
}
