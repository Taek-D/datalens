# Project Research Summary

**Project:** DataLens — Browser-based EDA Platform
**Domain:** Interactive Data Exploration / Exploratory Data Analysis (EDA) SPA
**Researched:** 2026-03-27
**Confidence:** HIGH

## Executive Summary

DataLens is a browser-first EDA platform — a category where the dominant tools (ydata-profiling, D-Tale, Sweetviz) all require local Python installation and produce static reports. The recommended approach is a React 18 SPA backed by a FastAPI + pandas API, deployed as separate services (Vercel for frontend, Render for backend). This split architecture gives zero-install access to users while keeping the full pandas/scipy/numpy data processing stack on the server — the only viable way to handle real-world CSV/JSON analysis without shipping a Python runtime to the browser.

The core value proposition is "upload → insights in under 3 seconds with no installation." Every architecture and feature decision must protect this. The research reveals a well-understood build sequence: establish data contracts (TypeScript types + Pydantic schemas) first, then pure backend services, then API layer, then Zustand store, then custom hooks, then leaf components. This bottom-up order makes each layer independently testable and prevents the most common portfolio-project failure mode — building UI first and discovering backend shape mismatches at integration time.

The principal risks are operational (Render free-tier cold starts destroying first impressions), data integrity (pandas mixed-type inference silently corrupting column classification), and performance (Recharts SVG crashes at 10k+ scatter points). All three are preventable with specific, low-cost mitigations that must be addressed in the first two phases rather than deferred. The research confidence across all four domains is HIGH — all library versions verified against npm registry and PyPI JSON APIs, architectural patterns confirmed via multiple production FastAPI+React codebases.

---

## Key Findings

### Recommended Stack

The stack is a React 18 + TypeScript + Vite 8 SPA on the frontend with a FastAPI 0.135.2 + pandas 3.0.1 backend. All package versions were verified via live registry queries. React 18 (not 19) is the deliberate choice because the ecosystem libraries — Recharts 3, RTL 16 — only recently added React 19 support and v18 is the safer portfolio target. Vite 8 replaces CRA entirely. FastAPI is non-negotiable: the JD names it explicitly, and the pandas/scipy/numpy stack has no viable TypeScript equivalent without FFI overhead.

Charts are split between Recharts 3 (histogram, bar, timeseries, scatter) and @nivo/heatmap 0.99 (correlation matrix) — Recharts has no heatmap component, and importing only `@nivo/heatmap` keeps the bundle lean via tree-shaking. State management is Zustand 5 in three slices (`datasetSlice`, `analysisSlice`, `uiSlice`). Testing is Vitest 4 + RTL 16 + MSW 2 (frontend) and pytest 9 + httpx 0.28 (backend). Tailwind CSS 4 with the Vite plugin replaces the PostCSS approach from v3.

**Core technologies:**
- React 18.3.x: UI framework — concurrent features (Suspense, transitions) enable non-blocking chart rendering; safer ecosystem than v19 for portfolio target
- TypeScript 5.x: type safety — eliminates `any`-type bugs at the data pipeline boundary (API response → store → chart props); required by project rules
- Vite 8.0.3: build tool — native ESM, sub-second HMR; CRA is deprecated
- FastAPI 0.135.2: Python API backend — async ASGI + native Pydantic v2 + pandas integration with zero impedance mismatch
- pandas 3.0.1: DataFrame processing — `.describe()`, `.corr()`, `.dtypes` cover 90% of the EDA surface; requires Python >=3.11
- Zustand 5.0.12: global state — ~1kb, no Provider boilerplate, selector-based subscriptions prevent over-rendering
- Recharts 3.8.1: SVG charts — declarative React components; histogram, bar, scatter, timeseries covered
- @nivo/heatmap 0.99.0: correlation heatmap — purpose-built with -1 to +1 color scale; not available in Recharts
- react-window 2.2.7: table virtualization — `FixedSizeList` for data preview; required for any file > ~500 rows
- Tailwind CSS 4.2.2: utility styling — CSS-first `@theme` config, Vite plugin, up to 5x faster builds vs v3
- scipy 1.17.1: statistical analysis — IQR outlier detection, Pearson p-values
- MSW 2.12.14: API mocking in tests — intercepts axios at network layer; use `http.*` API (not deprecated `rest.*`)

### Expected Features

