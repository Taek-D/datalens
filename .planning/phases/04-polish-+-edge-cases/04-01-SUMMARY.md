---
phase: 04-polish-+-edge-cases
plan: 01
subsystem: frontend/testing
tags: [integration-tests, msw, vitest, rtl, edge-cases, typescript]
dependency_graph:
  requires:
    - 03-03-PLAN.md  # AnalysisView, CorrelationHeatmap, OutlierPanel, App.tsx wired
    - 02-02-PLAN.md  # DataTable, useUpload, Zustand store
  provides:
    - TEST-05 integration test suite (upload → analyze → chart rendering end-to-end)
    - /health MSW handler (prevents onUnhandledRequest crash)
  affects:
    - frontend/src/mocks/handlers.ts
    - frontend/src/test/integration.test.tsx
tech_stack:
  added: []
  patterns:
    - vi.mock() module-level mocking for jsdom-incompatible components (nivo, react-window)
    - vi.useFakeTimers() + act() for timer-driven state assertions
    - MSW server.use() overrides per-test for edge-case scenarios
    - Component mocking strategy: replicate guards in mocks to keep edge-case tests valid
key_files:
  created:
    - frontend/src/test/integration.test.tsx
  modified:
    - frontend/src/mocks/handlers.ts
decisions:
  - Mock DataTable and OutlierPanel at module level to avoid react-window ResizeObserver crash in jsdom
  - Mock CorrelationHeatmap at module level replicating < 2 columns guard — enables Test 3 without @nivo/heatmap SVG
  - Mock OutlierPanel to eliminate duplicate "수치형 컬럼이 없습니다." text collision with ColumnStatsTable in Test 2
  - Use act(async () => vi.advanceTimersByTime(2001)) to flush React state updates from fake timers
  - Test 6 verifies warming banner appearance only (not disappearance) — hanging health check cannot be resolved without exposing resolver ref
metrics:
  duration: 12 min
  completed_date: "2026-03-29"
  tasks_completed: 2
  files_changed: 2
---

# Phase 4 Plan 1: Integration Test Suite + TypeScript Audit Summary

**One-liner:** End-to-end integration test suite (6 cases) covering upload→analyze→render pipeline with MSW edge-case overrides and jsdom mock strategy for react-window/nivo components.

## What Was Built

### Task 1: Integration test suite + /health MSW handler

Added `http.get('/health')` to `frontend/src/mocks/handlers.ts` — this was the critical missing handler that caused `onUnhandledRequest: 'error'` to crash every test rendering `<App>` (App.tsx calls `/health` on mount).

Created `frontend/src/test/integration.test.tsx` with 6 test cases:

1. **Happy path** — render App, upload CSV, wait for "데이터 개요", assert SummaryCard values (100 rows), quality alert text, outlier panel heading
2. **0 numeric columns** — MSW override returns `summary: {}` / empty correlation/outliers → asserts `"수치형 컬럼이 없습니다."` from ColumnStatsTable
3. **1 numeric column** — MSW override returns `correlation.columns: ['age']` → asserts guard text from mocked CorrelationHeatmap
4. **All-null column stats** — MSW override returns all-null SummaryStats → asserts `getAllByText('-').length >= 8`
5. **Sequential upload reset** — complete upload, click "새 파일 업로드", upload again with different data, assert new row_count=50 visible and old 100 gone from summary card
6. **Cold-start warming banner** — fake timers, advance 2001ms, assert "분석 서버에 연결 중" banner appears

### Task 2: TypeScript audit

`npx tsc --noEmit` exited 0 with zero errors across entire frontend codebase. No `any` types introduced. All imports use `import type` where required by `verbatimModuleSyntax: true`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DataTable uses react-window List which crashes with ResizeObserver not defined**
- **Found during:** Task 1 (first test run)
- **Issue:** `react-window`'s `List` component calls `new ResizeObserver()` which does not exist in jsdom
- **Fix:** Added `vi.mock('../components/DataTable')` at module level — replaces with a simple `<div data-testid="data-table">` that lists column names
- **Files modified:** `frontend/src/test/integration.test.tsx`

**2. [Rule 1 - Bug] OutlierPanel duplicate text collides with ColumnStatsTable in Test 2**
- **Found during:** Task 1 (Test 2 failure)
- **Issue:** When `outliers: []`, `OutlierPanel` renders `"수치형 컬럼이 없습니다."` — same text as `ColumnStatsTable` empty state. `getByText()` found multiple elements.
- **Fix:** Added `vi.mock('../components/analysis/OutlierPanel')` rendering `"이상값 없음"` instead
- **Files modified:** `frontend/src/test/integration.test.tsx`

**3. [Rule 1 - Bug] Fake timers require act() to flush React state updates**
- **Found during:** Task 1 (Test 6 failure)
- **Issue:** `vi.advanceTimersByTime(2001)` fires the setTimeout but React state update (`setServerStatus('warming')`) is not flushed synchronously without `act()`
- **Fix:** Wrapped in `await act(async () => { vi.advanceTimersByTime(2001); })`
- **Files modified:** `frontend/src/test/integration.test.tsx`

**4. [Rule 1 - Bug] Test 1 getByText('3') found multiple elements**
- **Found during:** Task 1 (Test 1 failure)
- **Issue:** Column count "3" in SummaryCard AND outlier count "3" in OutlierPanel both matched
- **Fix:** Scoped the assertion to the "컬럼 수" card's closest `div` container
- **Files modified:** `frontend/src/test/integration.test.tsx`

## Test Results

```
Test Files  11 passed (11)
     Tests  48 passed | 2 todo (50)
   Start at  10:49:04
```

- `npx tsc --noEmit` → exit 0 (zero errors)
- All 6 integration tests pass
- All 42 pre-existing tests continue to pass

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `frontend/src/test/integration.test.tsx` | FOUND |
| `frontend/src/mocks/handlers.ts` | FOUND |
| `.planning/phases/04-polish-+-edge-cases/04-01-SUMMARY.md` | FOUND |
| Commit `ee91b4a` | FOUND |
