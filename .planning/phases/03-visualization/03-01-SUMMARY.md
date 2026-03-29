---
phase: 03-visualization
plan: "01"
subsystem: frontend-charts
tags: [recharts, visualization, zustand, react-memo, tdd]
dependency_graph:
  requires: [02-02]
  provides: [VIZL-01, VIZL-02, VIZL-03, VIZL-04, PERF-02, TEST-02]
  affects: [frontend/src/components/charts, frontend/src/components/analysis, frontend/src/hooks, frontend/src/store]
tech_stack:
  added: [recharts@3.8.1]
  patterns: [CHART_MAP type-dispatch, React.memo + useMemo, fine-grained Zustand selectors, Wave 0 TDD stubs]
key_files:
  created:
    - frontend/src/components/charts/ChartRouter.tsx
    - frontend/src/components/charts/HistogramChart.tsx
    - frontend/src/components/charts/BarChartComponent.tsx
    - frontend/src/components/charts/TimeseriesChart.tsx
    - frontend/src/components/charts/TextColumnPlaceholder.tsx
    - frontend/src/components/charts/ChartCard.tsx
    - frontend/src/components/analysis/DistributionGrid.tsx
    - frontend/src/hooks/useChartData.ts
    - frontend/src/components/charts/__tests__/ChartRouter.test.ts
    - frontend/src/components/charts/__tests__/HistogramChart.test.tsx
    - frontend/src/components/charts/__tests__/BarChart.test.tsx
    - frontend/src/hooks/__tests__/useChartData.test.ts
  modified:
    - frontend/src/store/uiSlice.ts
    - frontend/src/store/index.ts
    - frontend/package.json
    - frontend/pnpm-lock.yaml
decisions:
  - "TextColumnPlaceholder accepts ChartProps (columnName + data) instead of a custom interface — allows direct CHART_MAP entry without a wrapper component"
  - "DistributionGrid uses per-column ColumnChartRow subcomponent so each useChartData hook call is isolated and only re-renders when that column's data changes"
  - "pnpm (not npm) is the package manager for frontend/ — npm install fails due to pnpm-style node_modules/.pnpm symlink structure"
metrics:
  duration: "8 min"
  completed_date: "2026-03-29"
  tasks_completed: 2
  files_changed: 16
  tests_added: 11
  tests_total: 40
---

# Phase 3 Plan 01: Distribution Chart Pipeline Summary

**One-liner:** CHART_MAP type-dispatch routing four Recharts chart components through a 2-column grid with outlier-filtered data hook and showOutliers Zustand state.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Install Recharts + showOutliers state + useChartData hook + Wave 0 test stubs | 35ba854 | useChartData.ts, uiSlice.ts, 4 test files |
| 2 | Create chart components + ChartRouter + DistributionGrid + ChartCard | 1aefe3e | 7 new components |

## What Was Built

### Chart Pipeline Architecture

```
DistributionGrid
  └── ColumnChartRow (per column, React.memo)
        ├── useChartData(columnName)   ← outlier-filtered data
        ├── ChartCard                  ← 300px card + type badge + scrollIntoView
        └── ChartRouter                ← CHART_MAP[column.type] dispatch
              ├── HistogramChart       ← numeric (20 bins, #3b82f6)
              ├── BarChartComponent    ← categorical (top 20, #8b5cf6)
              ├── TimeseriesChart      ← datetime (ko-KR locale, #10b981)
              └── TextColumnPlaceholder ← text (no-viz message)
```

### CHART_MAP Dispatch
`CHART_MAP: Record<ColumnType, ComponentType<ChartProps>>` exported from ChartRouter — maps each of the 4 ColumnTypes to its Recharts component. Tested by 5 unit tests.

### useChartData Hook
Fine-grained selectors: `useStore(s => s.rawData)`, `useStore(s => s.showOutliers)`, `useStore(s => s.analysisResult?.outliers)`. When `showOutliers` is false, builds a `Set<number>` from `outlier_indices` and filters rawData by row index.

### showOutliers State
Added to UiSlice: `showOutliers: boolean` (default `true`) + `setShowOutliers(show: boolean)`. Added to `initialState` in store/index.ts. Plan 03 (outlier panel) will toggle this.

### ChartCard
- `id="chart-{columnName}"` for scroll targeting
- Fixed height 300px with `flex flex-col`
- Type badge colors: numeric=blue, categorical=purple, datetime=green, text=gray
- Header button calls `onFocus?.(column.name)` on click

### DistributionGrid
- `grid grid-cols-1 md:grid-cols-2 gap-4`
- `handleColumnFocus` uses `scrollIntoView({ behavior: 'smooth', block: 'nearest' })`
- Empty state message when no columns

## Test Results

```
Test Files  9 passed (9)
     Tests  38 passed | 2 todo (40)
  Duration  2.34s
```

New tests added:
- `ChartRouter.test.ts` — 5 CHART_MAP dispatch tests (all GREEN)
- `HistogramChart.test.tsx` — 2 render smoke tests (GREEN) + 1 todo
- `BarChart.test.tsx` — 2 render smoke tests (GREEN) + 1 todo
- `useChartData.test.ts` — 2 behavioral tests (GREEN)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TextColumnPlaceholder prop interface mismatch**
- **Found during:** Task 2 implementation
- **Issue:** Plan specified `TextColumnPlaceholder` with `{ columnName: string }` props, but `CHART_MAP` requires `ComponentType<ChartProps>` where `ChartProps` includes `data`. A wrapper component would have been needed, but `CHART_MAP['text']` test expects the actual `TextColumnPlaceholder` reference — not a wrapper.
- **Fix:** Made `TextColumnPlaceholder` accept `ChartProps` (`columnName + data`) directly. The `data` prop is simply unused in the text placeholder.
- **Files modified:** `frontend/src/components/charts/TextColumnPlaceholder.tsx`
- **Commit:** 1aefe3e

### npm vs pnpm
- **Found during:** Task 1 (Recharts installation)
- **Issue:** `npm install` failed with arborist `Cannot read properties of null (reading 'matches')` error due to pnpm-style node_modules symlinks.
- **Fix:** Used pnpm (`/c/Users/PC/AppData/Roaming/npm/pnpm add recharts`) as the correct package manager. Added to decisions.
- **Classification:** Rule 3 (blocking issue auto-fixed)

## Self-Check: PASSED

All 9 created files found on disk. Both task commits (35ba854, 1aefe3e) verified in git log. 38/38 tests pass, 0 TypeScript errors.
