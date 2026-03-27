import { apiClient } from './client';
import type { UploadResponse } from '../types/dataset';
import type { AnalysisResultResponse } from '../types/analysis';

/**
 * Upload a CSV or JSON file to the backend.
 * Returns column metadata, 50-row preview, row count, and a file_id for analysis.
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<UploadResponse>('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Run analysis on a previously uploaded dataset identified by fileId.
 * Returns statistical summary, correlations, outliers, and quality alerts.
 */
export async function analyzeDataset(fileId: string): Promise<AnalysisResultResponse> {
  const response = await apiClient.post<AnalysisResultResponse>('/api/analyze', {
    file_id: fileId,
  });
  return response.data;
}
