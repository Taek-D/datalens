import type { StateCreator } from 'zustand';
import type { ColumnMeta } from '../types/dataset';

export interface DatasetSlice {
  rawData: Record<string, unknown>[];
  columns: ColumnMeta[];
  rowCount: number;
  fileId: string | null;
  fileName: string | null;
  setDataset: (
    data: Record<string, unknown>[],
    columns: ColumnMeta[],
    rowCount: number,
    fileId: string,
    fileName?: string
  ) => void;
}

export const createDatasetSlice: StateCreator<DatasetSlice> = (set) => ({
  rawData: [],
  columns: [],
  rowCount: 0,
  fileId: null,
  fileName: null,
  setDataset: (data, columns, rowCount, fileId, fileName) =>
    set({ rawData: data, columns, rowCount, fileId, fileName: fileName ?? null }),
});
