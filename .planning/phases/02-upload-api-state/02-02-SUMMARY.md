---
phase: 02-upload-api-state
plan: "02"
subsystem: frontend
tags: [react, zustand, msw, vitest, react-window, typescript, upload, analysis]
dependency_graph:
  requires: [02-01]
  provides: [Zustand store (3 slices + resetStore), uploadFile API, analyzeDataset API, useUpload hook, useAnalysis hook, DropZone component, DataTable component, AnalysisProgress component]
  affects: [Phase 3 chart rendering, frontend App.tsx conditional rendering]
tech_stack:
  added: [zustand 5.0.12, react-window 2.2.7, msw 2.12.14]
  patterns: [Zustand slice pattern, MSW node server for tests, react-window 2.x rowProps API, verbatimModuleSyntax import type compliance]
key_files:
  created:
    - frontend/src/types/analysis.ts
    - frontend/src/store/datasetSlice.ts
    - frontend/src/store/analysisSlice.ts
    - frontend/src/store/uiSlice.ts
    - frontend/src/store/index.ts
    - frontend/src/api/analysisApi.ts
    - frontend/src/api/analysisApi.test.ts
    - frontend/src/mocks/handlers.ts
    - frontend/src/mocks/server.ts
    - frontend/src/hooks/useUpload.ts
    - frontend/src/hooks/useUpload.test.ts
    - frontend/src/hooks/useAnalysis.ts
    - frontend/src/hooks/useAnalysis.test.ts
    - frontend/src/components/DropZone.tsx
    - frontend/src/components/DataTable.tsx
    - frontend/src/components/AnalysisProgress.tsx
  modified:
    - frontend/src/types/dataset.ts (added file_id: string to UploadResponse)
    - frontend/src/test/setup.ts (MSW lifecycle hooks)
    - frontend/src/App.tsx (full conditional rendering with all 5 status states)
    - frontend/package.json / pnpm-lock.yaml (added zustand, react-window, msw)
decisions:
  - "react-window 2.x uses List + rowProps API (not FixedSizeList) — row data passed via rowProps, received as extra props in rowComponent"
  - "import type used for all type-only imports — required by verbatimModuleSyntax tsconfig setting"
  - "Cosmetic analysis steps (4 x 300ms) shown before API response — backend does all analysis in one POST /api/analyze call, steps are UX-only progress indicators"
  - "useAnalysis auto-trigger guards on both status==='analyzing' AND fileId !== null — prevents spurious API calls on status-only changes"
  - "validateFile exported as named function (not closure) — enables direct unit testing of validation logic independent of hook rendering"
metrics:
  duration: "24 min"
  completed_date: "2026-03-27"
  tasks_completed: 2
  files_created: 16
  files_modified: 4
  tests_added: 21
---

# Phase 2 Plan 2: Frontend Upload-to-Analysis Pipeline Summary

React frontend upload-to-analysis pipeline — Zustand 3-slice store with resetStore, typed API layer (uploadFile + analyzeDataset), MSW-mocked test infrastructure, drag-and-drop DropZone, react-window 2.x virtualized DataTable, AnalysisProgress with cosmetic steps, and 21 passing Vitest tests.

## What Was Built

### TypeScript Types

**`frontend/src/types/analysis.ts`** — Full type coverage mirroring `backend/schemas/analysis.py`:
- `SummaryStats` — 8 numeric|null fields (mean/std/min/max/q1/median/q3/skewness)
- `CorrelationMatrix` — columns list + nested `(number | null)[][]` values
- `OutlierResult` — per-column IQR bounds + outlier indices
- `QualityAlert` — typed alert with severity
- `AnalysisResultResponse` — aggregates all four sections + dataset-level metrics

**`frontend/src/types/dataset.ts`** — Added `file_id: string` to `UploadResponse` (mirrors backend Plan 02-01 change).

### Zustand Store (3 Slices)

| Slice | State | Actions |
|---|---|---|
| `datasetSlice` | rawData, columns, rowCount, fileId | setDataset |
| `analysisSlice` | analysisResult | setAnalysisResult |
| `uiSlice` | status, error, analysisStep | setStatus, setError, setAnalysisStep |

`store/index.ts` combines all three + `resetStore()` that resets to full initial state.

### API Service Layer (`frontend/src/api/analysisApi.ts`)

- `uploadFile(file: File)` — POST `/api/upload` with FormData, returns typed `UploadResponse`
- `analyzeDataset(fileId: string)` — POST `/api/analyze` with JSON body, returns typed `AnalysisResultResponse`
- Both use `apiClient` from `./client.ts` and extract `.data` from axios response

### MSW Mock Infrastructure

- `mocks/handlers.ts` — Realistic mock for both endpoints with typed responses (3 columns, 5 preview rows, 1 outlier, 1 quality alert)
- `mocks/server.ts` — `setupServer(...handlers)` for Node test environment
- `test/setup.ts` — MSW lifecycle: `beforeAll(listen)` / `afterEach(reset)` / `afterAll(close)` + explicit vitest imports

### Hooks

**`useUpload`**:
- `validateFile(file)` — checks `.csv`/`.json` extension and 10MB size limit, returns error string or null
- `processUpload(file)` — store transitions `idle → uploading → analyzing`, simulated progress interval
- Handles axios error codes: 413 (file too large), 400 (bad format), generic network errors
- `resetUpload()` calls `resetStore()` returning to idle

