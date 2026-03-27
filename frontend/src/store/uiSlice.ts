import type { StateCreator } from 'zustand';

export type AppStatus = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

export interface UiSlice {
  status: AppStatus;
  error: string | null;
  analysisStep: string | null;
  setStatus: (status: AppStatus) => void;
  setError: (error: string | null) => void;
  setAnalysisStep: (step: string | null) => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  status: 'idle',
  error: null,
  analysisStep: null,
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setAnalysisStep: (step) => set({ analysisStep: step }),
});
