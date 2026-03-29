import { useState } from 'react';
import { useStore } from '../../store';
import { SummaryCard } from './SummaryCard';
import { QualityAlerts } from './QualityAlerts';
import { ColumnStatsTable } from './ColumnStatsTable';
import { DistributionGrid } from './DistributionGrid';
import { CorrelationHeatmap } from '../charts/CorrelationHeatmap';
import { OutlierPanel } from './OutlierPanel';
import { ScatterModal } from '../charts/ScatterModal';

interface ScatterModalState {
  colX: string;
  colY: string;
  correlationValue: number;
}

export function AnalysisView() {
  const correlation = useStore((s) => s.analysisResult?.correlation);
  const fileId = useStore((s) => s.fileId);
  const [scatterModal, setScatterModal] = useState<ScatterModalState | null>(null);

  const handleHeatmapCellClick = (
    colX: string,
    colY: string,
    value: number,
  ) => {
    setScatterModal({ colX, colY, correlationValue: value });
  };

  const handleScatterModalClose = () => {
    setScatterModal(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* (a) 데이터 개요 */}
      <SummaryCard />

      {/* (b) 품질 알림 — immediately below summary */}
      <QualityAlerts />

      {/* (c) 수치형 컬럼 기초통계 */}
      <div className="border-t border-gray-100 pt-6">
        <ColumnStatsTable />
      </div>

      {/* (d) 분포 차트 */}
      <div className="border-t border-gray-100 pt-6">
        <DistributionGrid />
      </div>

      {/* (e) 상관관계 히트맵 */}
      <div className="border-t border-gray-100 pt-6">
        <section>
          <h2 className="text-lg font-semibold mb-3 text-gray-800">
            상관관계 히트맵
          </h2>
          {correlation ? (
            <CorrelationHeatmap
              matrix={correlation}
              onCellClick={handleHeatmapCellClick}
            />
          ) : (
            <p className="text-sm text-gray-400">
              분석 결과를 불러오는 중입니다...
            </p>
          )}
        </section>
      </div>

      {/* (f) 이상값 패널 */}
      <div className="border-t border-gray-100 pt-6">
        <OutlierPanel />
      </div>

      {/* Scatter modal — rendered as portal-like overlay when open */}
      {scatterModal !== null && fileId !== null && (
        <ScatterModal
          colX={scatterModal.colX}
          colY={scatterModal.colY}
          correlationValue={scatterModal.correlationValue}
          fileId={fileId}
          onClose={handleScatterModalClose}
        />
      )}
    </div>
  );
}