**`useAnalysis`**:
- `useEffect` watches `status === 'analyzing' && fileId !== null` to auto-trigger
- Cosmetic steps: "파싱 중..." → "통계 분석 중..." → "상관관계 계산 중..." → "이상값 탐지 중..." at 300ms intervals
- On success: `setAnalysisResult(result)` → `setStatus('done')` → `setAnalysisStep(null)`
- `retryAnalysis()` sets status back to 'analyzing' to re-trigger the useEffect

### Components

**`DropZone`** — Centered dashed card with:
- Drag hover: `border-blue-500 bg-blue-50` (solid blue tint)
- Upload progress: linear `bg-blue-500 h-2` bar with percentage
- Error state: red text in `bg-red-50 border-red-200` pill
- "또는 파일 선택" button triggering hidden `<input type="file">`
- "최대 10MB" caption

**`DataTable`** — react-window 2.x `List` with `rowProps` API:
- Sticky non-virtualized header with column name + type badge (blue/purple/green/gray)
- Virtualized rows via `rowComponent` + `rowProps` (data passed to row component)
- `null`/`undefined` displayed as gray italic "null"
- `overflow-x-auto` wrapper for horizontal scrolling

**`AnalysisProgress`** — `animate-spin` SVG circle + current step text, hidden when `analysisStep` is null.

### App.tsx Conditional Rendering

| Status | Rendered |
|---|---|
| `idle` | `<DropZone />` |
| `uploading` | `<DropZone />` (shows internal progress) |
| `analyzing` | `<AnalysisProgress />` + `<DataTable />` (preview) |
| `done` | "새 파일 업로드" button + `<DataTable />` + Phase 3 placeholder |
| `error` (no data) | `<DropZone />` (retry from scratch) |
| `error` (with data) | Inline red error banner + "다시 시도" button + `<DataTable />` |

### Test Coverage (21 tests)

- `analysisApi.test.ts` — 4 tests: upload success, upload 413 error, analyze success, analyze 500 error
- `useUpload.test.ts` — 12 tests: validateFile (6 cases), hook integration (6 cases)
- `useAnalysis.test.ts` — 5 tests: auto-trigger, success flow, error flow, retry, no-fileId guard

## Decisions Made

1. **react-window 2.x `rowProps` API**: v2 changed from `FixedSizeList` (v1) to `List` with a `rowProps` generic — data passed to row component as extra props merged with `{ index, style, ariaAttributes }`.
2. **`import type` for all type-only imports**: `verbatimModuleSyntax` is enabled in tsconfig — all interface/type imports require `import type` or build fails.
3. **Cosmetic analysis steps**: Backend runs all four analysis services in one `POST /api/analyze` call. Steps are UX-only with 300ms setTimeout intervals shown while the real API call is in flight.
4. **validateFile exported**: Named export (not hook-internal closure) enables pure unit testing of validation logic without `renderHook` overhead.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `verbatimModuleSyntax` requires `import type` for all type-only imports**
- **Found during:** Build verification after Task 1 commit
- **Issue:** TypeScript error TS1484 on 9 files: `'X' is a type and must be imported using a type-only import`
- **Fix:** Changed all type-only imports to `import type { ... }` across store slices, api layer, mocks, and components
- **Files modified:** `datasetSlice.ts`, `analysisSlice.ts`, `uiSlice.ts`, `index.ts`, `analysisApi.ts`, `handlers.ts`, `DataTable.tsx`

**2. [Rule 1 - Bug] react-window 2.x has completely different API from 1.x**
- **Found during:** Build verification after Task 2 commit
- **Issue:** `FixedSizeList` and `ListChildComponentProps` do not exist in react-window 2.x; exports are `List`, `Grid`, `RowComponentProps`
- **Fix:** Rewrote `DataTable.tsx` to use `List` with `rowProps` API — data passed via `rowProps`, row component receives it as merged props
- **Files modified:** `DataTable.tsx`

**3. [Rule 2 - Missing] `beforeAll/afterEach/afterAll` not in global scope for `test/setup.ts`**
- **Found during:** Build verification (TypeScript error TS2304)
- **Issue:** `globals: true` in vitest config injects globals for test files but `setup.ts` runs before the test environment, so globals aren't available
- **Fix:** Added explicit `import { beforeAll, afterEach, afterAll } from 'vitest'` to `test/setup.ts`
- **Files modified:** `test/setup.ts`

## Self-Check: PASSED

Files verified present:
- `frontend/src/types/analysis.ts` — FOUND
- `frontend/src/store/index.ts` — FOUND (contains resetStore)
- `frontend/src/api/analysisApi.ts` — FOUND (exports uploadFile, analyzeDataset)
- `frontend/src/hooks/useUpload.ts` — FOUND
- `frontend/src/hooks/useAnalysis.ts` — FOUND
- `frontend/src/components/DropZone.tsx` — FOUND
- `frontend/src/components/DataTable.tsx` — FOUND (contains List from react-window)
- `frontend/src/hooks/useUpload.test.ts` — FOUND (38 lines)
- `frontend/src/hooks/useAnalysis.test.ts` — FOUND (80 lines)
- `frontend/src/api/analysisApi.test.ts` — FOUND (50 lines)

Commits verified:
- `fb3f23d` — feat(02-02): Task 1 (TS types, Zustand store, API layer, MSW mocks)
- `d6413a1` — feat(02-02): Task 2 (hooks, components, App wiring + bug fixes)

Test result: 21 passed, 0 failed
Build result: tsc --noEmit: 0 errors, vite build: success (246.74 kB JS, 110ms)
