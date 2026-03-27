# Phase 2: Upload + API + State - Research

**Researched:** 2026-03-27
**Status:** Complete

## 1. FastAPI File Upload & Analysis Endpoints

### Upload Endpoint (POST /api/upload)

**Key patterns:**
- Use `UploadFile` from FastAPI with `python-multipart` (already installed)
- File size validation: Check `Content-Length` header or read file size before processing
- 10MB limit enforcement: Return 413 with clear error message

```python
from fastapi import UploadFile, HTTPException

@router.post("/api/upload")
async def upload_file(file: UploadFile):
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(413, "File size exceeds 10MB limit")
```

**Parser Service:**
- `pandas.read_csv(io.BytesIO(contents), low_memory=False)` for CSV
- `pandas.read_json(io.BytesIO(contents))` for JSON
- Content-type or extension detection to route parser
- `low_memory=False` ensures consistent dtype inference (ANLZ-04)
- Secondary type inference: `df.infer_objects()` or manual column type detection

**Column Type Detection (UPLD-03):**
```python
def detect_column_type(series: pd.Series) -> str:
    if pd.api.types.is_numeric_dtype(series): return "numeric"
    if pd.api.types.is_datetime64_any_dtype(series): return "datetime"
    try:
        pd.to_datetime(series, infer_datetime_format=True)
        return "datetime"
    except: pass
    if series.nunique() / len(series) < 0.5: return "categorical"
    return "text"
```

### Analysis Endpoint (POST /api/analyze)

**Architecture decision:** Store uploaded data in memory (session-based dict keyed by file_id), then analyze on request. Since auto-analyze is triggered immediately, the upload endpoint can return preview while analysis runs.

**Four services (ANLZ-02):**

1. **stats_service** — `df.describe()` per numeric column, returns mean/std/min/max/Q1/median/Q3/skewness
2. **correlation_service** — `df.select_dtypes(include='number').corr(method='pearson')`, returns matrix as dict
3. **outlier_service** — IQR method per numeric column: Q1 - 1.5*IQR to Q3 + 1.5*IQR, returns bounds + outlier indices
4. **quality_service** — constant columns, high-cardinality, high null ratio, skewness alerts

### run_in_executor (ANLZ-03)

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=2)

async def run_analysis(df):
    loop = asyncio.get_event_loop()
    stats = await loop.run_in_executor(executor, stats_service.analyze, df)
    correlation = await loop.run_in_executor(executor, correlation_service.analyze, df)
    outliers = await loop.run_in_executor(executor, outlier_service.analyze, df)
    quality = await loop.run_in_executor(executor, quality_service.analyze, df)
    return AnalysisResult(stats=stats, correlation=correlation, outliers=outliers, quality=quality)
```

### pandas 3.x Considerations

- pandas 3.0.1 uses nullable dtypes by default (Int64, Float64 instead of int64, float64)
- `.describe()` output shape is consistent but values may be `pd.NA` instead of `NaN`
- Use `.to_dict()` for JSON serialization — `pd.NA` needs explicit handling
- Test with actual CSV fixtures to validate `.describe()` output shape

### Pydantic Response Schemas

`AnalysisResultResponse` needs full typing:
```python
class SummaryStats(BaseModel):
    mean: float | None
    std: float | None
    min: float | None
    max: float | None
    q1: float | None
    median: float | None
    q3: float | None
    skewness: float | None

class CorrelationMatrix(BaseModel):
    columns: list[str]
    values: list[list[float | None]]

class OutlierResult(BaseModel):
    column: str
    lower_bound: float
    upper_bound: float
    outlier_count: int
    outlier_indices: list[int]

class QualityAlert(BaseModel):
    column: str
    alert_type: str  # "constant", "high_cardinality", "high_null", "high_skew"
    message: str
    severity: str  # "warning", "info"

class AnalysisResultResponse(BaseModel):
    summary: dict[str, SummaryStats]
    correlation: CorrelationMatrix
    outliers: list[OutlierResult]
    quality_alerts: list[QualityAlert]
    row_count: int
    column_count: int
    missing_ratio: float
    duplicate_count: int
```

## 2. Frontend State Management (Zustand 5)

### Slices Pattern (PERF-01)

Zustand 5 slices pattern with TypeScript — each slice is a `StateCreator`:

```typescript
import { create, StateCreator } from 'zustand'

// Slice interfaces
interface DatasetSlice {
  rawData: Record<string, unknown>[]
  columns: ColumnMeta[]
  rowCount: number
  setDataset: (data: Record<string, unknown>[], columns: ColumnMeta[], rowCount: number) => void
}

interface AnalysisSlice {
  analysisResult: AnalysisResultResponse | null
  setAnalysisResult: (result: AnalysisResultResponse) => void
}

interface UiSlice {
  status: 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'
  error: string | null
  analysisStep: string | null
  setStatus: (status: UiSlice['status']) => void
  setError: (error: string | null) => void
  setAnalysisStep: (step: string | null) => void
}

// Combined store type
type StoreState = DatasetSlice & AnalysisSlice & UiSlice & { resetStore: () => void }

// Slice creators
const createDatasetSlice: StateCreator<StoreState, [], [], DatasetSlice> = (set) => ({ ... })
const createAnalysisSlice: StateCreator<StoreState, [], [], AnalysisSlice> = (set) => ({ ... })
const createUiSlice: StateCreator<StoreState, [], [], UiSlice> = (set) => ({ ... })

