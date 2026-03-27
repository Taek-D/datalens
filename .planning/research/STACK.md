# Stack Research

**Domain:** Browser-based EDA (Exploratory Data Analysis) platform — CSV/JSON upload, automatic distributions, correlations, outliers, summary stats
**Researched:** 2026-03-27
**Confidence:** HIGH (all versions verified via npm registry JSON API and PyPI JSON API)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 18.3.x | UI component framework | v18 concurrent features (Suspense, transitions) enable non-blocking chart rendering during large dataset processing. v19 exists but ecosystem libraries (Recharts, RTL) only recently added support — v18 is the safer portfolio target. |
| TypeScript | 5.x | Type safety | Eliminates `any`-type bugs in data shape handling (column types, stat results). Required by project rules. Vite 8 includes native TS support. |
| Vite | 8.0.3 | Build tool + dev server | Native ESM, sub-second HMR, zero-config TypeScript. CRA is dead. Next.js is overkill for a single-user SPA with no SSR needs. Requires Node >=20.19. |
| FastAPI | 0.135.2 | Python API backend | Async ASGI, native Pydantic v2 validation, automatic OpenAPI docs. The JD explicitly names it. Pairs directly with pandas — no impedance mismatch. |
| pandas | 3.0.1 | DataFrame processing | Industry-standard for EDA. `read_csv`, `read_json`, `.describe()`, `.corr()`, `.dtypes` cover 90% of the analysis surface. v3 requires Python >=3.11. |

### Frontend Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | 5.0.12 | Global state management | Holds the uploaded dataset, column metadata, analysis results, and filter state across components. ~1kb gzipped. No Provider boilerplate — access store from any component. Use over Redux (too heavy) or Context (re-render issues with large state trees). |
| Recharts | 3.8.1 | Histogram, bar, line, scatter charts | Declarative React components wrapping D3. Covers histogram (BarChart with bins), time series (LineChart), scatter plots (ScatterChart). Supports React 16–19. Use for all standard chart types. |
| @nivo/heatmap | 0.99.0 | Pearson correlation heatmap | Recharts has no heatmap. Nivo's `@nivo/heatmap` is purpose-built, handles the color-scale gradient from -1 to +1 natively, and supports React 16–19. Import only this package — tree-shaking keeps bundle lean. |
| Tailwind CSS | 4.2.2 | Utility-first styling | v4 is the correct choice for greenfield 2026 projects. CSS-first `@theme` config, no `tailwind.config.js`, Vite plugin replaces PostCSS. Up to 5x faster full builds. Browser targets (Chrome 111+, Firefox 128+, Safari 16.4+) are acceptable for a portfolio tool. |
| @tailwindcss/vite | 4.x | Tailwind v4 Vite integration | Required in v4. Replaces PostCSS plugin. Add to `vite.config.ts` as a plugin — single line setup. |
| axios | 1.13.6 | HTTP client for API calls | Consistent request/response interceptors, automatic JSON serialization, multipart file upload via FormData. Use over native `fetch` for cleaner error handling and interceptor patterns that demonstrate production habits. |
| react-window | 2.2.7 | Table row virtualization | Virtualizes the 50-row preview table (and handles larger datasets). Last published December 2025 — actively maintained. Lighter than TanStack Virtual for this specific use case (fixed-size row list). Use `FixedSizeList` for the data preview table. |

### Testing Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 4.1.2 | Test runner | Vite-native, identical API to Jest, shares Vite config. Use for all unit/hook tests. Requires Node >=20. |
| @testing-library/react | 16.3.2 | Component + hook testing | `renderHook` for custom hooks (required by project rules). `render` + `screen` for component tests. RTL 16 supports React 18/19. |
| msw | 2.12.14 | API mocking in tests | Intercepts `axios` calls at the network layer. Use `http.post('/api/upload', ...)` handlers to mock FastAPI responses in FE tests without a running backend. v2 API (`http.*` instead of `rest.*`). |
| pytest | 9.0.2 | Python test runner | Standard for FastAPI. Use `TestClient` from `starlette.testclient` (bundled with FastAPI) for synchronous endpoint tests. Fixtures in `conftest.py`. |
| httpx | 0.28.1 | Async FastAPI test client | Required for `AsyncClient` in pytest when testing async FastAPI endpoints. `pytest-asyncio` pairs with this. |

