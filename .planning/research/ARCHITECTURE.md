# Architecture Research

**Domain:** Browser-based EDA / Interactive Data Exploration Platform
**Researched:** 2026-03-27
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (React 18 SPA)                        │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│  Upload Zone │  Data Table  │  Chart Panel │  Summary / Report Card │
│  (drag-drop) │  (virtual.)  │  (Recharts)  │  (stats, nulls, types) │
├──────────────┴──────────────┴──────────────┴────────────────────────┤
│                     Zustand Global Store                             │
│   datasetSlice │ analysisSlice │ uiSlice (loading, activeView)       │
├─────────────────────────────────────────────────────────────────────┤
│                     API Service Layer (axios)                        │
│         uploadFile()  │  requestAnalysis()  │  error handling        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  HTTP / REST (multipart + JSON)
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                        FastAPI Backend                               │
├──────────────────────────────────────────────────────────────────────┤
│  POST /api/upload              │  POST /api/analyze                  │
│  (parse CSV/JSON → DataFrame)  │  (stats, corr, outliers → JSON)     │
├──────────────────────────────────────────────────────────────────────┤
│                     Service Layer (Python)                           │
│   parser_service  │  stats_service  │  correlation_service           │
│                   │  outlier_service │                               │
├──────────────────────────────────────────────────────────────────────┤
│                  pandas / numpy / scipy                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Upload Zone | Drag-and-drop file intake, format validation, triggers upload API call | `react-dropzone` or native HTML5 drag events; shows progress/error states |
| API Service Layer | Encapsulates all HTTP calls, handles errors, maps responses to typed interfaces | `axios` instance with base URL + typed wrappers per endpoint |
| Zustand Store | Single source of truth for dataset, analysis results, and UI state (loading, active tab) | 2-3 slices: `datasetSlice`, `analysisSlice`, `uiSlice` |
| Data Table | Renders parsed row/column preview with column type badges; virtualized for large files | `react-window` FixedSizeList; column headers show inferred type |
| Chart Panel | Renders column-appropriate charts (histogram, bar, time series) driven by column metadata | `Recharts` components selected by column type from `analysisSlice` |
| Correlation Heatmap | Matrix of Pearson r values; click cell → scatter plot modal | Recharts `ScatterChart` in a modal; correlation matrix from backend |
| Outlier Panel | IQR-flagged rows highlighted; toggle to filter or show-all | Boolean flag per row in analysis result; filter state in `uiSlice` |
| Summary Card | Row count, column count, null %, per-column basic stats | Static display of `analysisSlice.summary`; renders immediately after analysis |
| FastAPI Router (`/api/upload`) | Receives `multipart/form-data`, delegates to parser, returns column schema | UploadFile → `parser_service.parse()` → Pydantic response |
| FastAPI Router (`/api/analyze`) | Receives parsed dataset reference, runs all analysis, returns combined result | Calls `stats_service`, `correlation_service`, `outlier_service` in sequence |
| Parser Service | CSV/JSON → pandas DataFrame; infers column dtypes; returns schema JSON | `pandas.read_csv` / `json_normalize`; dtype mapping to FE-friendly types |
| Stats Service | Per-column descriptive statistics (mean, median, std, min, max, null count) | `DataFrame.describe()` + null counts |
| Correlation Service | Pearson correlation matrix for numeric columns | `DataFrame.corr()` |
| Outlier Service | IQR-based outlier detection; returns row indices flagged as outliers | `Q1 - 1.5*IQR`, `Q3 + 1.5*IQR` per numeric column |

## Recommended Project Structure

