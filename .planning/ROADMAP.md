# Roadmap: DataLens

## Overview

DataLens goes from empty repository to a deployed, portfolio-ready EDA platform in four phases. Phase 1 establishes the monorepo scaffold, data contracts, and live deployment targets so every subsequent layer builds against real infrastructure. Phase 2 delivers the upload-to-analysis pipeline — the product's core data path — with full backend services, state management, and hook-level tests in place before any chart component is written. Phase 3 adds all visualization and insight surfaces as leaf-node components that consume the tested API contracts from Phase 2. Phase 4 hardens the full pipeline against adversarial inputs, validates the integration end-to-end, and ensures the demo experience matches the core value promise.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Skeleton + Deploy** - Monorepo scaffold, data contracts, CI, and live deployment targets on Vercel + Render
- [ ] **Phase 2: Upload + API + State** - End-to-end upload-to-analysis pipeline with backend services, Zustand store, hooks, and tests
- [ ] **Phase 3: Visualization** - All chart surfaces, outlier panel, correlation heatmap, summary cards, and data quality alerts
- [ ] **Phase 4: Polish + Edge Cases** - Full integration test, adversarial input hardening, UX polish, and demo-day verification

## Phase Details

### Phase 1: Skeleton + Deploy
**Goal**: A running monorepo where the frontend and backend communicate, CI passes on every PR, and both services are live on Vercel + Render with the data contract defined
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07
**Success Criteria** (what must be TRUE):
  1. Running `pnpm dev` starts the Vite frontend; running `uvicorn main:app` starts the FastAPI backend; both communicate without error
  2. The frontend calls `/health` on mount and the backend responds — "Connecting to analysis server..." UI appears if response takes more than 2 seconds
  3. A pull request to `main` triggers GitHub Actions and shows green checks for both FE lint/test/build and BE pytest/lint
  4. The deployed Vercel URL serves the frontend and the deployed Render URL responds to `GET /health` — CORS allows the Vercel origin
  5. TypeScript interfaces in `frontend/src/types/` and Pydantic schemas in `backend/schemas/` define the same data shapes for upload response and analysis response
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Frontend + backend scaffold (Vite, FastAPI, CORS, /health, Tailwind v4, pytest stubs, data contracts)
- [x] 01-02-PLAN.md — GitHub Actions CI pipeline + Vercel/Render deployment configuration

### Phase 2: Upload + API + State
**Goal**: A user can upload a CSV or JSON file and the application parses it, runs all four analysis services, and stores the typed results in Zustand — with every hook and backend service covered by tests
**Depends on**: Phase 1
**Requirements**: UPLD-01, UPLD-02, UPLD-03, UPLD-04, UPLD-05, UPLD-06, ANLZ-01, ANLZ-02, ANLZ-03, ANLZ-04, PERF-01, TEST-01, TEST-03, TEST-04
**Success Criteria** (what must be TRUE):
  1. User can drag a CSV or JSON file onto the drop zone (or click to browse) and see the first 50 rows rendered in a virtualized table within 3 seconds
  2. Each column in the preview table has a type badge (numeric / categorical / date / text) that correctly reflects the column's detected type
  3. Uploading a file larger than 10 MB shows a clear error message; uploading a second file completely clears the previous dataset state before loading the new one
  4. The analysis API returns stats, correlation, outliers, and quality alert data — visible in browser DevTools network tab — with no event-loop blocking for files up to 10 MB
  5. Every custom hook (`useUpload`, `useAnalysis`) has a passing Vitest test; every backend service (`parser_service`, `stats_service`, `correlation_service`, `outlier_service`) has a passing pytest test; `analysisApi` has MSW-mocked tests
**Plans**: TBD

Plans:
- [ ] 02-01: FastAPI upload + analysis endpoints (parser_service, stats_service, correlation_service, outlier_service, run_in_executor, low_memory=False, 10MB limit, pytest coverage)
- [ ] 02-02: Zustand store (3 slices + resetStore), axios API service layer, useUpload + useAnalysis hooks, DataTable with react-window, MSW mocks, Vitest hook tests

### Phase 3: Visualization
**Goal**: All analysis results from Phase 2 are rendered as interactive, correctly-typed chart components — histogram, bar chart, timeseries, correlation heatmap with scatter modal, outlier toggle, summary card, missing value visualization, and data quality alerts
**Depends on**: Phase 2
**Requirements**: VIZL-01, VIZL-02, VIZL-03, VIZL-04, VIZL-05, VIZL-06, VIZL-07, OTLR-01, OTLR-02, OTLR-03, SUMM-01, SUMM-02, SUMM-03, SUMM-04, PERF-02, PERF-03, TEST-02
**Success Criteria** (what must be TRUE):
  1. Uploading a dataset with numeric columns renders histograms; categorical columns render bar charts (top 20); date columns render timeseries line charts — correct chart type per column with no manual configuration
  2. Clicking a column in the chart panel scrolls/focuses to that column's chart
  3. The correlation heatmap shows Pearson values for all numeric column pairs; clicking a heatmap cell opens a scatter plot modal showing the two-column relationship (capped at 2,000 points with a "Showing N of M" label)
  4. The outlier panel lists each numeric column's IQR bounds and outlier count; toggling the outlier filter updates the affected charts and statistics in real time
  5. The summary card shows row count, column count, missing value ratio, and duplicate row count; data quality alerts flag constant columns, high-cardinality columns, high null ratio, and heavy skew
  6. `ChartRouter` type-dispatch logic has passing Vitest unit tests; chart components do not re-render on unrelated store updates (verified via React DevTools or test)
**Plans**: TBD

Plans:
- [ ] 03-01: Distribution charts (ChartRouter + CHART_MAP, HistogramChart, BarChart, TimeseriesChart, column focus, React.memo + useMemo, TEST-02)
- [ ] 03-02: Correlation heatmap (@nivo/heatmap, scatter modal, server-side 2k downsampling), outlier panel (IQR display, toggle filter), summary card + missing value viz + quality alerts (SUMM-01~04, PERF-03)

### Phase 4: Polish + Edge Cases
**Goal**: The full upload-to-visualization pipeline is verified end-to-end against adversarial inputs, edge cases produce graceful states rather than crashes, and the deployed demo reliably delivers the core value promise within 3 seconds
**Depends on**: Phase 3
**Requirements**: TEST-05
**Success Criteria** (what must be TRUE):
  1. The integration test (`upload → analyze → chart rendering`) passes with a real CSV fixture covering mixed-type columns, date columns, and numeric columns with outliers
  2. Edge cases produce graceful UI: 0 numeric columns shows an empty-state message instead of a blank heatmap; 1 numeric column disables the correlation heatmap with an explanation; a dataset with all-null column shows "N/A" in stats rather than crashing
  3. Uploading two sequential files in the integration test confirms the second upload starts from a fully reset state (no stale data from first file visible)
  4. `tsc --strict` reports zero errors and zero `any` types across the frontend codebase
  5. The deployed Render backend responds to `/health` within 5 seconds after a cold start; the frontend shows a "Connecting..." indicator and recovers automatically when the server warms up
**Plans**: TBD

Plans:
- [ ] 04-01: Integration test (upload → analyze → render fixture), edge case handling (0/1 numeric columns, all-null columns, sequential upload state reset), tsc --strict zero-any audit, cold-start UX, friendly error message mapping

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Skeleton + Deploy | 2/2 | Complete    | 2026-03-27 |
| 2. Upload + API + State | 0/2 | Not started | - |
| 3. Visualization | 0/2 | Not started | - |
| 4. Polish + Edge Cases | 0/1 | Not started | - |