The feature research drew from ydata-profiling, D-Tale, Sweetviz, PyGWalker, Observable, and Polymer. The MVP scope is well-defined: all 11 features in the "Launch With" list are P1, feasible within a 3-week portfolio sprint, and together demonstrate the full-stack EDA capability. The single sharpest differentiator over static-report tools (ydata, sweetviz) is interactive outlier filtering — showing how stats change when outliers are excluded — which no static-report tool offers.

**Must have (table stakes):**
- Drag-and-drop CSV/JSON file upload — entry point; tool is useless without it
- Column type auto-detection (numeric/categorical/date/text) — all downstream analysis depends on this
- Dataset overview card (rows, columns, missing %, duplicate count) — every profiling tool shows this first
- Data preview table, first 50 rows, virtualized — users need to see raw data before trusting analysis
- Per-type distribution charts (histogram/bar/timeseries) — universally expected
- Summary statistics per column (mean, median, std, min, max, Q1, Q3, skewness) — pandas `.describe()` era baseline
- Missing value heatmap — identifying nulls is step 1 of any real dataset
- Pearson correlation heatmap — required for feature selection workflows; every profiling tool ships this
- IQR outlier detection with toggle filter — concrete interactive differentiator
- Data quality alerts (constant column, high cardinality, high null %, heavy skew) — ydata-profiling pioneered; now expected
- Scatter plot modal on correlation heatmap cell click — bridges overview and detail; static tools don't do this

**Should have (competitive, P2):**
- Per-column detail panel (click column → full stats + viz drawer) — declutters main view, adds depth on demand
- Excel/XLSX upload support — avoid CSV-only limitation after v1 validation
- Static HTML report export — async sharing without auth infrastructure
- Duplicate row viewer (detail drill-down from overview count)

**Defer (v2+):**
- Dataset comparison (two files side-by-side) — sweetviz parity, weeks of effort
- Chunked streaming for files > 50MB — requires Web Workers + streaming parser architecture
- Time-series specific analysis (ACF, PACF, stationarity) — niche, high statistical complexity
- Natural language / AI query interface — LLM integration out of scope for portfolio timeline

**Anti-features to avoid entirely:**
- In-browser data editing (turns EDA tool into a data editor product)
- User authentication + saved sessions (full product vertical, no DB in v1)
- Real-time DB/API/S3 connectors (credential management, weeks of orthogonal work)
- Collaborative multi-user editing (WebSocket/CRDT infrastructure)

### Architecture Approach

The architecture is a stateless two-endpoint REST API: `POST /api/upload` parses the file into a DataFrame and returns column schema + rows; `POST /api/analyze` receives the parsed data and runs all four analysis services (stats, correlation, outliers, quality alerts) in sequence, returning a single combined `AnalysisResultResponse`. This two-step pipeline lets the frontend show the raw data table immediately after upload while analysis runs, creating the perception of speed that is the product's core promise. The frontend stores all results in three Zustand slices and custom hooks (`useUpload`, `useAnalysis`) own all async orchestration — components are pure renderers that receive typed props.

**Major components:**
1. Upload Zone + `useUpload` hook — drag-drop intake, file validation, multipart POST, state machine (idle/uploading/done/error)
2. API Service Layer (axios) — typed wrappers over both endpoints; MSW-mockable; never imported directly by components
3. Zustand Store (3 slices) — `datasetSlice` (rows, columns), `analysisSlice` (stats, correlation, outliers), `uiSlice` (loading, modal, filter state)
4. DataTable + react-window — virtualized row preview; column type badges; scroll reset on new upload
5. Chart Panel — column-type-driven chart selection via `CHART_MAP` lookup; components are pure renderers wrapped in `React.memo`
6. Correlation Heatmap + Scatter Modal — @nivo/heatmap matrix; click-to-scatter drill-down from existing store data (no re-fetch)
7. Outlier Panel + Toggle — boolean filter in `uiSlice`; DataTable filters rows by `analysisSlice.outliers` index list
8. FastAPI Routers (thin) — validate via Pydantic, delegate to services; never contain pandas logic
9. Backend Services (pure functions) — `parser_service`, `stats_service`, `correlation_service`, `outlier_service`; each takes a DataFrame, returns a plain dict; independently pytest-able

**Key patterns:**
- Column-type-driven chart selection: `CHART_MAP` lookup object in `useColumnChart` hook — no if/else trees in components
- Backend services as pure DataFrame functions: no side effects, no I/O, trivially unit-testable
- Frontend types mirror backend Pydantic schemas: the only cross-boundary coupling point; must be kept in sync manually

### Critical Pitfalls

