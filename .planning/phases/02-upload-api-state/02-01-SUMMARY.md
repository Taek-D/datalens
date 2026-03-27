---
phase: 02-upload-api-state
plan: "01"
subsystem: backend
tags: [fastapi, pandas, pydantic, analysis, upload, api]
dependency_graph:
  requires: [01-skeleton-deploy]
  provides: [POST /api/upload, POST /api/analyze, analysis services, Pydantic schemas]
  affects: [frontend Phase 3 chart rendering]
tech_stack:
  added: [scipy (skewness), ThreadPoolExecutor (run_in_executor)]
  patterns: [service layer, IQR outlier detection, Pearson correlation, in-memory dataset store]
key_files:
  created:
    - backend/schemas/analysis.py
    - backend/app/services/__init__.py
    - backend/app/services/parser_service.py
    - backend/app/services/stats_service.py
    - backend/app/services/correlation_service.py
    - backend/app/services/outlier_service.py
    - backend/app/services/quality_service.py
    - backend/app/api/upload.py
    - backend/app/api/analyze.py
    - backend/tests/fixtures/sample.csv
    - backend/tests/fixtures/sample.json
    - backend/tests/test_services.py
    - backend/tests/test_upload.py
  modified:
    - backend/schemas/upload.py (added file_id field)
    - backend/app/main.py (registered upload + analyze routers)
decisions:
  - "In-memory dict (_datasets) used for dataset storage — sufficient for single-process Render free tier; no Redis/DB needed in v1"
  - "ThreadPoolExecutor(max_workers=2) at module level in analyze.py — avoids per-request executor creation overhead"
  - "preview uses df.where(notna, None).to_dict() pattern to safely serialize pandas NA as JSON null"
  - "quality_service skips further checks on constant columns (continues after first alert) — avoids misleading secondary alerts on all-null columns"
metrics:
  duration: "9 min"
  completed_date: "2026-03-27"
  tasks_completed: 2
  files_created: 13
  files_modified: 2
  tests_added: 56
---

# Phase 2 Plan 1: Backend Upload + Analysis Pipeline Summary

FastAPI backend upload and analysis pipeline — two endpoints (POST /api/upload, POST /api/analyze) backed by four analysis services (stats, correlation, outlier, quality), Pydantic v2 response schemas, and 56 passing pytest tests.

## What Was Built

### Pydantic v2 Schemas (`backend/schemas/analysis.py`)

Replaced the Phase 1 stub with fully typed models:
- `SummaryStats` — mean/std/min/max/Q1/median/Q3/skewness, all `float | None`
- `CorrelationMatrix` — columns list + nested values matrix with `float | None`
- `OutlierResult` — per-column IQR bounds + outlier indices
- `QualityAlert` — typed alerts with severity levels
- `AnalysisResultResponse` — top-level response aggregating all four analysis sections plus dataset-level metrics

### Parser Service (`backend/app/services/parser_service.py`)

- `parse_file(contents, filename)` routes by extension: `.csv` via `pd.read_csv(low_memory=False)`, `.json` via `pd.read_json`
- `detect_column_type(series)` priority: numeric → datetime (dtype check) → datetime (parse attempt) → categorical (< 50% unique) → text
- Raises `ValueError` for empty content, header-only CSVs (0 rows), unsupported extensions

### Four Analysis Services

| Service | Algorithm | Key Detail |
|---|---|---|
| `stats_service` | Per-column descriptive stats | scipy.stats.skew; NaN/inf → None via `_safe_float` |
| `correlation_service` | Pearson correlation matrix | Returns empty matrix for < 2 numeric columns |
| `outlier_service` | IQR method (1.5x fence) | Excludes NaN rows from mask; returns integer indices |
| `quality_service` | Rule-based alerts | 4 alert types: constant / high_null / high_cardinality / high_skew |

### API Endpoints

**POST /api/upload** (`backend/app/api/upload.py`):
- Reads file bytes, enforces 10MB size limit (HTTP 413)
- Validates `.csv` / `.json` extension (HTTP 400)
- Calls `parser_service.parse_file`, stores DataFrame in module-level `_datasets` dict
- Returns `UploadResponse` with `file_id` (8-char hex), `columns`, `preview` (up to 50 rows), `row_count`

**POST /api/analyze** (`backend/app/api/analyze.py`):
- Looks up DataFrame by `file_id` (HTTP 404 if not found)
- Runs all four services via `asyncio.run_in_executor` with `ThreadPoolExecutor(max_workers=2)`
- Returns `AnalysisResultResponse` with all four analysis sections + dataset-level metrics

### Test Coverage (56 tests)

- `test_services.py` — 35 unit tests across all 5 services
- `test_upload.py` — 21 integration tests for both endpoints
- All prior health + CORS tests continue to pass (56 total, 0 failures)

## Decisions Made

1. **In-memory dataset store**: `_datasets: dict[str, pd.DataFrame]` in `upload.py`. Sufficient for single-process Render free tier; no Redis or DB needed in v1.
2. **Module-level ThreadPoolExecutor**: Created once at module import in `analyze.py` to avoid per-request overhead.
3. **Preview serialisation**: `df.where(df.notna(), None).to_dict(orient="records")` converts pandas NA safely to JSON `null`.
4. **Quality service early-continue on constant**: Constant columns skip high-cardinality/high-skew checks to avoid misleading secondary alerts.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files verified present:
- `backend/schemas/analysis.py` — FOUND
- `backend/app/services/parser_service.py` — FOUND
- `backend/app/services/stats_service.py` — FOUND
- `backend/app/services/correlation_service.py` — FOUND
- `backend/app/services/outlier_service.py` — FOUND
- `backend/app/services/quality_service.py` — FOUND
- `backend/app/api/upload.py` — FOUND
- `backend/app/api/analyze.py` — FOUND
- `backend/tests/test_services.py` — FOUND
- `backend/tests/test_upload.py` — FOUND

Commits verified:
- `b611627` — feat(02-01): Task 1 (schemas + services + test_services)
- `08a4d6e` — feat(02-01): Task 2 (endpoints + test_upload)

Test result: 56 passed, 0 failed