### Backend Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| uvicorn | 0.42.0 | ASGI server | Run FastAPI in dev (`uvicorn main:app --reload`) and production (Render uses this). Requires Python >=3.10. |
| python-multipart | 0.0.22 | Multipart file upload parsing | Required by FastAPI for `UploadFile` / `File(...)` dependencies. Without this, POST `/api/upload` will raise a 422 error. Install explicitly — FastAPI does not bundle it. |
| numpy | 2.4.3 | Numerical array operations | pandas 3.x depends on it. Also needed directly for bin edge calculation in histogram preprocessing. |
| scipy | 1.17.1 | Statistical analysis | IQR-based outlier detection (`scipy.stats.iqr`), Pearson p-values (`scipy.stats.pearsonr`). Requires Python >=3.11. |

---

## Installation

```bash
# --- Frontend (run in frontend/) ---

# Core framework
npm create vite@latest frontend -- --template react-ts
cd frontend

# State + HTTP
npm install zustand@5 axios@1

# Charts
npm install recharts@3 @nivo/heatmap@0.99

# Virtualization
npm install react-window@2

# Tailwind v4 (Vite plugin approach)
npm install tailwindcss@4 @tailwindcss/vite@4

# Testing
npm install -D vitest@4 @testing-library/react@16 @testing-library/jest-dom msw@2
npm install -D @testing-library/user-event@14


# --- Backend (run in backend/) ---

# Create venv
python -m venv .venv && source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Core
pip install fastapi==0.135.2 uvicorn[standard]==0.42.0

# Data processing
pip install pandas==3.0.1 numpy==2.4.3 scipy==1.17.1

# File upload (REQUIRED — not bundled with FastAPI)
pip install python-multipart==0.0.22

# Testing
pip install pytest==9.0.2 httpx==0.28.1 pytest-asyncio
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Recharts 3 + @nivo/heatmap | D3.js directly | Only if you need completely custom interactions or animations beyond what Recharts/Nivo expose. D3 is lower-level and requires manual React integration — significant added complexity for portfolio timelines. |
| Recharts 3 + @nivo/heatmap | Victory | Victory has React Native parity but is slower than Recharts for SVG rendering. No built-in heatmap either. Use if building a cross-platform (web + native) charting component. |
| Zustand 5 | Jotai | Jotai's atomic model is better for fine-grained reactivity in large apps. For DataLens (single dataset, ~5 global state slices), Zustand's flat store is simpler and easier to reason about in a portfolio review. |
| Zustand 5 | Redux Toolkit | Redux is correct for apps with >10 developers and complex event sourcing. For a solo portfolio project, the boilerplate overhead is demonstrably worse in code reviews. |
| react-window 2 | @tanstack/react-virtual 3 | TanStack Virtual is better for dynamic row heights and sticky headers. If the preview table needs column pinning or variable heights, switch to `@tanstack/react-virtual@3.13.23`. |
| Tailwind CSS 4 | Tailwind CSS 3 | Use v3 only if you need IE11/old Safari support or are integrating into an existing v3 codebase. For a greenfield 2026 project, v4 is strictly better. |
| FastAPI | Express.js + TypeScript | Only if the entire stack must be TypeScript. FastAPI gives pandas/scipy/numpy with zero FFI overhead — irreplaceable for the data processing layer. |
| FastAPI | Django REST Framework | DRF is heavier, Django ORM assumes a database (DataLens has none). FastAPI's async-first model is better for file streaming and analysis jobs. |
| axios | fetch API | Native `fetch` is fine for simple requests. axios is recommended here because its interceptors let you add a loading-state middleware in one place, which makes the code more portfolio-demonstrable. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Create React App (CRA) | Officially deprecated, no longer maintained, webpack-based slow builds | Vite 8 |
| Victory (for heatmap) | No heatmap component — would require custom D3 implementation | @nivo/heatmap |
| react-virtualized | Predecessor to react-window by the same author, heavier API, less maintained | react-window or @tanstack/react-virtual |
| Chart.js / react-chartjs-2 | Canvas-based (not SVG), harder to style with Tailwind, no native React component model | Recharts (SVG, declarative components) |
| Highcharts | Commercial license required for non-open-source projects — portfolio use is gray area | Recharts + @nivo/heatmap (both MIT) |
| Redux (non-toolkit) | Enormous boilerplate, action/reducer ceremony for a state tree this simple | Zustand 5 |
| Tailwind CSS v3 for new project | v4 is production-stable with superior performance; starting on v3 creates migration debt | Tailwind CSS v4 |
| Flask | Synchronous by default, no native async support without extensions, no automatic validation | FastAPI |
| Django REST Framework | Database ORM overhead, no native async file handling, heavier startup | FastAPI |
| `rest.*` in MSW | Deprecated MSW v1 API — causes runtime warnings in MSW v2 | `http.*` handlers in MSW v2 |

---

## Stack Patterns by Variant

**If the dataset is very large (>100MB CSV):**
- Stream the file with FastAPI's `UploadFile` chunked reading instead of `await file.read()` all at once
- Use `pandas.read_csv(file_obj, chunksize=10000)` for memory-efficient processing
- Return progressive results via Server-Sent Events or polling instead of a single blocking response

**If adding more chart types beyond the current scope:**
- Stay with Recharts for standard types (area, composed, radial)
- Add only needed `@nivo/*` packages (e.g., `@nivo/line`, `@nivo/bar`) — each is a separate npm package, avoiding full-library bundle bloat

**If browser compatibility must extend to older browsers:**
- Pin Tailwind CSS to 3.4.x
- Replace CSS custom properties theme variables with explicit Tailwind config values

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| recharts@3.8.1 | react@18.x, react@19.x | Confirmed peer dep range: ^16.8 \|\| ^17 \|\| ^18 \|\| ^19 |
| @nivo/heatmap@0.99.0 | react@18.x, react@19.x | Peer dep: ^16.14 \|\| ^17.0 \|\| ^18.0 \|\| ^19.0 |
| @testing-library/react@16.3.2 | react@18.x, react@19.x | Node >=18 required |
| vitest@4.1.2 | vite@8.x | Node >=20 required |
| msw@2.12.14 | Node >=18 | Use `http.*` not `rest.*` API |
| tailwindcss@4.2.2 | vite@8.x via @tailwindcss/vite | No tailwind.config.js — CSS @theme only |
| pandas@3.0.1 | python >=3.11, numpy@2.x | Breaking: nullable dtypes default changed vs pandas 2.x |
| scipy@1.17.1 | python >=3.11, numpy@2.x | |
| fastapi@0.135.2 | python >=3.10, pydantic@2.x | Pydantic v1 compat shim removed in 0.100+ |
| uvicorn@0.42.0 | python >=3.10 | |
| react-window@2.2.7 | react@18.x | Last published Dec 2025 — active |

---

## Sources

- `https://registry.npmjs.org/recharts/latest` — version 3.8.1 confirmed (HIGH confidence)
- `https://registry.npmjs.org/zustand/latest` — version 5.0.12 confirmed (HIGH confidence)
- `https://registry.npmjs.org/react-window/latest` — version 2.2.7, published Dec 2025 (HIGH confidence)
- `https://registry.npmjs.org/vite/latest` — version 8.0.3 confirmed (HIGH confidence)
- `https://registry.npmjs.org/axios/latest` — version 1.13.6 confirmed (HIGH confidence)
- `https://registry.npmjs.org/tailwindcss/latest` — version 4.2.2 confirmed (HIGH confidence)
- `https://registry.npmjs.org/vitest/latest` — version 4.1.2 confirmed (HIGH confidence)
- `https://registry.npmjs.org/@testing-library/react/latest` — version 16.3.2 confirmed (HIGH confidence)
- `https://registry.npmjs.org/msw/latest` — version 2.12.14 confirmed (HIGH confidence)
- `https://registry.npmjs.org/@nivo/heatmap/latest` — version 0.99.0, peer deps React 16–19 confirmed (HIGH confidence)
- `https://registry.npmjs.org/@tanstack/react-virtual/latest` — version 3.13.23 (HIGH confidence)
- `https://pypi.org/pypi/fastapi/json` — version 0.135.2 confirmed (HIGH confidence)
- `https://pypi.org/pypi/pandas/json` — version 3.0.1 confirmed (HIGH confidence)
- `https://pypi.org/pypi/numpy/json` — version 2.4.3 confirmed (HIGH confidence)
- `https://pypi.org/pypi/scipy/json` — version 1.17.1 confirmed (HIGH confidence)
- `https://pypi.org/pypi/uvicorn/json` — version 0.42.0 confirmed (HIGH confidence)
- `https://pypi.org/pypi/python-multipart/json` — version 0.0.22 confirmed (HIGH confidence)
- `https://pypi.org/pypi/pytest/json` — version 9.0.2 confirmed (HIGH confidence)
- `https://pypi.org/pypi/httpx/json` — version 0.28.1 confirmed (HIGH confidence)
- WebSearch: Tailwind v4 Vite plugin architecture, CSS-first config — multiple sources agree (MEDIUM confidence)
- WebSearch: react-window vs TanStack Virtual 2025 comparison — npmtrends data cited (MEDIUM confidence)
- WebSearch: Recharts vs Nivo vs Victory 2025 — LogRocket + multiple sources (MEDIUM confidence)

---

*Stack research for: DataLens — browser-based EDA platform (React 18 + TypeScript + FastAPI + pandas)*
*Researched: 2026-03-27*