1. **Render free-tier cold start (30–60s)** — implement `/health` endpoint from day one; call it on app mount to warm the server before first user action; show "Connecting to analysis server..." UI if health check > 2s. Address in Phase 1.

2. **pandas `low_memory=True` mixed-type column corruption** — always pass `low_memory=False` in `pd.read_csv()`; run a secondary type-inference pass with `pd.to_numeric(col, errors='coerce')`; check < 5% new-null threshold. Address in Phase 2 before any chart component work.

3. **Recharts SVG crash at 10k+ scatter points** — implement server-side downsampling (LTTB or random sample, cap at 2,000 points) in the analyze endpoint; include `sampled: boolean` + original row count in response; show "Showing N of M points" label in UI. Address in Phase 3 before scatter modal is marked done.

4. **CORS breaks on deployment** — store allowed origins in `ALLOWED_ORIGINS` env var; never hardcode `localhost` origins or use `allow_origins=["*"]` with `allow_credentials=True`. Configure from day one in Phase 1; verify with `curl` smoke test post-deploy.

5. **Zustand stale state across file uploads** — define `initialState` as a typed constant; implement `resetStore()` action; call it as the first action when new upload begins; write a Vitest test for two sequential uploads. Address in Phase 2 state layer setup.

6. **Event loop blocking on large files** — enforce 10MB file size limit at FastAPI layer (HTTP 413); wrap pandas processing in `run_in_executor`; validate magic bytes not just Content-Type header. Address in Phase 2 upload endpoint implementation.

---

## Implications for Roadmap

Based on the build-order implications from ARCHITECTURE.md and the pitfall-to-phase mapping from PITFALLS.md, a 4-phase structure emerges naturally from the dependency graph.

### Phase 1: Project Skeleton + Deployment Infrastructure

**Rationale:** ARCHITECTURE.md explicitly names types/schemas as the foundation — "nothing else can be typed correctly without this." PITFALLS.md identifies two pitfalls (Render cold start, CORS misconfiguration) that must be addressed before any feature work or they become unfixable post-deployment surprises. Establishing CI and deployment targets early surfaces environment-specific issues at low cost.

**Delivers:** Working monorepo scaffold with Vite + FastAPI running locally; `/health` endpoint with frontend warm-up call; CORS configured via env var; GitHub Actions CI for both FE and BE; deployed skeleton on Vercel + Render; TypeScript interfaces + Pydantic schemas defining the data contract.

**Addresses:** Project structure foundation; data contract establishment between FE and BE.

**Avoids:** Render cold start (Pitfall 1); CORS production breakage (Pitfall 4).

**Research flag:** Standard patterns — well-documented Vite + FastAPI scaffold patterns; skip research-phase.

---

### Phase 2: Upload + Analysis API + State Layer

**Rationale:** FEATURES.md establishes that file upload requires column type detection, and column type detection is a hard dependency for ALL downstream analysis features. ARCHITECTURE.md confirms `parser_service` is "a hard dependency for everything else." PITFALLS.md maps four pitfalls to this phase (mixed-type inference, Zustand stale state, event loop blocking, file size/security) — all must be addressed here because fixing them later requires reworking the core data pipeline.

**Delivers:** `POST /api/upload` (CSV/JSON → parsed DataFrame + column schema); `POST /api/analyze` (stats, correlation, outliers, quality alerts); Zustand store with 3 slices and `resetStore()`; `useUpload` and `useAnalysis` hooks; MSW mocks for both endpoints; pytest coverage for all backend services.

**Uses:** FastAPI + python-multipart + pandas + scipy + numpy (backend); Zustand 5 + axios + MSW 2 (frontend); Vitest 4 + RTL 16 (testing).

**Implements:** Upload → Analyze two-step pipeline pattern; pure-function backend services pattern; typed API service layer.

**Avoids:** Mixed-type column corruption (Pitfall 2); stale Zustand state (Pitfall 5); event loop blocking (Pitfall 6); file size security hole (Pitfall 6).

**Research flag:** Standard patterns for FastAPI file upload and Zustand slice setup; skip research-phase. Note: `run_in_executor` pattern for async pandas is well-documented but easy to get wrong — verify implementation against FastAPI async best practices.

---

### Phase 3: Visualization Layer

**Rationale:** Chart components are leaf nodes in the dependency graph — they cannot be built before the data contracts (Phase 1) and analysis API (Phase 2) are stable. Building charts against a live, tested API prevents the most common portfolio failure: UI that looks right but breaks on real data. PITFALLS.md flags Recharts SVG crash as a Phase 3 concern that must be resolved before scatter modal is marked done.

