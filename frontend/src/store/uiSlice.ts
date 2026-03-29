import type { StateCreator } from 'zustand';

export type AppStatus = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

export interface UiSlice {
  status: AppStatus;
  error: string | null;
  analysisStep: string | null;
  showOutliers: boolean;
  setStatus: (status: AppStatus) => void;
  setError: (error: string | null) => void;
  setAnalysisStep: (step: string | null) => void;
  setShowOutliers: (show: boolean) => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  status: 'idle',
  error: null,
  analysisStep: null,
  showOutliers: true,
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setAnalysisStep: (step) => set({ analysisStep: step }),
  setShowOutliers: (show) => set({ showOutliers: show }),
});
