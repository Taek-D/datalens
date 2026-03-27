import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { useAnalysis } from './useAnalysis';
import { useStore } from '../store';

beforeEach(() => {
  useStore.getState().resetStore();
  vi.clearAllTimers();
});

describe('useAnalysis', () => {
  it('auto-triggers analyzeDataset when status becomes "analyzing" with fileId', async () => {
    renderHook(() => useAnalysis());

    act(() => {
      // Set fileId and trigger analyzing status
      useStore.getState().setDataset([], [], 0, 'test1234');
      useStore.getState().setStatus('analyzing');
    });

    await waitFor(() => {
      expect(useStore.getState().status).toBe('done');
    }, { timeout: 5000 });

    expect(useStore.getState().analysisResult).not.toBeNull();
  });

  it('sets analysisResult and transitions to "done" on success', async () => {
    renderHook(() => useAnalysis());

    act(() => {
      useStore.getState().setDataset([], [], 0, 'test1234');
      useStore.getState().setStatus('analyzing');
    });

    await waitFor(() => {
      expect(useStore.getState().status).toBe('done');
    }, { timeout: 5000 });

    const result = useStore.getState().analysisResult;
    expect(result).not.toBeNull();
    expect(result?.row_count).toBe(100);
    expect(result?.column_count).toBe(3);
    expect(result?.summary).toBeDefined();
    expect(result?.correlation).toBeDefined();
    expect(result?.outliers).toBeInstanceOf(Array);
    expect(result?.quality_alerts).toBeInstanceOf(Array);
    expect(useStore.getState().analysisStep).toBeNull();
  });

  it('sets status to "error" and clears analysisStep when analyze fails (500)', async () => {
    server.use(
      http.post('http://localhost:8000/api/analyze', () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    renderHook(() => useAnalysis());

    act(() => {
      useStore.getState().setDataset([], [], 0, 'test1234');
      useStore.getState().setStatus('analyzing');
    });

    await waitFor(() => {
      expect(useStore.getState().status).toBe('error');
    }, { timeout: 5000 });

    expect(useStore.getState().error).toBeTruthy();
    expect(useStore.getState().analysisStep).toBeNull();
  });

  it('retryAnalysis re-triggers analysis with current fileId', async () => {
    const { result } = renderHook(() => useAnalysis());

    // First successful analysis
    act(() => {
      useStore.getState().setDataset([], [], 0, 'test1234');
      useStore.getState().setStatus('analyzing');
    });

    await waitFor(() => {
      expect(useStore.getState().status).toBe('done');
    }, { timeout: 5000 });

    // Simulate error state then retry
    act(() => {
      useStore.getState().setStatus('error');
      useStore.getState().setError('some error');
    });

    act(() => {
      result.current.retryAnalysis();
    });

    await waitFor(() => {
      expect(useStore.getState().status).toBe('done');
    }, { timeout: 5000 });

    expect(useStore.getState().analysisResult).not.toBeNull();
  });

  it('does not auto-trigger when fileId is null', async () => {
    renderHook(() => useAnalysis());

    act(() => {
      // Status set to analyzing but no fileId
      useStore.getState().setStatus('analyzing');
    });

    // Wait briefly — status should remain 'analyzing' since no fileId
    await new Promise((r) => setTimeout(r, 100));
    expect(useStore.getState().status).toBe('analyzing');
  });
});
