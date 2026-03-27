import { StateCreator } from 'zustand';
import { AnalysisResultResponse } from '../types/analysis';

export interface AnalysisSlice {
  analysisResult: AnalysisResultResponse | null;
  setAnalysisResult: (result: AnalysisResultResponse) => void;
}

export const createAnalysisSlice: StateCreator<AnalysisSlice> = (set) => ({
  analysisResult: null,
  setAnalysisResult: (result) => set({ analysisResult: result }),
});
