# Phase 3: Visualization - Research

**Researched:** 2026-03-29
**Domain:** React charting (Recharts 3.x, @nivo/heatmap 0.99), React performance (React.memo/useMemo), Vitest component testing
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 차트 레이아웃 & 구성
- 2열 그리드 배치 — 컬럼별 차트를 2열 그리드로 나열, 카드 헤더에 컬럼명 + 타입 배지
- 고정 높이 300px — 모든 차트 카드 동일 높이로 깔끔한 그리드 유지
- 페이지 섹션 순서: 요약 카드 → 품질 알림 → 분포 차트(2열 그리드) → 상관관계 히트맵 → 이상값 패널
- 미리보기 테이블 위에 요약, 아래로 점점 깊이 들어가는 EDA 워크플로 흐름

#### 히트맵 & 산점도 모달
- 파랑(-1) → 흰색(0) → 빨강(+1) 단색 그라디언트 색상 스케일
- 각 셀에 상관계수 숫자 항상 표시 (색상만으로 정확한 값 파악 어려움)
- 셀 클릭 시 센터 모달로 산점도 열기 — 배경 클릭 또는 X 버튼으로 닫기
- 산점도 모달에 차트 + 메타정보: 상관계수, 두 컬럼명, "Showing N of M" 레이블
- 산점도 데이터는 서버사이드 2,000개 다운샘플링 (Phase 2에서 결정)

#### 이상값 패널 & 토글
- 테이블 형식 레이아웃: 컬럼명 | IQR 범위 (lower~upper) | 이상값 수
- 전체 토글 — 하나의 토글로 모든 컬럼의 이상값 일괄 제외/포함
- 토글 ON 시 이상값 제외 후 히스토그램/통계 리드로우 (실시간 비교 가능)
- 이상값 없는 컬럼도 테이블에 표시하되 0건 표기 — 모든 컬럼 상황 한 눈에 확인

#### 요약 카드 & 품질 알림
- 4칸 그리드 대시보드 — row_count, column_count, missing_ratio, duplicate_count
- 결측값은 요약 카드의 missing_ratio 카드로 통합 표시 (별도 차트 불필요)
- 품질 알림은 severity에 따라 색상 구분한 배너 리스트 (warning=노랑, critical=빨강)
- 품질 알림 배치: 요약 카드 바로 아래 — 데이터 개요 확인 후 바로 품질 이슈 인지
- 배너에 컬럼명 + 메시지 표시 (상수컬럼, 높은 카디널리티, null 비율, 편향)

#### Prior Phase Decisions (carry forward)
- Tailwind CSS 4 + @theme 토큰 (bg-surface, text-primary 등)
- snake_case 유지 (camelCase 변환 없음)
- 컬럼 타입 색상 체계: numeric=파랑, categorical=보라, datetime=초록, text=회색
- Recharts (히스토그램/바/산점도/타임시리즈), @nivo/heatmap 0.99 (상관 히트맵)
- React.memo + useMemo 성능 최적화
- import type 필수 (verbatimModuleSyntax enabled)

### Claude's Discretion
- 로딩 스켈레톤 디자인
- 정확한 spacing과 typography
- 에러 상태 처리
- 히트맵 셀 호버 인터랙션 세부사항
- 차트 애니메이션/트랜지션

