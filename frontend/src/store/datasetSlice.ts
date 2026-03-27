import type { StateCreator } from 'zustand';
import type { ColumnMeta } from '../types/dataset';

export interface DatasetSlice {
  rawData: Record<string, unknown>[];
  columns: ColumnMeta[];
  rowCount: number;
  fileId: string | null;
  setDataset: (
    data: Record<string, unknown>[],
    columns: ColumnMeta[],
    rowCount: number,
    fileId: string
  ) => void;
}

export const createDatasetSlice: StateCreator<DatasetSlice> = (set) => ({
  rawData: [],
  columns: [],
  rowCount: 0,
  fileId: null,
  setDataset: (data, columns, rowCount, fileId) =>
    set({ rawData: data, columns, rowCount, fileId }),
});
