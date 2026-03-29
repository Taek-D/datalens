import React from 'react';
import { List } from 'react-window';
import type { RowComponentProps } from 'react-window';
import { useStore } from '../../store';
import type { OutlierResult } from '../../types/analysis';

const VIRTUALIZE_THRESHOLD = 50;
const ROW_HEIGHT = 40;
const VIRTUAL_LIST_HEIGHT = 400;

interface OutlierRowProps {
  outliers: OutlierResult[];
}

function OutlierRow({ index, style, outliers }: RowComponentProps<OutlierRowProps>) {
  const outlier = outliers[index];
  if (!outlier) return null;
  const isEven = index % 2 === 0;
  const rowClass = isEven ? 'bg-white' : 'bg-gray-50';
  const countClass =
    outlier.outlier_count > 0 ? 'text-red-600 font-medium' : 'text-green-600';

  return (
    <div
      style={style}
      className={`flex items-center ${rowClass} border-b border-gray-100`}
    >
      <span className="flex-1 px-3 py-2 text-sm text-gray-900 font-medium truncate">
        {outlier.column}
      </span>
      <span className="w-48 px-3 py-2 text-sm text-gray-700 text-right whitespace-nowrap">
        {outlier.lower_bound.toFixed(2)} ~ {outlier.upper_bound.toFixed(2)}
      </span>
      <span className={`w-24 px-3 py-2 text-sm text-right ${countClass}`}>
        {outlier.outlier_count}
      </span>
    </div>
  );
}

export const OutlierPanel = React.memo(function OutlierPanel() {
  const outliers = useStore((s) => s.analysisResult?.outliers);
  const showOutliers = useStore((s) => s.showOutliers);
  const setShowOutliers = useStore((s) => s.setShowOutliers);

  if (!outliers) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-800">이상값 분석</h2>
        <p className="text-sm text-gray-400">분석 결과를 불러오는 중입니다...</p>
      </section>
    );
  }

  if (outliers.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-800">이상값 분석</h2>
        <p className="text-sm text-gray-400">수치형 컬럼이 없습니다.</p>
      </section>
    );
  }

  return (
    <section>
      {/* Section header with toggle */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">이상값 분석</h2>
        <button
          type="button"
          onClick={() => setShowOutliers(!showOutliers)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            showOutliers ? 'bg-indigo-600' : 'bg-gray-300'
          }`}
          role="switch"
          aria-checked={showOutliers}
          aria-label={showOutliers ? '이상값 포함' : '이상값 제외'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              showOutliers ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="ml-2 text-sm text-gray-600">
          {showOutliers ? '이상값 포함' : '이상값 제외'}
        </span>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="flex items-center bg-gray-50 border-b border-gray-200">
          <span className="flex-1 px-3 py-2 text-sm font-semibold text-gray-700">
            컬럼명
          </span>
          <span className="w-48 px-3 py-2 text-sm font-semibold text-gray-700 text-right">
            IQR 범위
          </span>
          <span className="w-24 px-3 py-2 text-sm font-semibold text-gray-700 text-right">
            이상값 수
          </span>
        </div>

        {/* Table body */}
        {outliers.length > VIRTUALIZE_THRESHOLD ? (
          <List
            rowComponent={OutlierRow}
            rowHeight={ROW_HEIGHT}
            rowCount={outliers.length}
            rowProps={{ outliers }}
            style={{ height: VIRTUAL_LIST_HEIGHT, width: '100%' }}
          />
        ) : (
          <div>
            {outliers.map((outlier, index) => {
              const isEven = index % 2 === 0;
              const rowClass = isEven ? 'bg-white' : 'bg-gray-50';
              const countClass =
                outlier.outlier_count > 0
                  ? 'text-red-600 font-medium'
                  : 'text-green-600';
              return (
                <div
                  key={outlier.column}
                  className={`flex items-center ${rowClass} border-b border-gray-100 last:border-b-0`}
                >
                  <span className="flex-1 px-3 py-2 text-sm text-gray-900 font-medium truncate">
                    {outlier.column}
                  </span>
                  <span className="w-48 px-3 py-2 text-sm text-gray-700 text-right whitespace-nowrap">
                    {outlier.lower_bound.toFixed(2)} ~{' '}
                    {outlier.upper_bound.toFixed(2)}
                  </span>
                  <span
                    className={`w-24 px-3 py-2 text-sm text-right ${countClass}`}
                  >
                    {outlier.outlier_count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
});
