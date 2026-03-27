import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { useUpload, validateFile } from './useUpload';
import { useStore } from '../store';

// Reset store state before each test
beforeEach(() => {
  useStore.getState().resetStore();
});

// ─── validateFile unit tests ───────────────────────────────────────────────

describe('validateFile', () => {
  it('returns null for valid .csv file under 10MB', () => {
    const file = new File(['col1,col2\n1,a'], 'data.csv', { type: 'text/csv' });
    expect(validateFile(file)).toBeNull();
  });

  it('returns null for valid .json file under 10MB', () => {
    const file = new File(['[{"a":1}]'], 'data.json', { type: 'application/json' });
    expect(validateFile(file)).toBeNull();
  });

  it('returns error for unsupported extension (.txt)', () => {
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    const error = validateFile(file);
    expect(error).not.toBeNull();
    expect(error).toContain('CSV 또는 JSON');
  });

  it('returns error for unsupported extension (.xlsx)', () => {
    const file = new File(['data'], 'spreadsheet.xlsx', { type: 'application/vnd.ms-excel' });
    const error = validateFile(file);
    expect(error).not.toBeNull();
  });

  it('returns error for file exceeding 10MB', () => {
    // Create a File object with a large size by overriding size property
    const file = Object.defineProperty(
      new File(['x'], 'big.csv', { type: 'text/csv' }),
      'size',
      { value: 11 * 1024 * 1024 }
    );
    const error = validateFile(file);
    expect(error).not.toBeNull();
    expect(error).toContain('10MB');
  });

  it('returns null for file exactly at 10MB limit', () => {
    const file = Object.defineProperty(
      new File(['x'], 'exact.csv', { type: 'text/csv' }),
      'size',
      { value: 10 * 1024 * 1024 }
    );
    expect(validateFile(file)).toBeNull();
  });
});

// ─── useUpload hook integration tests ─────────────────────────────────────

describe('useUpload', () => {
  it('starts with isDragging false and uploadProgress 0', () => {
    const { result } = renderHook(() => useUpload());
    expect(result.current.isDragging).toBe(false);
    expect(result.current.uploadProgress).toBe(0);
  });

  it('sets isDragging true on dragOver and false on dragLeave', () => {
    const { result } = renderHook(() => useUpload());

    act(() => {
      result.current.handleDragOver({
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent);
    });
    expect(result.current.isDragging).toBe(true);

    act(() => {
      result.current.handleDragLeave({
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent);
    });
    expect(result.current.isDragging).toBe(false);
  });

  it('sets error status for unsupported file type on drop', async () => {
    const { result } = renderHook(() => useUpload());

    await act(async () => {
      result.current.handleDrop({
        preventDefault: vi.fn(),
        dataTransfer: {
          files: [new File(['data'], 'bad.txt', { type: 'text/plain' })],
        },
      } as unknown as React.DragEvent);
    });

    expect(useStore.getState().status).toBe('error');
    expect(useStore.getState().error).toContain('CSV 또는 JSON');
  });

  it('transitions store idle -> uploading -> analyzing on successful upload', async () => {
    const { result } = renderHook(() => useUpload());
    const statusHistory: string[] = [];

    // Track status transitions
    const unsub = useStore.subscribe((state) => {
      statusHistory.push(state.status);
    });

    await act(async () => {
      result.current.handleFileSelect({
        target: {
          files: [new File(['col1\n1'], 'data.csv', { type: 'text/csv' })],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    unsub();

    expect(statusHistory).toContain('uploading');
    expect(statusHistory).toContain('analyzing');
    // fileId should be set from mock response
    expect(useStore.getState().fileId).toBe('test1234');
  });

  it('sets error status and message when upload returns 413', async () => {
    server.use(
      http.post('http://localhost:8000/api/upload', () =>
        new HttpResponse(null, { status: 413 })
      )
    );

    const { result } = renderHook(() => useUpload());

    await act(async () => {
      result.current.handleFileSelect({
        target: {
          files: [new File(['col1\n1'], 'data.csv', { type: 'text/csv' })],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(useStore.getState().status).toBe('error');
    expect(useStore.getState().error).toBeTruthy();
  });

  it('resetUpload calls resetStore and resets local state', () => {
    const { result } = renderHook(() => useUpload());

    // Put store in non-idle state
    useStore.getState().setStatus('error');
    useStore.getState().setError('test error');

    act(() => {
      result.current.resetUpload();
    });

    expect(useStore.getState().status).toBe('idle');
    expect(useStore.getState().error).toBeNull();
    expect(result.current.isDragging).toBe(false);
    expect(result.current.uploadProgress).toBe(0);
  });
});
