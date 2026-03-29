import { useRef } from 'react';
import { useUpload } from '../hooks/useUpload';
import { useStore } from '../store';

interface DropZoneProps {
  className?: string;
}

export function DropZone({ className = '' }: DropZoneProps) {
  const { isDragging, uploadProgress, handleDragOver, handleDragLeave, handleDrop, handleFileSelect } =
    useUpload();
  const status = useStore((s) => s.status);
  const error = useStore((s) => s.error);
  const inputRef = useRef<HTMLInputElement>(null);

  const isUploading = status === 'uploading';

  const borderClass = isDragging
    ? 'border-primary bg-primary-light'
    : 'border-border bg-surface-raised hover:border-primary-muted';

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 transition-colors duration-150 ${borderClass} ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="region"
      aria-label="파일 업로드 영역"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Upload icon */}
        <svg
          className="w-12 h-12 text-text-subtle"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>

        {isUploading ? (
          <div className="w-full max-w-xs">
            <p className="text-sm text-text-muted mb-2 text-center">업로드 중...</p>
            <div className="w-full bg-border-light rounded h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-text-subtle mt-1 text-center">{uploadProgress}%</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-base text-text font-medium">
                CSV 또는 JSON 파일을 여기에 드래그하세요
              </p>
              <p className="text-sm text-text-subtle mt-1">최대 10MB</p>
            </div>

            <button
              type="button"
              className="text-sm text-primary hover:text-primary-hover font-medium underline underline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => inputRef.current?.click()}
            >
              또는 파일 선택
            </button>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={handleFileSelect}
              aria-label="CSV 또는 JSON 파일 선택"
            />
          </>
        )}

        {/* Error message */}
        {error && status === 'error' && (
          <div className="w-full max-w-sm" role="alert">
            <p className="text-sm text-error text-center bg-error-light border border-error/20 rounded-lg px-4 py-2">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
