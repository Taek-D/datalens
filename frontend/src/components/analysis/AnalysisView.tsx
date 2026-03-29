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

  const handleHeatmapCellClick = (colX: string, colY: string, value: number) => {
    setScatterModal({ colX, colY, correlationValue: value });
  };

  return (
    <div className="space-y-8">
      {/* Row 1: Summary Cards */}
      <SummaryCard />

      {/* Row 2: Quality Alerts */}
      <div id="quality" className="scroll-mt-20">
        <QualityAlerts />
      </div>

      {/* Row 3: Column Stats */}
      <div id="stats" className="scroll-mt-20">
        <ColumnStatsTable />
      </div>

      {/* Row 4: Distribution Charts */}
      <div id="distributions" className="scroll-mt-20">
        <DistributionGrid />
      </div>

      {/* Row 5: Correlation + Outliers — 2-column grid on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div id="correlation" className="xl:col-span-3 scroll-mt-20">
          <section>
            <h2 className="text-lg font-semibold mb-3 text-text">상관관계 히트맵</h2>
            {correlation ? (
              <div className="bg-surface-raised border border-border rounded-xl p-4">
                <CorrelationHeatmap matrix={correlation} onCellClick={handleHeatmapCellClick} />
              </div>
            ) : (
              <p className="text-sm text-text-subtle">분석 결과를 불러오는 중입니다...</p>
            )}
          </section>
        </div>

        <div id="outliers" className="xl:col-span-2 scroll-mt-20">
          <OutlierPanel />
        </div>
      </div>

      {/* Scatter modal */}
      {scatterModal !== null && fileId !== null && (
        <ScatterModal
          colX={scatterModal.colX}
          colY={scatterModal.colY}
          correlationValue={scatterModal.correlationValue}
          fileId={fileId}
          onClose={() => setScatterModal(null)}
        />
      )}
    </div>
  );
}