### Deferred Ideas (OUT OF SCOPE)
None — 논의가 Phase 3 범위 내에서 유지됨
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIZL-01 | 숫자형 컬럼에 히스토그램을 자동 렌더링한다 | Recharts 3.x BarChart + barCategoryGap={0} + pre-binned data |
| VIZL-02 | 카테고리형 컬럼에 바차트를 자동 렌더링한다 (상위 20개) | Recharts 3.x BarChart + top-20 slice in data prep |
| VIZL-03 | 날짜형 컬럼에 타임시리즈 라인차트를 자동 렌더링한다 | Recharts 3.x LineChart + XAxis tickFormatter |
| VIZL-04 | 컬럼 클릭 시 해당 차트로 포커스가 이동한다 | useRef + scrollIntoView or element.focus() |
| VIZL-05 | 수치형 컬럼 간 Pearson 상관관계 히트맵을 표시한다 | @nivo/heatmap 0.99 ResponsiveHeatMap |
| VIZL-06 | 히트맵 셀 클릭 시 해당 두 컬럼의 산점도 모달을 표시한다 | onClick: (cell, event) => void + Recharts ScatterChart modal |
| VIZL-07 | 산점도 데이터는 서버에서 2,000개 이하로 다운샘플링한다 | Backend decision (Phase 2) — frontend receives ≤2000 points |
| OTLR-01 | IQR 방식으로 각 수치형 컬럼의 이상값을 자동 탐지한다 | Backend provides outliers[] in AnalysisResultResponse |
| OTLR-02 | 각 컬럼별 이상값 개수와 IQR 경계를 표시한다 | OutlierResult: lower_bound, upper_bound, outlier_count |
| OTLR-03 | 이상값 포함/제외 토글 시 차트와 통계가 실시간 반영된다 | Zustand outlierFilter state + useMemo filtered data |
| SUMM-01 | 데이터셋 개요 카드를 표시한다 (행 수, 컬럼 수, 결측값 비율, 중복 행 수) | AnalysisResultResponse top-level fields |
| SUMM-02 | 수치형 컬럼 기초통계를 표시한다 (mean, std, min, max, Q1, median, Q3, skewness) | SummaryStats interface already defined |
| SUMM-03 | 컬럼별 결측값 분석을 시각화한다 | Integrated into missing_ratio card in SummaryCard |
| SUMM-04 | 데이터 품질 알림을 표시한다 (상수 컬럼, 높은 카디널리티, 높은 null 비율, 심한 왜도) | QualityAlert: column, alert_type, message, severity |
| PERF-02 | React.memo + useMemo로 불필요한 차트 리렌더링을 방지한다 | React.memo on chart components + Zustand selector granularity |
| PERF-03 | react-window로 대용량 데이터 테이블을 가상화한다 | Already in use (DataTable) — apply to outlier list if needed |
| TEST-02 | ChartRouter 타입 분기 로직에 유닛 테스트가 존재한다 | Vitest + pure function test pattern (no render needed for dispatch logic) |
</phase_requirements>

---

## Summary

Phase 3 builds on a complete Phase 2 backend (AnalysisResultResponse fully typed) and installs two chart libraries not yet in node_modules: **Recharts 3.x** and **@nivo/heatmap 0.99**. The tech stack is confirmed from decisions: Recharts handles histogram (BarChart), bar chart (BarChart), timeseries (LineChart), and scatter plot (ScatterChart inside modal); nivo handles the correlation heatmap only.

The critical installation challenge is **React 19 compatibility**. The project uses `react: ^19.2.4`. Recharts 3.x removed the `react-is` dependency that caused React 19 issues in 2.x, so it installs cleanly. Nivo 0.99 officially supports React 19 but may require a pnpm override for `@types/react` to resolve TypeScript JSX namespace conflicts. Both libraries require `--legacy-peer-deps` to be avoided — use pnpm overrides instead.

The outlier toggle (OTLR-03) is the most architecturally significant requirement: it needs new Zustand state (`showOutliers: boolean`) that chart components subscribe to via fine-grained selectors. `useMemo` then filters raw distribution data before passing to chart components, preventing unnecessary rerenders. The ChartRouter is a pure dispatch function — ColumnType → component — which makes it straightforwardly unit-testable without rendering.

