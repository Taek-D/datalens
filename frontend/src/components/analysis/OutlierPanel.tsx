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
  const rowClass = isEven ? 'bg-surface-raised' : 'bg-surface';
  const countClass =
    outlier.outlier_count > 0 ? 'text-error font-medium' : 'text-success';

  return (
    <div
      style={style}
      className={`flex items-center ${rowClass} border-b border-border-light transition-colors hover:bg-primary-light/40`}
    >
      <span className="flex-1 px-3 py-2 text-sm text-text font-medium truncate">
        {outlier.column}
      </span>
      <span className="w-48 px-3 py-2 text-sm text-text-muted text-right whitespace-nowrap">
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
        <h2 className="text-lg font-semibold mb-3 text-text">이상값 분석</h2>
        <p className="text-sm text-text-subtle">분석 결과를 불러오는 중입니다...</p>
      </section>
    );
  }

  if (outliers.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3 text-text">이상값 분석</h2>
        <p className="text-sm text-text-subtle">수치형 컬럼이 없습니다.</p>
      </section>
    );
  }

  return (
    <section>
      {/* Section header with toggle */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-text">이상값 분석</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOutliers(!showOutliers)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              showOutliers ? 'bg-primary' : 'bg-gray-300'
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
          <span className="text-sm text-text-muted">
            {showOutliers ? '이상값 포함' : '이상값 제외'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="flex items-center bg-surface border-b border-border">
          <span className="flex-1 px-3 py-2 text-sm font-semibold text-text">
            컬럼명
          </span>
          <span className="w-48 px-3 py-2 text-sm font-semibold text-text text-right">
            IQR 범위
          </span>
          <span className="w-24 px-3 py-2 text-sm font-semibold text-text text-right">
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
              const rowClass = isEven ? 'bg-surface-raised' : 'bg-surface';
              const countClass =
                outlier.outlier_count > 0
                  ? 'text-error font-medium'
                  : 'text-success';
              return (
                <div
                  key={outlier.column}
                  className={`flex items-center ${rowClass} border-b border-border-light last:border-b-0 transition-colors hover:bg-primary-light/40`}
                >
                  <span className="flex-1 px-3 py-2 text-sm text-text font-medium truncate">
                    {outlier.column}
                  </span>
                  <span className="w-48 px-3 py-2 text-sm text-text-muted text-right whitespace-nowrap">
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