```
datalens/
├── frontend/                   # React 18 + TypeScript SPA
│   ├── src/
│   │   ├── api/                # Axios instance + typed endpoint wrappers
│   │   │   ├── client.ts       # Axios base instance (baseURL, interceptors)
│   │   │   ├── upload.ts       # uploadFile(file: File): Promise<DatasetMeta>
│   │   │   └── analyze.ts      # requestAnalysis(datasetId): Promise<AnalysisResult>
│   │   ├── store/              # Zustand slices
│   │   │   ├── datasetSlice.ts # raw rows, column schema, datasetId
│   │   │   ├── analysisSlice.ts# stats, correlation matrix, outlier indices
│   │   │   └── uiSlice.ts      # loading flags, active view, modal state
│   │   ├── components/
│   │   │   ├── upload/         # DropZone, FilePreview, UploadProgress
│   │   │   ├── table/          # DataTable, ColumnHeader, TypeBadge
│   │   │   ├── charts/         # HistogramChart, BarChart, TimeSeriesChart
│   │   │   │                   # CorrelationHeatmap, ScatterModal
│   │   │   ├── outlier/        # OutlierPanel, OutlierToggle
│   │   │   └── summary/        # SummaryCard, StatRow
│   │   ├── hooks/              # Custom hooks (tested individually)
│   │   │   ├── useUpload.ts    # file upload state machine
│   │   │   ├── useAnalysis.ts  # triggers analysis, manages loading
│   │   │   └── useColumnChart.ts # selects chart type from column dtype
│   │   ├── types/              # Shared TypeScript interfaces
│   │   │   ├── dataset.ts      # ColumnMeta, DatasetMeta, Row
│   │   │   └── analysis.ts     # AnalysisResult, StatsResult, OutlierResult
│   │   ├── utils/              # Pure helper functions
│   │   │   └── formatters.ts   # number formatting, null display
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tests/                  # Vitest + RTL
│   └── vite.config.ts
│
└── backend/                    # FastAPI + pandas
    ├── app/
    │   ├── main.py             # FastAPI app, CORS, router registration
    │   ├── api/
    │   │   ├── upload.py       # POST /api/upload router
    │   │   └── analyze.py      # POST /api/analyze router
    │   ├── services/
    │   │   ├── parser_service.py     # CSV/JSON → DataFrame + schema
    │   │   ├── stats_service.py      # descriptive statistics
    │   │   ├── correlation_service.py# Pearson matrix
    │   │   └── outlier_service.py    # IQR detection
    │   ├── schemas/
    │   │   ├── upload.py       # Pydantic: DatasetMetaResponse
    │   │   └── analysis.py     # Pydantic: AnalysisResultResponse
    │   └── core/
    │       ├── config.py       # env vars (CORS origins, max file size)
    │       └── exceptions.py   # HTTPException wrappers
    ├── tests/                  # pytest
    └── requirements.txt
```

### Structure Rationale

- **`api/` (frontend):** All HTTP logic isolated from components. Components never import axios directly — they call typed wrappers. This makes mocking trivial with msw and keeps components unit-testable.
- **`store/` slices:** Split by concern, not by component. `datasetSlice` holds what came back from the server; `uiSlice` holds purely client-side state (what tab is open, is a modal showing). Avoids one monolithic store that is hard to test.
- **`hooks/`:** Every custom hook gets its own test file. `useUpload` owns the upload state machine (idle → uploading → success/error). `useAnalysis` owns the analysis trigger and loading state.
- **`services/` (backend):** Routers are thin — they validate with Pydantic and delegate to services. Services contain all pandas logic and are independently testable with pytest without spinning up FastAPI.
- **`schemas/` (backend):** Pydantic models serve as the contract between FE and BE. When the schema changes, TypeScript types in `frontend/src/types/` must be updated to match — this is the only cross-boundary coupling point.

## Architectural Patterns

### Pattern 1: Upload → Analyze Two-Step Pipeline

**What:** The file upload and the analysis are two separate API calls. Upload returns a `datasetId` (or the full parsed rows for a stateless design). The analyze call then operates on that data and returns all analysis results in one response.

**When to use:** Always for this domain. Separating upload from analysis lets the FE show the raw table immediately after upload (fast feedback), then trigger analysis as a second step.

