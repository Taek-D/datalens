import React from 'react';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import type { HeatMapSerie, DefaultHeatMapDatum, ComputedCell } from '@nivo/heatmap';
import type { CorrelationMatrix } from '../../types/analysis';

interface CorrelationHeatmapProps {
  matrix: CorrelationMatrix;
  onCellClick: (colX: string, colY: string, value: number) => void;
}

/**
 * Transform CorrelationMatrix to HeatMapSerie[] format expected by @nivo/heatmap.
 * Each row becomes a serie: { id: rowCol, data: [{x: colCol, y: value}, ...] }
 */
function correlationToHeatmapData(
  matrix: CorrelationMatrix,
): HeatMapSerie<DefaultHeatMapDatum, object>[] {
  return matrix.columns.map((rowCol, rowIdx) => ({
    id: rowCol,
    data: matrix.columns.map((colCol, colIdx) => ({
      x: colCol,
      y: matrix.values[rowIdx]?.[colIdx] ?? null,
    })),
  }));
}

/**
 * Returns a diverging blue-white-red color for a correlation value in [-1, 1].
 * -1 → blue, 0 → white, +1 → red
 */
function correlationColor(value: number | null): string {
  if (value === null) return '#e5e7eb'; // gray-200 for missing
  const v = Math.max(-1, Math.min(1, value));
  if (v >= 0) {
    // white (0) → red (1)
    const r = 255;
    const g = Math.round(255 * (1 - v));
    const b = Math.round(255 * (1 - v));
    return `rgb(${r},${g},${b})`;
  } else {
    // blue (-1) → white (0)
    const abs = -v;
    const r = Math.round(255 * (1 - abs));
    const g = Math.round(255 * (1 - abs));
    const b = 255;
    return `rgb(${r},${g},${b})`;
  }
}

export const CorrelationHeatmap = React.memo(function CorrelationHeatmap({
  matrix,
  onCellClick,
}: CorrelationHeatmapProps) {
  if (matrix.columns.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-text-muted bg-surface rounded-lg border border-border">
        상관관계 분석에는 2개 이상의 수치형 컬럼이 필요합니다.
      </div>
    );
  }

  const data = correlationToHeatmapData(matrix);
  const dynamicHeight = Math.max(300, matrix.columns.length * 40 + 120);

  const handleClick = (
    cell: ComputedCell<DefaultHeatMapDatum>,
    _event: React.MouseEvent,
  ) => {
    const colX = String(cell.data.x);
    const colY = cell.serieId;
    const value = cell.value ?? 0;
    onCellClick(colX, colY, value);
  };

  return (
    <div style={{ height: dynamicHeight }}>
      <ResponsiveHeatMap
        data={data}
        margin={{ top: 60, right: 60, bottom: 60, left: 90 }}
        colors={(cell) => correlationColor(cell.value)}
        enableLabels={true}
        label={(cell) =>
          cell.value !== null ? (cell.value as number).toFixed(2) : ''
        }
        labelTextColor={(cell) => {
          // Use dark text on light cells, light text on dark cells
          const v = cell.value ?? 0;
          return Math.abs(v as number) > 0.6 ? '#ffffff' : '#374151';
        }}
        axisTop={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: '',
          legendOffset: 36,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: '',
          legendOffset: -72,
        }}
        axisRight={null}
        axisBottom={null}
        onClick={handleClick}
        animate={true}
        hoverTarget="cell"
        borderWidth={1}
        borderColor={{ theme: 'background' }}
      />
    </div>
  );
});
