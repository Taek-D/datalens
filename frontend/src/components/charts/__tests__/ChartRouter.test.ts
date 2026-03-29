import { describe, it, expect } from 'vitest';
import { CHART_MAP } from '../chartMap';
import { HistogramChart } from '../HistogramChart';
import { BarChartComponent } from '../BarChartComponent';
import { TimeseriesChart } from '../TimeseriesChart';
import { TextColumnPlaceholder } from '../TextColumnPlaceholder';
import type { ColumnType } from '../../../types/dataset';

describe('CHART_MAP', () => {
  it("CHART_MAP['numeric'] resolves to HistogramChart", () => {
    expect(CHART_MAP['numeric']).toBe(HistogramChart);
  });

  it("CHART_MAP['categorical'] resolves to BarChartComponent", () => {
    expect(CHART_MAP['categorical']).toBe(BarChartComponent);
  });

  it("CHART_MAP['datetime'] resolves to TimeseriesChart", () => {
    expect(CHART_MAP['datetime']).toBe(TimeseriesChart);
  });

  it("CHART_MAP['text'] resolves to TextColumnPlaceholder", () => {
    expect(CHART_MAP['text']).toBe(TextColumnPlaceholder);
  });

  it('every ColumnType key in CHART_MAP has a defined component', () => {
    const allTypes: ColumnType[] = ['numeric', 'categorical', 'datetime', 'text'];
    for (const type of allTypes) {
      expect(CHART_MAP[type]).toBeDefined();
    }
  });
});