**Delivers:** DataTable with react-window virtualization and column type badges; per-type distribution charts (histogram via Recharts BarChart with bins, bar chart, timeseries LineChart); Pearson correlation heatmap via @nivo/heatmap; scatter plot modal on heatmap cell click; outlier panel with IQR toggle; summary card and data quality alerts; missing value heatmap.

**Uses:** Recharts 3 + @nivo/heatmap 0.99 + react-window 2 (rendering); Tailwind CSS 4 (styling); `useColumnChart` hook (chart type dispatch).

**Implements:** Column-type-driven chart selection pattern; `React.memo` + `useMemo` for chart performance; server-side scatter point downsampling cap at 2,000 points.

**Avoids:** Recharts SVG crash at 10k+ rows (Pitfall 3); chart re-renders on unrelated state changes (Performance Traps); react-window variable row height issues.

**Research flag:** @nivo/heatmap color-scale configuration and Recharts histogram binning are moderately complex — consider a targeted research-phase spike for these two specific components before full implementation.

---

### Phase 4: Polish + Edge Cases + Demo Hardening

**Rationale:** The "Looks Done But Isn't" checklist in PITFALLS.md identifies 9 verification items that are invisible until explicitly tested with adversarial inputs (mixed-type columns, 0 numeric columns for correlation, sequential uploads, cold start after idle). A dedicated phase for these prevents demo-day failures that are disproportionately damaging to portfolio perception.

**Delivers:** Full verification against the PITFALLS.md checklist (mixed-type CSV, 0/1 numeric column edge cases, correlation heatmap graceful empty state, outlier toggle updating charts not just stats, scroll position reset on new upload, CORS curl smoke test, state reset between sequential uploads, cold start UX recovery, tsc --strict zero-any check); UX polish (distinct loading states "Uploading / Parsing / Computing stats / Done", auto-column limiting to first 10 with expander, friendly error messages mapping backend errors to user-readable strings); UptimeRobot or equivalent cold-start prevention.

**Addresses:** All P2 features if timeline permits (per-column detail panel, HTML export).

**Avoids:** All "Looks Done But Isn't" scenarios from PITFALLS.md.

**Research flag:** Standard QA patterns; skip research-phase.

---

### Phase Ordering Rationale

