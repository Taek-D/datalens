import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { apiClient } from '../../api/client';

interface ScatterPoint {
  x: number;
  y: number;
}

interface ScatterModalProps {
  colX: string;
  colY: string;
  correlationValue: number;
  fileId: string;
  onClose: () => void;
}

export function ScatterModal({
  colX,
  colY,
  correlationValue,
  fileId,
  onClose,
}: ScatterModalProps) {
  const [points, setPoints] = useState<ScatterPoint[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.post<{
          points: ScatterPoint[];
          total_count: number;
        }>('/api/scatter', { file_id: fileId, col_x: colX, col_y: colY });
        if (!cancelled) {
          setPoints(response.data.points);
          setTotalCount(response.data.total_count);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [fileId, colX, colY]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${colX} vs ${colY} scatter plot`}
    >
      <div
        className="bg-white rounded-xl p-6 w-[560px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              {colX} vs {colY}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Pearson r = {correlationValue.toFixed(3)}
              {!loading && !error && (
                <span className="ml-2">
                  &middot; Showing {points.length} of {totalCount}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mt-1 -mr-1"
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center h-[300px]">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <XAxis dataKey="x" name={colX} type="number" />
              <YAxis dataKey="y" name={colY} type="number" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={points} fill="#6366f1" opacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