**Trade-offs:** Adds one extra round trip but enables incremental UX. For a stateless design (no server-side session), the FE passes the parsed rows back to the analyze endpoint, which is simpler to deploy (no session storage on Render's free tier).

**Example:**
```typescript
// hooks/useUpload.ts
const useUpload = () => {
  const setDataset = useDatasetStore((s) => s.setDataset);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');

  const upload = async (file: File) => {
    setStatus('uploading');
    try {
      const result = await uploadFile(file);   // POST /api/upload
      setDataset(result);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return { upload, status };
};
```

### Pattern 2: Column-Type-Driven Chart Selection

**What:** The backend returns a `dtype` for each column (`numeric`, `categorical`, `datetime`, `text`). The frontend maps this to a specific Recharts component. No if/else trees in components — one lookup object drives the mapping.

**When to use:** Whenever chart type depends on data type — which is always the case in an auto-EDA tool.

**Trade-offs:** The mapping table must be exhaustive; unknown dtypes need a fallback. Keeps chart components free of conditional logic.

**Example:**
```typescript
// hooks/useColumnChart.ts
const CHART_MAP: Record<ColumnDtype, React.ComponentType<ChartProps>> = {
  numeric:     HistogramChart,
  categorical: BarChart,
  datetime:    TimeSeriesChart,
  text:        null,   // no chart for free text
};

const useColumnChart = (dtype: ColumnDtype) => CHART_MAP[dtype] ?? null;
```

### Pattern 3: Backend Services Are Pure Functions of DataFrames

**What:** Each backend service (`stats_service`, `correlation_service`, `outlier_service`) takes a pandas DataFrame as input and returns a plain Python dict. No side effects, no I/O.

**When to use:** Always for this design (stateless, no database). Pure functions are trivial to unit-test with pytest — just pass a DataFrame fixture and assert the output.

**Trade-offs:** The DataFrame must be reconstructed from the request body on every call. For large files this adds deserialization cost, but is acceptable for a portfolio tool with no persistent storage requirement.

**Example:**
```python
# services/stats_service.py
def compute_stats(df: pd.DataFrame) -> dict:
    return {
        col: {
            "mean":   df[col].mean() if pd.api.types.is_numeric_dtype(df[col]) else None,
            "nulls":  int(df[col].isna().sum()),
            "unique": int(df[col].nunique()),
        }
        for col in df.columns
    }
```

## Data Flow

### Upload Flow

```
User drops file
    ↓
DropZone component → useUpload hook
    ↓
uploadFile(file)  →  POST /api/upload (multipart/form-data)
    ↓                      ↓
                   parser_service.parse(file)
                   → pandas DataFrame
                   → infer column dtypes
                   → return DatasetMetaResponse (rows[], columns[])
    ↓
datasetSlice.setDataset(result)
    ↓
DataTable renders (react-window virtualization)
useAnalysis hook auto-triggers  →  POST /api/analyze (JSON rows)
    ↓                                      ↓
                                  stats_service
                                  correlation_service
                                  outlier_service
                                  → AnalysisResultResponse
    ↓
analysisSlice.setAnalysis(result)
    ↓
ChartPanel, CorrelationHeatmap, OutlierPanel, SummaryCard all render
```

### State Management Flow

```
Zustand Store
├── datasetSlice
│   ├── rows: Row[]             ← set by uploadFile response
│   ├── columns: ColumnMeta[]   ← set by uploadFile response
│   └── datasetId: string | null
│
├── analysisSlice
│   ├── stats: StatsResult      ← set by analyze response
│   ├── correlation: number[][] ← set by analyze response
│   ├── outliers: number[]      ← row indices flagged
│   └── status: 'idle'|'loading'|'done'|'error'
│
└── uiSlice
    ├── activeTab: 'table'|'charts'|'correlation'|'outliers'
    ├── scatterModal: { open: boolean; colX: string; colY: string }
    └── outlierFilterActive: boolean
```

### Key Data Flows

1. **File → Table:** Drop → multipart POST → parsed rows in `datasetSlice` → DataTable renders with react-window. No analysis yet; user sees their data immediately.
2. **Dataset → Analysis:** `useAnalysis` fires POST /api/analyze when `datasetSlice.rows` is populated. All four analysis types return in a single response and fan out to four UI sections simultaneously.
3. **Outlier Toggle:** `uiSlice.outlierFilterActive` is a boolean. DataTable reads it and filters `rows` by whether the row index is in `analysisSlice.outliers`. No re-fetch required.
4. **Correlation Cell Click:** Click handler sets `uiSlice.scatterModal` with the two column names. `ScatterModal` reads those names and renders the scatter plot from existing `datasetSlice.rows` — no API call needed.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current stateless design — no session storage, each request is self-contained. Render free tier is sufficient. |
| 1k-10k users | Add file size cap enforcement. Consider keeping DataFrames in server-side session (Redis) to avoid re-sending full row data on analyze call. |
| 10k+ users | Background task queue (Celery) for large file analysis. Streaming response for progressive chart rendering. Move to async pandas alternatives (polars). |

### Scaling Priorities

1. **First bottleneck:** Large file uploads blocking the event loop. Fix: FastAPI `BackgroundTasks` or async file reading with `aiofiles`. Pandas is synchronous — wrap in `run_in_executor` or switch to polars.
2. **Second bottleneck:** Sending full row data back to backend on every analyze call. Fix: session-keyed storage (Redis) — upload stores the DataFrame, analyze retrieves by `datasetId`.

## Anti-Patterns

### Anti-Pattern 1: Fetching Inside Chart Components

**What people do:** Chart components call the API directly to get their data (`useEffect → axios` inside `HistogramChart`).
**Why it's wrong:** Creates N parallel API calls (one per column), bypasses the global loading state, and makes the component impossible to test without a running server.
**Do this instead:** All data fetching in `useAnalysis` hook. Chart components receive fully typed props from the store — they are pure rendering components with no side effects.

### Anti-Pattern 2: One Monolithic Zustand Store

**What people do:** All state (rows, stats, correlation, loading flags, modal open/close) in a single flat Zustand object.
**Why it's wrong:** Any state change triggers re-renders in all subscribed components, even those that don't need the changed field. Difficult to test slices in isolation.
**Do this instead:** Three slices (`datasetSlice`, `analysisSlice`, `uiSlice`). Components subscribe to only the slice they need. Zustand's `useStore(s => s.specificField)` selector prevents over-rendering.

### Anti-Pattern 3: Putting Business Logic in FastAPI Route Handlers

**What people do:** Pandas operations (`df.describe()`, `df.corr()`) written directly in router functions.
**Why it's wrong:** Route handlers become untestable without HTTP context. A single change to one analysis step means editing the router file. Violates single responsibility.
**Do this instead:** Router validates input (Pydantic) and delegates to service. Service contains all pandas logic and is tested with plain pytest — no HTTP layer required.

### Anti-Pattern 4: Skipping react-window for the Data Table

**What people do:** Render all N rows as DOM nodes with `Array.map` in the table component.
**Why it's wrong:** Files with 10k+ rows freeze the browser. A 50MB CSV with 50k rows renders ~50k `<tr>` elements — immediate janky UX.
**Do this instead:** `react-window` FixedSizeList. Only the visible rows are in the DOM at any time. Required for any file that can be over ~500 rows.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Vercel (Frontend) | Static SPA deployment, `VITE_API_URL` env var points to Render backend | Build output is `dist/`. No SSR needed. |
| Render (Backend) | FastAPI on gunicorn/uvicorn worker. Free tier cold starts ~30s | Add a `/health` endpoint so the FE can show a "backend waking up" message |
| GitHub Actions CI | Push → run `vitest`, `pytest`, `tsc --noEmit`, build check | Separate jobs for FE and BE so failures are clearly attributed |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| React components ↔ Zustand | Direct store subscription via selectors | Components never call `api/` directly |
| Zustand ↔ API layer | Custom hooks (`useUpload`, `useAnalysis`) bridge the two | Hooks own all async orchestration |
| API layer ↔ FastAPI | HTTP REST: multipart for upload, JSON for analyze | Axios baseURL set from `VITE_API_URL`; CORS configured in FastAPI `main.py` |
| FastAPI routers ↔ services | Direct Python function calls | Routers import services; services never import routers |
| Frontend types ↔ Backend schemas | Manually kept in sync (TypeScript interfaces mirror Pydantic models) | Single source of drift risk — document the contract in `types/analysis.ts` |

## Build Order Implications

The component dependencies create a natural build sequence:

1. **Types + Schemas first** (`frontend/src/types/` and `backend/app/schemas/`) — establish the data contract between layers. Nothing else can be typed correctly without this.
2. **Backend services second** — pure functions, independently testable. `parser_service` is a hard dependency for everything else.
3. **FastAPI routers third** — thin wrappers over services; integration-test with `pytest` + `httpx`.
4. **API service layer (frontend) fourth** — typed wrappers over the now-working backend; test with msw mocks.
5. **Zustand store fifth** — depends on the TypeScript types established in step 1.
6. **Custom hooks sixth** — bridge store and API layer; unit-test with Vitest.
7. **Leaf components last** — DropZone, DataTable, Charts, SummaryCard. All are pure renderers that receive props or read from store; easiest to build once data contracts are stable.

## Sources

- [equinor/template-fastapi-react — Clean Architecture SPA template](https://github.com/equinor/template-fastapi-react)
- [FastAPI Best Practices — zhanymkanov](https://github.com/zhanymkanov/fastapi-best-practices)
- [FastAPI Request Files — official docs](https://fastapi.tiangolo.com/tutorial/request-files/)
- [Developing a Single Page App with FastAPI and React — TestDriven.io](https://testdriven.io/blog/fastapi-react/)
- [FastAPI and React in 2025 — joshfinnie.com](https://www.joshfinnie.com/blog/fastapi-and-react-in-2025/)
- [React State Management 2025 — developerway.com](https://www.developerway.com/posts/react-state-management-2025)

---
*Architecture research for: Browser-based EDA / Interactive Data Exploration Platform (DataLens)*
*Researched: 2026-03-27*