- **Types-first order** (Phase 1 → 2 → 3 → 4) directly mirrors ARCHITECTURE.md's "Build Order Implications" section, which explicitly sequences: types/schemas → backend services → routers → API layer → store → hooks → leaf components.
- **Pitfall frontloading:** 5 of 6 critical pitfalls are addressed in Phases 1-2 rather than being discovered during visualization work. This follows the PITFALLS.md "Phase to address" column exactly.
- **Visualization last:** Chart components are pure renderers — moving them to Phase 3 means they are built against stable, tested data contracts, eliminating the integration debugging that dominates poorly sequenced portfolio projects.
- **Polish as a dedicated phase:** The PITFALLS.md "Looks Done But Isn't" checklist is extensive enough that it requires dedicated time. Folding this into Phase 3 would deprioritize it.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Visualization):** @nivo/heatmap color-scale gradient configuration and Recharts histogram binning (bin edge calculation with numpy, passing bin data to BarChart) are the two least-documented patterns in the research. A targeted spike before implementation is recommended.
- **Phase 2 (Upload):** `asyncio.run_in_executor` wrapping pandas operations in FastAPI is well-documented in principle but has subtle gotchas (loop reference, thread-safety of pandas operations) — verify against current FastAPI async docs before coding.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Skeleton):** Vite + FastAPI monorepo scaffold, GitHub Actions CI for dual-language repos, Vercel + Render deployment — all well-documented with multiple production examples.
- **Phase 4 (Polish):** QA verification checklist execution; no novel technical patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All 19 package versions verified against live npm registry and PyPI JSON APIs on 2026-03-27. Version compatibility matrix cross-checked (React 18/19 peer deps, Python version floors). |
| Features | HIGH | Grounded in 13 named sources including official GitHub repos (ydata-profiling, D-Tale, PyGWalker), Towards Data Science comparisons, and Jaspersoft/Polymer product analyses. MVP scope is conservative and clearly bounded. |
| Architecture | HIGH | Patterns confirmed via equinor/template-fastapi-react production template, zhanymkanov FastAPI best practices (12k+ GitHub stars), and TestDriven.io FastAPI+React tutorial. Code examples in research are implementable as-written. |
| Pitfalls | HIGH | All 6 critical pitfalls sourced from official docs (FastAPI CORS tutorial, pandas DtypeWarning docs, Zustand reset state guide) and verified community reports (Render cold start community thread, Recharts SVG issue #1146). Recovery costs and timelines are realistic estimates. |

**Overall confidence:** HIGH

### Gaps to Address

- **Tailwind CSS 4 `@theme` configuration specifics:** Research confirms CSS-first config replaces `tailwind.config.js`, but the exact syntax for custom design tokens (colors, spacing) in `@theme` blocks was sourced from multiple community articles rather than official docs. Validate against official Tailwind v4 docs during Phase 1 scaffold.
- **pandas 3.x breaking changes vs 2.x:** Research notes that nullable dtypes default changed in pandas 3.0. The exact impact on `df.describe()` output shape (which feeds `StatsResult` schema) should be validated empirically during Phase 2 with a canonical test CSV.
- **`@nivo/heatmap` 0.99 API surface:** This is a pre-1.0 package. The color scale configuration and cell click handler API should be verified against the nivo storybook before Phase 3 implementation begins — pre-1.0 packages can have breaking changes between minor versions.
- **Render free-tier memory limit (512MB):** The 10MB file size limit recommendation is based on community reports, not Render's official memory profiling. The actual safe limit may be higher or lower depending on DataFrame memory expansion ratio for wide CSVs. Validate empirically during Phase 4 with a memory profiling test.

---

## Sources

### Primary (HIGH confidence)
- `https://registry.npmjs.org/[package]/latest` — all frontend package versions verified (recharts, zustand, vite, axios, tailwindcss, vitest, @testing-library/react, msw, @nivo/heatmap, react-window)
- `https://pypi.org/pypi/[package]/json` — all backend package versions verified (fastapi, pandas, numpy, scipy, uvicorn, python-multipart, pytest, httpx)
- `https://fastapi.tiangolo.com/tutorial/request-files/` — FastAPI UploadFile / multipart upload patterns
- `https://fastapi.tiangolo.com/tutorial/cors/` — CORSMiddleware configuration
- `https://zustand.docs.pmnd.rs/guides/how-to-reset-state` — Zustand reset state pattern
- `https://pandas.pydata.org/docs/reference/api/pandas.errors.DtypeWarning.html` — pandas mixed-type inference behavior
- `https://github.com/equinor/template-fastapi-react` — production FastAPI + React architecture reference
- `https://github.com/zhanymkanov/fastapi-best-practices` — FastAPI service layer patterns
- `https://github.com/ydataai/ydata-profiling` — EDA feature baseline
- `https://github.com/man-group/dtale` — interactive EDA feature reference

### Secondary (MEDIUM confidence)
- `https://towardsdatascience.com/comparing-five-most-popular-eda-tools-dccdef05aa4c/` — EDA tool feature comparison
- `https://testdriven.io/blog/fastapi-react/` — FastAPI + React integration patterns
- `https://community.render.com/t/do-web-services-on-a-free-tier-go-to-sleep-after-some-time-inactive/3303` — Render cold start behavior
- `https://github.com/recharts/recharts/issues/1146` — Recharts SVG performance with large datasets
- `https://rushter.com/blog/pandas-data-type-inference/` — pandas type inference internals
- `https://www.developerway.com/posts/react-state-management-2025` — React state management 2025 comparison
- WebSearch: Tailwind v4 Vite plugin architecture, CSS-first config (multiple community sources)
- WebSearch: react-window vs TanStack Virtual 2025 comparison (npmtrends data)
- WebSearch: Recharts vs Nivo vs Victory 2025 (LogRocket + multiple sources)

### Tertiary (MEDIUM-LOW confidence)
- `https://owasp.org/www-community/attacks/CSV_Injection` — CSV formula injection security pattern
- `https://blog.greeden.me/en/2026/03/03/implementing-secure-file-uploads-in-fastapi-practical-patterns-for-uploadfile-size-limits-virus-scanning-s3-compatible-storage-and-presigned-urls/` — FastAPI secure upload patterns
- `https://medium.com/@connect.hashblock/async-file-uploads-in-fastapi-handling-gigabyte-scale-data-smoothly-aec421335680` — async file upload patterns (memory management estimates need empirical validation)

---
*Research completed: 2026-03-27*
*Ready for roadmap: yes*
