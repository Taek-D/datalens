---
phase: 3
slug: visualization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.2 |
| **Config file** | `frontend/vite.config.ts` (test block with jsdom environment) |
| **Quick run command** | `cd frontend && npm run test` |
| **Full suite command** | `cd frontend && npm run test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npm run test`
- **After every plan wave:** Run `cd frontend && npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | TEST-02 | unit | `npx vitest run src/components/charts/ChartRouter.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | VIZL-01 | unit (render) | `npx vitest run src/components/charts/HistogramChart.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | VIZL-02 | unit (render) | `npx vitest run src/components/charts/BarChart.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | PERF-02 | unit (spy) | `npx vitest run src/components/charts/ChartRouter.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | VIZL-06 | unit (render + event) | `npx vitest run src/components/charts/ScatterModal.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | OTLR-03 | unit (hook) | `npx vitest run src/hooks/useChartData.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | SUMM-01 | unit (render) | `npx vitest run src/components/analysis/SummaryCard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 2 | SUMM-04 | unit (render) | `npx vitest run src/components/analysis/QualityAlerts.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/components/charts/ChartRouter.test.ts` — stubs for TEST-02, PERF-02
- [ ] `frontend/src/components/charts/HistogramChart.test.tsx` — stubs for VIZL-01
- [ ] `frontend/src/components/charts/BarChart.test.tsx` — stubs for VIZL-02
- [ ] `frontend/src/components/charts/ScatterModal.test.tsx` — stubs for VIZL-06
- [ ] `frontend/src/components/analysis/SummaryCard.test.tsx` — stubs for SUMM-01
- [ ] `frontend/src/components/analysis/QualityAlerts.test.tsx` — stubs for SUMM-04
- [ ] `frontend/src/hooks/useChartData.test.ts` — stubs for OTLR-03

*Existing test infrastructure (Vitest + jsdom + RTL) is already configured from Phase 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Column click scrolls/focuses to chart | VIZL-03 | DOM scrollIntoView behavior varies across browsers | Click column name in panel → verify chart scrolls into viewport |
| Heatmap cell click opens scatter modal | VIZL-05 | @nivo/heatmap click event integration difficult to simulate in jsdom | Click a heatmap cell → verify scatter modal appears with correct column pair |
| Outlier toggle updates charts in real time | OTLR-02 | Visual re-render timing validation | Toggle outlier filter → verify histograms redraw without outlier data |
| Timeseries line chart for datetime columns | VIZL-04 | Date axis formatting varies by data | Upload dataset with datetime column → verify line chart renders |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
