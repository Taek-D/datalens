import { useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { analyzeDataset } from '../api/analysisApi';
import { isAxiosError } from 'axios';

const ANALYSIS_STEPS = [
  '파싱 중...',
  '통계 분석 중...',
  '상관관계 계산 중...',
  '이상값 탐지 중...',
];

export function useAnalysis() {
  const status = useStore((s) => s.status);
  const fileId = useStore((s) => s.fileId);

  const runAnalysis = useCallback(async (id: string) => {
    const { setAnalysisStep, setStatus, setError, setAnalysisResult } =
      useStore.getState();

    // Show cosmetic step progress (300ms each) while actual API call is in flight
    setAnalysisStep(ANALYSIS_STEPS[0]);
    const stepTimers: ReturnType<typeof setTimeout>[] = [];
    ANALYSIS_STEPS.slice(1).forEach((step, i) => {
      stepTimers.push(
        setTimeout(() => setAnalysisStep(step), 300 * (i + 1))
      );
    });

    try {
      const result = await analyzeDataset(id);
      stepTimers.forEach(clearTimeout);
      setAnalysisResult(result);
      setStatus('done');
      setAnalysisStep(null);
    } catch (err) {
      stepTimers.forEach(clearTimeout);
      setStatus('error');
      setAnalysisStep(null);
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail as string | undefined;
        setError(detail ?? '분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      } else {
        setError('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  }, []);

  // Auto-trigger when status transitions to 'analyzing' with a valid fileId
  useEffect(() => {
    if (status === 'analyzing' && fileId) {
      runAnalysis(fileId);
    }
  }, [status, fileId, runAnalysis]);

  const retryAnalysis = useCallback(() => {
    const currentFileId = useStore.getState().fileId;
    if (currentFileId) {
      useStore.getState().setStatus('analyzing');
      // The useEffect above will detect the status change and re-run
    }
  }, []);

  return { retryAnalysis };
}
