import { useState } from 'react';
import { useStore } from '../store';
import { uploadFile } from '../api/analysisApi';
import { isAxiosError } from 'axios';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.csv', '.json'];

export function validateFile(file: File): string | null {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `지원하지 않는 파일 형식입니다. CSV 또는 JSON 파일을 선택해주세요.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `파일 크기가 10MB를 초과합니다. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)`;
  }
  return null;
}

export function useUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUpload(file);
    }
  };

  const processUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      useStore.getState().setStatus('error');
      useStore.getState().setError(validationError);
      return;
    }

    useStore.getState().setStatus('uploading');
    useStore.getState().setError(null);
    setUploadProgress(0);

    try {
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await uploadFile(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      useStore.getState().setDataset(
        response.preview,
        response.columns,
        response.row_count,
        response.file_id
      );
      // Transition to analyzing — useAnalysis hook will auto-trigger
      useStore.getState().setStatus('analyzing');
      setUploadProgress(0);
    } catch (err) {
      setUploadProgress(0);
      useStore.getState().setStatus('error');
      if (isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 413) {
          useStore.getState().setError('파일 크기가 서버 제한을 초과합니다.');
        } else if (status === 400) {
          const detail = err.response?.data?.detail as string | undefined;
          useStore.getState().setError(detail ?? '잘못된 파일 형식입니다.');
        } else {
          useStore.getState().setError('업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      } else {
        useStore.getState().setError('업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  const resetUpload = () => {
    setUploadProgress(0);
    setIsDragging(false);
    useStore.getState().resetStore();
  };

  return {
    isDragging,
    uploadProgress,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    resetUpload,
  };
}