// Combined store with resetStore
const useStore = create<StoreState>()((...a) => ({
  ...createDatasetSlice(...a),
  ...createAnalysisSlice(...a),
  ...createUiSlice(...a),
  resetStore: () => set(initialState),
}))
```

### Reset Pattern

Store initial state separately, `resetStore()` calls `set(initialState)`:

```typescript
const initialState = {
  rawData: [], columns: [], rowCount: 0,
  analysisResult: null,
  status: 'idle' as const, error: null, analysisStep: null,
}
```

## 3. react-window Virtualized Table

### Grid Component for Data Table

react-window `Grid` component is the right choice for tabular data with both vertical and horizontal scrolling:

```tsx
import { Grid, type CellComponentProps } from 'react-window'

// Column widths based on content type
function columnWidth(index: number, columns: ColumnMeta[]): number {
  const col = columns[index]
  switch (col.type) {
    case 'numeric': return 120
    case 'datetime': return 160
    case 'categorical': return 150
    case 'text': return 200
    default: return 150
  }
}

// Grid with fixed row height (compact table)
<Grid
  cellComponent={DataCell}
  cellProps={{ data, columns }}
  columnCount={columns.length}
  columnWidth={(index) => columnWidth(index, columns)}
  rowCount={Math.min(data.length, 50)}
  rowHeight={32}  // compact row height
  className="h-[400px] w-full"
  defaultHeight={400}
  defaultWidth={800}
  overscanCount={5}
/>
```

**Key considerations:**
- Separate header row (not virtualized) with column name + type badge
- Grid body for 50 data rows (virtualized)
- `overscanCount={5}` for smooth scrolling
- Column widths vary by type

## 4. MSW 2.x for API Mocking (TEST-03)

### Setup with Vitest

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('http://localhost:8000/api/upload', async ({ request }) => {
    const data = await request.formData()
    const file = data.get('file')
    if (!file || !(file instanceof File)) {
      return new HttpResponse('Missing file', { status: 400 })
    }
    return HttpResponse.json({
      columns: [...],
      preview: [...],
      row_count: 100,
    })
  }),

  http.post('http://localhost:8000/api/analyze', () => {
    return HttpResponse.json({
      summary: {...},
      correlation: {...},
      outliers: [...],
      quality_alerts: [...],
    })
  }),
]

// src/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
export const server = setupServer(...handlers)

// vitest.setup.ts (add to existing setup)
import { server } from './mocks/server'
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

**MSW 2.x key changes:**
- Import `http` (not `rest`) from `msw`
- `HttpResponse.json()` instead of `res(ctx.json())`
- `setupServer` from `msw/node` for Vitest (Node environment)
- MSW needs to be installed: `npm install -D msw`

## 5. File Upload UX (HTML5 Drag & Drop)

### Drag & Drop Implementation

```typescript
// useFileUpload hook pattern
const useFileUpload = () => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files[0]
    if (file) validateAndUpload(file)
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndUpload(file)
  }
}
```

**Client-side validation (before upload):**
1. Extension check: `.csv` or `.json` only
2. Size check: `file.size > 10 * 1024 * 1024` → error
3. MIME type check as secondary validation

### FormData Upload

```typescript
const uploadFile = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / (e.total ?? 1))),
  })
  return response.data as UploadResponse
}
```

## 6. Testing Strategy

### Backend (pytest) — TEST-04

- **parser_service**: Test CSV/JSON parsing, type detection, edge cases (empty, header-only)
- **stats_service**: Test with known data, verify mean/std/min/max values
- **correlation_service**: Test with known correlations, verify matrix symmetry
- **outlier_service**: Test IQR bounds with known outliers
- Use `pytest.fixture` with sample DataFrames
- Test `httpx.AsyncClient` for endpoint integration tests

### Frontend (Vitest) — TEST-01, TEST-03

- **useUpload hook**: Test file validation, upload progress, error states
- **useAnalysis hook**: Test auto-trigger, step progress, error/retry
- **analysisApi**: MSW-mocked tests for upload/analyze endpoints
- Use `@testing-library/react` `renderHook` for hook testing
- `vi.fn()` for mocking axios progress callbacks

## 7. Validation Architecture

### Backend Validation Points
1. File extension validation (FastAPI level)
2. File size validation (10MB limit)
3. Parse validation (valid CSV/JSON structure)
4. Data validation (non-empty, has rows)
5. Type inference validation (no crash on mixed types)

### Frontend Validation Points
1. Client-side extension check before upload
2. Client-side size check before upload
3. Response shape validation (TypeScript types)
4. Error state transitions (Zustand status flow)

### Integration Points
1. Upload → Parse → Preview: End-to-end data flow
2. Upload → Analyze → Store: Full analysis pipeline
3. Reset → Upload: State cleanup verification
4. Error → Retry: Error recovery flow

## 8. Dependencies to Install

### Frontend (npm)
- `zustand` (v5) — state management
- `react-window` (v2) — virtualized table
- `msw` (v2, devDep) — API mocking for tests

### Backend (pip)
- All dependencies already in requirements.txt

## 9. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| pandas 3.x nullable dtype changes | Test .describe() output with fixture CSV, handle pd.NA explicitly |
| Large file parsing blocks event loop | run_in_executor with ThreadPoolExecutor |
| Mixed-type columns crash parser | low_memory=False + try/except with column-level error handling |
| react-window Grid typing | Use CellComponentProps generic from react-window |
| MSW 2.x API changes | Follow mswjs.io docs — http (not rest), HttpResponse.json() |

---

## RESEARCH COMPLETE

*Phase: 02-upload-api-state*
*Researched: 2026-03-27*