**Primary recommendation:** Install Recharts 3.x + @nivo/heatmap 0.99 + @nivo/core 0.99. Build ChartRouter as a pure map object `CHART_MAP: Record<ColumnType, ComponentType>`. Add `showOutliers` to uiSlice. Wrap all chart components in React.memo with stable prop references via useMemo in the parent grid.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^3.8.1 (latest) | Histogram, BarChart, LineChart, ScatterChart | Locked decision from Phase 2; 3.x is React 19 clean, 2.x had react-is conflicts |
| @nivo/heatmap | ^0.99.0 | Correlation matrix heatmap | Locked decision; only nivo has production-quality React heatmap with cell-click |
| @nivo/core | ^0.99.0 | Peer dependency required by @nivo/heatmap | Always co-install with @nivo/* packages |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-window | ^2.2.7 (already installed) | Virtualize outlier table if >100 rows | PERF-03 — already in DataTable, reuse pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @nivo/heatmap | victory-heatmap | nivo locked; victory has no production heatmap |
| recharts BarChart for histogram | ComposedChart | BarChart + barCategoryGap={0} is simpler; ComposedChart only needed for mixed types |
| Recharts ScatterChart (scatter modal) | @nivo/scatterplot | Recharts already installed; avoid adding another nivo sub-package |

### Installation
```bash
# From frontend/ directory
npm install recharts @nivo/core @nivo/heatmap
```

**React 19 note:** If peer dependency conflicts arise with pnpm, add to `package.json`:
```json
"pnpm": {
  "overrides": {
    "@types/react": "^19.0.0"
  }
}
```

---

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── components/
│   ├── charts/
│   │   ├── ChartRouter.tsx         # ColumnType → chart dispatch (VIZL-01~03)
│   │   ├── HistogramChart.tsx      # numeric: Recharts BarChart barCategoryGap=0
│   │   ├── BarChart.tsx            # categorical: Recharts BarChart top-20
│   │   ├── TimeseriesChart.tsx     # datetime: Recharts LineChart + tickFormatter
│   │   ├── ScatterModal.tsx        # VIZL-06: Recharts ScatterChart in modal overlay
│   │   └── CorrelationHeatmap.tsx  # VIZL-05: @nivo/heatmap ResponsiveHeatMap
│   ├── analysis/
│   │   ├── SummaryCard.tsx         # SUMM-01: 4-stat grid card
│   │   ├── QualityAlerts.tsx       # SUMM-04: severity-colored banners
│   │   ├── OutlierPanel.tsx        # OTLR-01~03: table + global toggle
│   │   └── DistributionGrid.tsx    # VIZL-01~04: 2-col grid + column focus
│   └── (existing: DropZone, DataTable, AnalysisProgress)
├── store/
│   └── uiSlice.ts                  # ADD: showOutliers: boolean + setShowOutliers
└── hooks/
    └── useChartData.ts             # outlier-filtered data derived from store
```

### Pattern 1: ChartRouter as a Pure Dispatch Map

**What:** A constant `CHART_MAP` object maps `ColumnType` to a chart component. `ChartRouter` looks up the map and renders the matching component. No switch/if chains.

**When to use:** Always — makes the dispatch logic a pure object lookup, trivially unit-testable.

```typescript
// Source: Pattern derived from CONTEXT.md locked decisions
import type { ColumnType } from '../types/dataset';
import type { ComponentType } from 'react';

export interface ChartProps {
  columnName: string;
  data: Record<string, unknown>[];
  showOutliers: boolean;
}

const CHART_MAP: Record<ColumnType, ComponentType<ChartProps>> = {
  numeric:     HistogramChart,
  categorical: BarChartComponent,
  datetime:    TimeseriesChart,
  text:        TextColumnPlaceholder,
};

export const ChartRouter = React.memo(function ChartRouter({
  column,
  data,
  showOutliers,
}: { column: ColumnMeta; data: Record<string, unknown>[]; showOutliers: boolean }) {
  const Component = CHART_MAP[column.type];
  return <Component columnName={column.name} data={data} showOutliers={showOutliers} />;
});
```

**Unit-testing ChartRouter (TEST-02):** Test the `CHART_MAP` lookup directly without rendering:
```typescript
// Source: Vitest pure object test pattern
import { describe, it, expect } from 'vitest';
import { CHART_MAP } from '../components/charts/ChartRouter';

describe('CHART_MAP', () => {
  it('maps numeric to HistogramChart', () => {
    expect(CHART_MAP['numeric']).toBe(HistogramChart);
  });
  it('maps categorical to BarChartComponent', () => {
    expect(CHART_MAP['categorical']).toBe(BarChartComponent);
  });
  it('maps datetime to TimeseriesChart', () => {
    expect(CHART_MAP['datetime']).toBe(TimeseriesChart);
  });
  it('maps text to TextColumnPlaceholder', () => {
    expect(CHART_MAP['text']).toBe(TextColumnPlaceholder);
  });
});
```

### Pattern 2: Recharts Histogram (BarChart + barCategoryGap=0)

**What:** Recharts has no native histogram. Pre-bin data into frequency buckets in the component, then render with `BarChart` + `barCategoryGap={0}` (adjacent bars = histogram appearance).

**When to use:** VIZL-01 — numeric columns.

```typescript
// Source: Recharts 3.x BarChart API (recharts.org) + barCategoryGap=0 pattern
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function binData(values: number[], binCount = 20): { bin: string; count: number }[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    bin: `${(min + i * step).toFixed(1)}`,
    count: 0,
  }));
  values.forEach((v) => {
    const idx = Math.min(Math.floor((v - min) / step), binCount - 1);
    bins[idx].count++;
  });
  return bins;
}

export const HistogramChart = React.memo(function HistogramChart({
  columnName, data, showOutliers,
}: ChartProps) {
  const values = useMemo(() => {
    const raw = data.map((r) => r[columnName] as number).filter((v) => v != null);
    // outlier filtering handled by parent via useChartData hook
    return raw;
  }, [data, columnName]);

  const binnedData = useMemo(() => binData(values), [values]);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={binnedData} barCategoryGap={0}>
        <XAxis dataKey="bin" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
});
```

### Pattern 3: Recharts LineChart for Timeseries

**What:** `LineChart` with `XAxis tickFormatter` to format date strings.

**When to use:** VIZL-03 — datetime columns.

```typescript
// Source: Recharts 3.x LineChart API + tickFormatter pattern (GitHub issue #612)
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const TimeseriesChart = React.memo(function TimeseriesChart({
  columnName, data,
}: ChartProps) {
  const chartData = useMemo(
    () => data.map((r) => ({ date: r[columnName] as string, count: 1 })),
    [data, columnName]
  );

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData}>
        <XAxis
          dataKey="date"
          tickFormatter={(val: string) => new Date(val).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          tick={{ fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="count" dot={false} stroke="#10b981" />
      </LineChart>
    </ResponsiveContainer>
  );
});
```

### Pattern 4: @nivo/heatmap Correlation Matrix

**What:** `ResponsiveHeatMap` with `HeatMapSerie[]` data format. Data rows become series with `id` (row column name) and `data` array of `{x: colName, y: correlationValue}`.

**Critical: Data format changed in 0.87+** — old flat array format does NOT work. Must use series format.

```typescript
// Source: GitHub plouc/nivo packages/heatmap/tests/HeatMap.test.tsx (confirmed)
import { ResponsiveHeatMap } from '@nivo/heatmap';
import type { HeatMapSerie, DefaultHeatMapDatum } from '@nivo/heatmap';

function buildHeatmapData(
  matrix: CorrelationMatrix
): HeatMapSerie<DefaultHeatMapDatum, Record<string, never>>[] {
  return matrix.columns.map((rowCol, rowIdx) => ({
    id: rowCol,
    data: matrix.columns.map((colCol, colIdx) => ({
      x: colCol,
      y: matrix.values[rowIdx][colIdx] ?? null,
    })),
  }));
}

export const CorrelationHeatmap = React.memo(function CorrelationHeatmap({
  matrix,
  onCellClick,
}: {
  matrix: CorrelationMatrix;
  onCellClick: (rowCol: string, colCol: string, value: number) => void;
}) {
  const data = useMemo(() => buildHeatmapData(matrix), [matrix]);

  return (
    <div style={{ height: 400 }}>
      <ResponsiveHeatMap
        data={data}
        minValue={-1}
        maxValue={1}
        colors={{
          type: 'diverging',
          scheme: 'red_blue',   // red_blue = red(+1) → white(0) → blue(-1)
          // NOTE: nivo 'red_blue' is red-positive/blue-negative
          // For blue(negative)→white→red(positive), use 'blue_red' or reverse
          divergeAt: 0.5,
          minValue: -1,
          maxValue: 1,
        }}
        enableLabels={true}
        label={(cell) => (cell.value != null ? cell.value.toFixed(2) : '')}
        labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
        onClick={(cell) => {
          // cell.serieId = row column, cell.data.x = column column
          if (cell.value != null) {
            onCellClick(String(cell.serieId), String(cell.data.x), cell.value);
          }
        }}
        margin={{ top: 60, right: 60, bottom: 60, left: 90 }}
        axisTop={{ tickRotation: -45 }}
        axisLeft={{}}
      />
    </div>
  );
});
```

**Color scale note (MEDIUM confidence):** The `colors` prop accepts `ContinuousColorScaleConfig`. The `scheme` value `'red_blue'` is a built-in D3 diverging scheme. The exact prop structure `{ type: 'diverging', scheme, divergeAt, minValue, maxValue }` is inferred from nivo's defaults.ts and colors guide. Verify against installed package's TypeScript types — if the structure differs, use a function: `colors={(cell) => interpolateRdBu(1 - (cell.value + 1) / 2)}` with d3-scale-chromatic.

### Pattern 5: Outlier Toggle with Zustand + useMemo

**What:** `showOutliers` boolean in uiSlice. Chart data is filtered by `useChartData` hook before being passed to chart components.

**When to use:** OTLR-03 — real-time toggle.

```typescript
// uiSlice.ts addition
export interface UiSlice {
  // ... existing fields ...
  showOutliers: boolean;
  setShowOutliers: (show: boolean) => void;
}

// useChartData.ts
export function useChartData(columnName: string): Record<string, unknown>[] {
  const rawData = useStore((s) => s.rawData);
  const showOutliers = useStore((s) => s.showOutliers);
  const outliers = useStore((s) => s.analysisResult?.outliers);

  return useMemo(() => {
    if (showOutliers || !outliers) return rawData;
    const outlierResult = outliers.find((o) => o.column === columnName);
    if (!outlierResult || outlierResult.outlier_count === 0) return rawData;
    const outlierSet = new Set(outlierResult.outlier_indices);
    return rawData.filter((_, idx) => !outlierSet.has(idx));
  }, [rawData, showOutliers, outliers, columnName]);
}
```

### Pattern 6: React.memo for Chart Components (PERF-02)

**What:** Wrap every chart component in `React.memo`. Pass only primitive + stable-reference props. Use `useCallback` for event handlers passed as props.

**Critical pitfall:** If you pass a freshly created object/array as a prop, `React.memo` is negated. Pre-compute data in `useMemo` in the parent or in the hook before passing.

```typescript
// DistributionGrid.tsx — parent passes stable refs
export function DistributionGrid() {
  const columns = useStore((s) => s.columns);
  const showOutliers = useStore((s) => s.showOutliers); // primitive boolean

  const handleColumnFocus = useCallback((columnName: string) => {
    document.getElementById(`chart-${columnName}`)?.scrollIntoView({
      behavior: 'smooth', block: 'center',
    });
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      {columns.map((col) => (
        <ChartCard
          key={col.name}
          column={col}
          showOutliers={showOutliers}
          onFocus={handleColumnFocus}
        />
      ))}
    </div>
  );
}
```

### Pattern 7: Scatter Modal (VIZL-06)

**What:** CSS fixed overlay with centered card. Recharts `ScatterChart` inside. Opened by heatmap cell click, closed by backdrop or X button.

```typescript
// ScatterModal.tsx
interface ScatterModalProps {
  colX: string;
  colY: string;
  correlationValue: number;
  scatterData: { x: number; y: number }[];
  totalPoints: number;
  onClose: () => void;
}

export function ScatterModal({ colX, colY, correlationValue, scatterData, totalPoints, onClose }: ScatterModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 w-[560px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="font-semibold text-sm">{colX} vs {colY}</p>
            <p className="text-xs text-text-muted">
              Pearson r = {correlationValue.toFixed(3)} · Showing {scatterData.length} of {totalPoints}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <XAxis dataKey="x" name={colX} tick={{ fontSize: 11 }} />
            <YAxis dataKey="y" name={colY} tick={{ fontSize: 11 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={scatterData} fill="#6366f1" opacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Inline object props to memoized components:** `<Chart data={{...}} />` creates new reference every render, defeating React.memo. Always `useMemo` or lift data out.
- **Subscribing to entire analysisResult in chart components:** `useStore(s => s.analysisResult)` causes rerender on ANY analysis field change. Select only the specific slice needed.
- **Using old nivo flat data format:** `[{x, y, value}]` is pre-0.87 API and will throw runtime errors. Use `[{id, data: [{x, y}]}]`.
- **Rendering ScatterChart inside heatmap cell:** Always open in a separate modal — never nest SVG inside SVG cells.
- **Using `barCategoryGap="10%"` (default) for histogram:** Default leaves gaps between bars. Set `barCategoryGap={0}` explicitly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Histogram frequency binning | Custom bin algorithm from scratch | Simple `Math.floor((v-min)/step)` formula (10 lines) is sufficient — BUT do NOT build a full D3 histogram | D3 histogram handles edge cases (outlier buckets, empty bins); for simple EDA the 10-line version is fine |
| Color interpolation for heatmap | Custom CSS gradient interpolation | nivo built-in `scheme: 'red_blue'` diverging scale | Nivo handles D3 color interpolation, domain mapping, cell rendering |
| Modal accessibility (focus trap) | Custom focus trap logic | Keep it simple — `onClick` backdrop close + `Escape` key handler | Full a11y focus trap is v2 scope; basic close interactions are sufficient for EDA tool |
| Chart responsiveness | Manual ResizeObserver | `ResponsiveContainer` (Recharts) / `ResponsiveHeatMap` (nivo) | Both handle container size changes automatically |

**Key insight:** The scatter modal data (≤2,000 points) comes pre-downsampled from the server. Do NOT re-sample on the frontend. Just pass `scatterData` directly to `ScatterChart`.

---

## Common Pitfalls

### Pitfall 1: @nivo/heatmap Data Format Mismatch
**What goes wrong:** Runtime error — heatmap renders blank or throws "cannot read x of undefined".
**Why it happens:** Using the pre-0.87 flat format `[{x, y, value}]` instead of the 0.87+ series format `[{id, data: [{x, y}]}]`.
**How to avoid:** Always structure as `HeatMapSerie[]` — array of `{id: string, data: {x: string, y: number|null}[]}`.
**Warning signs:** TypeScript type error on the `data` prop at compile time (use the type, it catches this).

### Pitfall 2: React.memo Negated by Unstable Props
**What goes wrong:** Chart rerenders on every parent render despite React.memo, causing performance issues with many columns.
**Why it happens:** Parent passes freshly created array/object literal as prop on every render.
**How to avoid:** Use `useMemo` for derived data before passing to chart. Use `useCallback` for all event handler props. Use primitive props (string, number, boolean) where possible.
**Warning signs:** React DevTools Profiler shows chart components highlighted on every keypress / store update.

### Pitfall 3: nivo + React 19 TypeScript JSX Namespace Conflict
**What goes wrong:** TypeScript compilation error about JSX.Element / React.JSX.Element conflict.
**Why it happens:** Nivo's older type definitions use the global `JSX` namespace which conflicts with React 19's `React.JSX` approach.
**How to avoid:** Add to `package.json` pnpm overrides: `"@types/react": "^19.0.0"`. Or add `declare global { namespace JSX { ... } }` shim in a `global.d.ts` file.
**Warning signs:** TypeScript error mentioning `JSX.Element` or `IntrinsicElements` on nivo components.

### Pitfall 4: Recharts Tooltip Content Prop in 3.x
**What goes wrong:** Custom tooltip via `content` prop breaks after upgrading from 2.x to 3.x.
**Why it happens:** `content` prop now expects `TooltipContentProps` not `TooltipProps`.
**How to avoid:** Use `<Tooltip />` without custom content for Phase 3 (default tooltip is sufficient for EDA). If custom tooltip needed, use the new `TooltipContentProps` type.
**Warning signs:** TypeScript type error on the `content` prop of `<Tooltip>`.

### Pitfall 5: Column Focus Scroll (VIZL-04) Breaking with 2-Col Grid
**What goes wrong:** `scrollIntoView` fails or scrolls to wrong element when columns are in a grid.
**Why it happens:** Element IDs must be unique and match the column name exactly. Grid reordering can confuse the mapping.
**How to avoid:** Use `id={`chart-${col.name}`}` on each chart card container. Call `document.getElementById(...)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`.
**Warning signs:** Scroll jumps to wrong element or does nothing.

### Pitfall 6: Zustand Selector Over-subscription
**What goes wrong:** All chart cards rerender when any unrelated state changes (e.g., `analysisStep` changes).
**Why it happens:** Using `useStore(s => s)` (full store) or subscribing to a parent object when only a leaf value is needed.
**How to avoid:** Each component subscribes only to what it needs: `useStore(s => s.showOutliers)`, not `useStore(s => s.uiSlice)`.
**Warning signs:** React DevTools shows all chart components re-rendering during analysis progress step changes.

---

## Code Examples

### CorrelationMatrix → HeatMapSerie conversion
```typescript
// Source: HeatMapSerie type from github.com/plouc/nivo packages/heatmap/src/types.ts (confirmed)
import type { CorrelationMatrix } from '../types/analysis';
import type { DefaultHeatMapDatum, HeatMapSerie } from '@nivo/heatmap';

export function correlationToHeatmapData(
  matrix: CorrelationMatrix
): HeatMapSerie<DefaultHeatMapDatum, Record<string, never>>[] {
  return matrix.columns.map((rowId, rowIdx) => ({
    id: rowId,
    data: matrix.columns.map((colId, colIdx) => ({
      x: colId,
      y: matrix.values[rowIdx][colIdx] ?? null,
    })),
  }));
}
```

### onClick handler with cell datum type
```typescript
// Source: github.com/plouc/nivo packages/heatmap/src/types.ts — onClick: (cell: ComputedCell<Datum>, event: MouseEvent) => void
import type { ComputedCell, DefaultHeatMapDatum } from '@nivo/heatmap';

const handleHeatmapClick = useCallback(
  (cell: ComputedCell<DefaultHeatMapDatum>, _event: React.MouseEvent) => {
    if (cell.value == null) return;
    setModalState({
      colX: String(cell.data.x),
      colY: String(cell.serieId),
      correlationValue: cell.value,
    });
  },
  []
);
```

### Recharts ScatterChart for modal
```typescript
// Source: Recharts 3.x API (recharts.org)
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// scatterData shape — server returns downsampled points as {col_x: number, col_y: number}
// Frontend maps to Recharts format:
const chartData = useMemo(
  () => rawPoints.map(p => ({ x: p[colX] as number, y: p[colY] as number })),
  [rawPoints, colX, colY]
);
```

### Zustand showOutliers addition to uiSlice
```typescript
// Addition to existing uiSlice.ts (verbatimModuleSyntax — use import type)
export interface UiSlice {
  status: AppStatus;
  error: string | null;
  analysisStep: string | null;
  showOutliers: boolean;                              // NEW
  setStatus: (status: AppStatus) => void;
  setError: (error: string | null) => void;
  setAnalysisStep: (step: string | null) => void;
  setShowOutliers: (show: boolean) => void;           // NEW
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  status: 'idle',
  error: null,
  analysisStep: null,
  showOutliers: true,                                 // Default: show outliers (inclusive)
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setAnalysisStep: (step) => set({ analysisStep: step }),
  setShowOutliers: (show) => set({ showOutliers: show }),
});
```

### App.tsx 'done' case update
```typescript
// App.tsx renderContent() 'done' case — replace placeholder div
case 'done':
  return (
    <div className="flex flex-col gap-6">
      <SummaryCard />
      <QualityAlerts />
      <DistributionGrid />
      <CorrelationHeatmap />
      <OutlierPanel />
      <DataTable columns={columns} data={rawData} />
    </div>
  );
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| recharts 2.x with react-is dependency | recharts 3.x — react-is removed, React 19 clean | 2024 (3.0 release) | Can install without overrides on React 19 |
| @nivo/heatmap flat data `[{x,y,value}]` | Series format `[{id, data:[{x,y}]}]` | nivo 0.87 (breaking change) | Old examples on StackOverflow/blogs are wrong |
| React.memo with `defaultProps` (removed in React 19) | Explicit default parameter values | React 19 (2024) | recharts 3.x fixed this; don't rely on defaultProps |
| Global `JSX` namespace (TypeScript) | `React.JSX` namespace | TypeScript 5.1+ / React 18+ | Some nivo types still use old namespace — requires override |

**Deprecated/outdated:**
- nivo flat heatmap data format: replaced by series format in 0.87
- recharts `Customized` component: deprecated in 3.x, use hooks instead
- recharts `activeIndex` prop on Bar/Area: removed in 3.x

---

## Open Questions

1. **nivo colors `type: 'diverging'` exact config shape**
   - What we know: `ContinuousColorScaleConfig` accepts a diverging type; `'red_blue'` is a valid D3 diverging scheme; `minValue`/`maxValue` are supported props on `ResponsiveHeatMap`
   - What's unclear: Whether `colors={{ type: 'diverging', scheme: 'red_blue', divergeAt: 0.5 }}` is the exact runtime shape or whether it needs `minValue/maxValue` inside the colors object vs. as top-level props
   - Recommendation: During implementation, first try `colors={{ type: 'diverging', scheme: 'red_blue', divergeAt: 0.5 }}` with `minValue={-1} maxValue={1}` as top-level props. If TypeScript rejects, fall back to `colors={(cell) => d3.interpolateRdBu(1 - (cell.value! + 1) / 2)}` using d3-scale-chromatic (already a transitive dependency of nivo).

2. **Scatter data source for modal**
   - What we know: Phase 2 backend returns `outlier_indices` per column but the scatter data (2000 downsampled points) is mentioned in CONTEXT.md as a Phase 2 backend decision
   - What's unclear: Whether the backend already returns scatter-ready `{col_x, col_y}[]` data as part of `AnalysisResultResponse` or if the frontend needs to derive it from `rawData` (preview is only 50 rows — insufficient for scatter)
   - Recommendation: Check if backend `AnalysisResultResponse` already includes scatter data fields. If not, the modal will need to re-use the `rawData` (preview 50 rows) with a note "Showing N of 50 (preview)" OR the backend needs a `/api/scatter` endpoint. This is a critical integration question to resolve in the plan.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.2 |
| Config file | `frontend/vite.config.ts` (test block with jsdom environment) |
| Quick run command | `cd frontend && npm run test` (vitest run) |
| Full suite command | `cd frontend && npm run test` (same — passWithNoTests: true) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-02 | `CHART_MAP` dispatches correct component for each ColumnType | unit | `npx vitest run src/components/charts/ChartRouter.test.ts -x` | ❌ Wave 0 |
| VIZL-01 | HistogramChart renders BarChart with binned data | unit (render) | `npx vitest run src/components/charts/HistogramChart.test.tsx -x` | ❌ Wave 0 |
| VIZL-02 | BarChartComponent renders top-20 categories | unit (render) | `npx vitest run src/components/charts/BarChart.test.tsx -x` | ❌ Wave 0 |
| OTLR-03 | useChartData filters outlier indices when showOutliers=false | unit (hook) | `npx vitest run src/hooks/useChartData.test.ts -x` | ❌ Wave 0 |
| PERF-02 | Chart components do not rerender on unrelated store updates | unit (spy) | `npx vitest run src/components/charts/ChartRouter.test.ts -x` | ❌ Wave 0 |
| SUMM-01 | SummaryCard renders row_count, column_count, missing_ratio, duplicate_count | unit (render) | `npx vitest run src/components/analysis/SummaryCard.test.tsx -x` | ❌ Wave 0 |
| SUMM-04 | QualityAlerts renders warning/critical banners with correct Tailwind color classes | unit (render) | `npx vitest run src/components/analysis/QualityAlerts.test.tsx -x` | ❌ Wave 0 |
| VIZL-06 | ScatterModal opens on heatmap click, closes on backdrop click | unit (render + event) | `npx vitest run src/components/charts/ScatterModal.test.tsx -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd frontend && npm run test`
- **Per wave merge:** `cd frontend && npm run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/components/charts/ChartRouter.test.ts` — covers TEST-02, PERF-02
- [ ] `frontend/src/components/charts/HistogramChart.test.tsx` — covers VIZL-01
- [ ] `frontend/src/components/charts/BarChart.test.tsx` — covers VIZL-02
- [ ] `frontend/src/components/charts/ScatterModal.test.tsx` — covers VIZL-06
- [ ] `frontend/src/components/analysis/SummaryCard.test.tsx` — covers SUMM-01
- [ ] `frontend/src/components/analysis/QualityAlerts.test.tsx` — covers SUMM-04
- [ ] `frontend/src/hooks/useChartData.test.ts` — covers OTLR-03
- [ ] MSW handler additions: scatter data endpoint (if needed — see Open Questions #2)

---

## Sources

### Primary (HIGH confidence)
- `github.com/plouc/nivo/blob/master/packages/heatmap/tests/HeatMap.test.tsx` — confirmed HeatMapSerie data format `{id, data:[{x,y}]}[]`
- `github.com/plouc/nivo/blob/master/packages/heatmap/src/types.ts` — confirmed TypeScript types: HeatMapDatum, onClick signature `(cell: ComputedCell<Datum>, event: MouseEvent) => void`, enableLabels, label props
- `github.com/plouc/nivo/blob/master/packages/heatmap/src/defaults.ts` — confirmed default props: enableLabels=true, label='formattedValue', labelTextColor modifier
- `github.com/recharts/recharts/wiki/3.0-migration-guide` — confirmed 3.x breaking changes (Tooltip props, YAxis multi-axis, ResponsiveContainer ref)
- Existing codebase: `frontend/src/types/analysis.ts`, `frontend/src/types/dataset.ts`, `frontend/src/store/`, `frontend/src/hooks/`, `frontend/package.json`

### Secondary (MEDIUM confidence)
- `github.com/plouc/nivo/issues/2618` — React 19 now officially supported in nivo 0.99; pnpm override may be needed for @types/react
- `github.com/recharts/recharts/issues/4558` — Recharts 2.x had React 19 issues via react-is; 3.x resolves this
- WebSearch: recharts 3.x latest version 3.8.1 (npm)
- WebSearch: nivo diverging color schemes include `'red_blue'` as a valid DivergingColorSchemeId
- WebSearch: `barCategoryGap={0}` on BarChart creates adjacent bars (histogram appearance)
- WebSearch: XAxis `tickFormatter` for datetime formatting in LineChart

### Tertiary (LOW confidence)
- nivo `colors={{ type: 'diverging', scheme: 'red_blue', divergeAt: 0.5 }}` config shape — inferred from defaults.ts and colors guide; exact runtime prop structure not directly confirmed from source
- `ContinuousColorScaleConfig` exact interface — GitHub source file path returned 404; inferred from defaults behavior and DivergingColorSchemeId search results

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — both libraries are locked decisions; versions confirmed from npm; React 19 compatibility confirmed from GitHub issues
- Architecture: HIGH — ChartRouter pattern, data formats, Zustand slice additions all derive directly from existing codebase types and locked CONTEXT.md decisions
- nivo heatmap colors exact API: MEDIUM — color scheme names confirmed; exact `ContinuousColorScaleConfig` prop structure is inferred (fallback strategy documented)
- Pitfalls: HIGH — nivo data format change confirmed from test file; React.memo pitfalls from official React docs; Zustand over-subscription from React profiler best practices
- Open question on scatter data source: must be resolved during planning

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (30 days — both libraries are stable, not fast-moving)
