/**
 * DataLens shared type contracts — Phase 1 scaffold.
 * Must remain in sync with backend/schemas/upload.py.
 * snake_case preserved (no camelCase transform in v1).
 */

export type ColumnType = 'numeric' | 'categorical' | 'datetime' | 'text';

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  nullable: boolean;
  unique_count: number;
}

export interface UploadResponse {
  columns: ColumnMeta[];
  /** First 50 rows of raw data */
  preview: Record<string, unknown>[];
  row_count: number;
  file_id: string;
}
