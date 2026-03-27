import { create } from 'zustand';
import type { DatasetSlice } from './datasetSlice';
import { createDatasetSlice } from './datasetSlice';
import type { AnalysisSlice } from './analysisSlice';
import { createAnalysisSlice } from './analysisSlice';
import type { UiSlice } from './uiSlice';
import { createUiSlice } from './uiSlice';

export type StoreState = DatasetSlice & AnalysisSlice & UiSlice & {
  resetStore: () => void;
};

const initialState = {
  rawData: [] as Record<string, unknown>[],
  columns: [],
  rowCount: 0,
  fileId: null,
  analysisResult: null,
  status: 'idle' as const,
  error: null,
  analysisStep: null,
};

export const useStore = create<StoreState>()((...args) => ({
  ...createDatasetSlice(...args),
  ...createAnalysisSlice(...args),
  ...createUiSlice(...args),
  resetStore: () => args[0](initialState),
}));

export default useStore;
