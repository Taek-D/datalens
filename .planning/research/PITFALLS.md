# Pitfalls Research

**Domain:** Browser-based EDA / Interactive Data Exploration Platform (React + FastAPI + pandas)
**Researched:** 2026-03-27
**Confidence:** HIGH (critical pitfalls verified via official docs and multiple sources)

---

## Critical Pitfalls

### Pitfall 1: Render Free-Tier Cold Start Destroys First Impression

**What goes wrong:**
The FastAPI backend on Render's free tier spins down after 15 minutes of inactivity. The first request after sleep takes 30–60 seconds to respond. A portfolio reviewer opens the app, drops a CSV, and sees a loading spinner that never resolves — or sees a network timeout error. The app appears broken.

**Why it happens:**
Render free tier has 750 hours/month of runtime. To conserve resources, inactive services sleep. Most developers discover this only after deployment, not during local development where the server is always warm.

**How to avoid:**
- Implement a `/health` ping endpoint in FastAPI from the start.
- On the React frontend, call the health endpoint on app mount (not on first user action) to warm the server while the user is reading the UI.
- Show a "Connecting to analysis server..." status indicator with a progress bar if the health check takes > 2 seconds — turns a broken-looking delay into an expected UX beat.
- Optionally: use UptimeRobot (free tier) to ping the endpoint every 10 minutes to prevent sleep entirely.

**Warning signs:**
- First API call after deployment takes > 5 seconds.
- Axios timeout errors appear only on first interaction, not subsequent ones.
- Local dev works perfectly but deployed demo feels broken.

**Phase to address:** Infrastructure / Deployment phase (Phase 1 skeleton — implement health check + frontend warm-up call before any real feature work).

---

### Pitfall 2: pandas `low_memory=True` Causes Silent Mixed-Type Columns

**What goes wrong:**
`pandas.read_csv()` defaults to `low_memory=True`, which processes files in chunks and infers types per-chunk. A column like `["1", "2", "NA", "3"]` can be inferred as `int64` in one chunk and `object` in another, producing a column with mixed `object` dtype. The column type auto-detection logic then misclassifies it (e.g., reports it as a numeric column when it cannot be converted), and downstream charts (histogram, stats) crash or silently produce wrong values.

**Why it happens:**
Developers test with small, clean CSV files where this never triggers. The bug surfaces only when users upload real-world messy data — exactly the case this tool is meant for.

**How to avoid:**
- Always pass `low_memory=False` in `pd.read_csv()` for uploaded files.
- After loading, explicitly run a secondary type-inference pass: attempt numeric conversion per column with `pd.to_numeric(col, errors='coerce')` and check the null-introduction rate. If < 5% new nulls are introduced, treat as numeric.
- Return actual inferred dtypes from the backend in the `/api/analyze` response alongside the column classification so the frontend can display `"int64"` vs `"object"` to the user.

**Warning signs:**
- Columns with null/missing values inconsistently classified as numeric vs. categorical.
- `DtypeWarning` appears in FastAPI logs but is swallowed silently.
- IQR outlier detection crashes on columns that "should be" numeric.

**Phase to address:** Backend data parsing phase (Phase 2 — file upload + analysis endpoint, before building any chart components).

---

### Pitfall 3: Recharts SVG Renders All Data Points — Scatter Plot Crashes at 10k+ Rows

**What goes wrong:**
Recharts renders SVG — one DOM node per data point. A scatter plot with 50,000 points creates 50,000 `<circle>` elements. The browser tab freezes or crashes. Even at 10,000 points, interaction (hover tooltips, zoom) becomes laggy enough to be unusable. A correlation heatmap for 30 numeric columns (30×30 = 900 cells) is fine, but scatter plots for raw data are dangerous.

**Why it happens:**
Developers build scatter plots with test files of 100–500 rows. Real datasets — even "small" ones like exported CSVs from Excel — routinely have 5,000–50,000 rows. There is no automatic downsampling in Recharts.

**How to avoid:**
- Implement server-side downsampling using LTTB (Largest-Triangle-Three-Buckets) algorithm or simple random sampling before sending scatter data to the frontend. Cap at 2,000 points for scatter plots.
- For correlation heatmap (fixed N×N matrix), this is not a problem — no downsampling needed.
- Add a label in the UI: "Showing 2,000 of 47,832 points (sampled)" so users understand the visualization is not truncated silently.
- In the `/api/analyze` response, include a `sampled: boolean` field with the original row count.

**Warning signs:**
- Chart render takes > 1 second on test data larger than 5,000 rows.
- Browser DevTools shows 50,000+ SVG elements in the DOM.
- Memory usage climbs steadily as user switches between different scatter pair columns without component cleanup.

**Phase to address:** Visualization phase (Phase 3 — before scatter plot or heatmap components are marked done, enforce sampling at the API level).

---

### Pitfall 4: CORS Breaks on Deployment Despite Working Locally

**What goes wrong:**
During local development, both frontend (localhost:5173) and backend (localhost:8000) are on the same host. After deploying to Vercel (FE) and Render (BE), the origins diverge. If `allow_origins` in FastAPI's `CORSMiddleware` contains `"localhost:5173"` or a wildcard `"*"` with `allow_credentials=True`, the browser blocks all requests. The app shows a blank screen or network errors with no clear message in non-developer tools.

**Why it happens:**
CORS is invisible during local development. Developers add the middleware, see it working locally, and assume deployment will work. The production Vercel URL (`https://datalens.vercel.app`) is not known at development time, so it never gets added to `allow_origins`.

**How to avoid:**
- Store allowed origins in a FastAPI environment variable (`ALLOWED_ORIGINS`) injected at deploy time.
- In FastAPI: `allow_origins=os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")`.
- Set the Render environment variable to `https://datalens.vercel.app` during deployment configuration.
- Do NOT use `allow_origins=["*"]` with `allow_credentials=True` — browsers reject this combination by spec.
- Add a CORS smoke test to CI: after deploy, `curl -H "Origin: https://datalens.vercel.app"` the `/health` endpoint and assert `Access-Control-Allow-Origin` is present in the response.

**Warning signs:**
- All API calls succeed in local dev but return network errors after deployment.
- Browser console shows `"blocked by CORS policy"` with the Vercel origin.
- FastAPI logs show requests arriving but no CORS header in response.

**Phase to address:** Phase 1 (project skeleton) — configure CORS via env var from the first day, not as a fix-it-later step.

---

### Pitfall 5: Zustand Store Carries Stale Data Across File Uploads

**What goes wrong:**
User uploads File A, explores charts. Uploads File B. The Zustand store still contains columns, stats, and chart data from File A because the upload action only partially overwrites the store — it sets `columns` and `data` but leaves `selectedColumns`, `activeChart`, `outlierFilter` pointing to column names that don't exist in File B. The UI either crashes (undefined column access) or silently shows incorrect charts mixing data from both files.

**Why it happens:**
Zustand `set()` merges state by default — it does not replace the entire store. Developers add new fields over time without updating the reset logic. The bug is invisible if you always test with the same CSV structure.

**How to avoid:**
- Implement a `resetStore` action at the Zustand store level that returns every slice to its initial value.
- Invoke `resetStore()` as the first action when a new file upload begins — before the upload API call, not after.
- Define the initial state as a typed constant (`const initialState: DataState = {...}`) and use `set(initialState)` in the reset function — this ensures new fields added during development are automatically included in resets.
- Write a Vitest test that simulates two sequential uploads and asserts the store is clean between them.

**Warning signs:**
- `Cannot read properties of undefined (reading 'type')` errors in chart components after uploading a second file.
- Correlation heatmap shows columns from the previous dataset.
- Outlier toggle state persists across completely different files.

**Phase to address:** Phase 2 (state layer setup) — define initial state constant and reset action before building any upload or analysis flow.

---

### Pitfall 6: File Size Has No Limit — Large Files Block the Async Event Loop

**What goes wrong:**
FastAPI's `UploadFile` reads the entire file into memory by default for files under ~1MB, then spills to a temp file. `pd.read_csv()` on a 200MB file runs synchronously in the async request handler, blocking the entire Uvicorn event loop. Every concurrent request (e.g., health checks) hangs until pandas finishes parsing. On Render free tier with 512MB RAM, a 100MB CSV can exhaust available memory and crash the dyno.

**Why it happens:**
FastAPI is async, but pandas operations are synchronous Python. Running blocking I/O directly in an `async def` endpoint blocks the event loop — a common misunderstanding of async FastAPI patterns.

**How to avoid:**
- Enforce a file size limit at the FastAPI layer: reject files > 10MB with HTTP 413, returning a clear error message ("File too large. Max size: 10MB for this demo.").
- Run pandas processing in a thread pool: `await asyncio.get_event_loop().run_in_executor(None, process_csv, file_bytes)`.
- Validate file content-type using magic bytes (not just the `Content-Type` header, which is client-controlled).
- Show file size validation on the frontend before upload to avoid a round-trip for obviously oversized files.

**Warning signs:**
- Health endpoint times out during a large file upload.
- Memory usage on Render dashboard spikes and the service restarts.
- Browser hangs for 30+ seconds when uploading a file over 50MB.

**Phase to address:** Phase 2 (upload endpoint) — size limit and executor pattern must be in the first implementation of `POST /api/upload`, not added later.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode `allow_origins=["*"]` in CORSMiddleware | No CORS errors during dev | Breaks with `credentials`, security hole in production | Never — use env var from day one |
| Skip `resetStore()` on new upload | Fewer lines of code | Corrupted state across sequential uploads, hard-to-debug crashes | Never |
| Use `pd.read_csv()` directly in `async def` without executor | Simpler code | Blocks FastAPI event loop, degrades all concurrent requests | MVP only if single-user, must fix before demo |
| No file size limit | Works for any file | OOM crash on Render free tier, unusable for real users | Never — 10MB limit costs one line of code |
| No server-side scatter point sampling | Full data fidelity | Browser crash at > 10,000 rows, makes demo unreliable | Never for public demo |
| Inline chart config objects in JSX | Fast to write | Creates new object references every render, defeats `React.memo` | Never — extract to constants or `useMemo` |
| `any` type for API response | Faster to prototype | Loses TypeScript coverage for entire data pipeline | Never per project rules |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Recharts + react-window | Trying to virtualize a Recharts chart (it doesn't support it) | Virtualize the data table with react-window; let Recharts render the full (sampled) chart dataset |
| FastAPI `UploadFile` + pandas | `await file.read()` loads entire file into memory before pandas touches it | Stream to temp file with `aiofiles`, then pass file path to pandas |
| Vercel SPA routing + React Router | `vercel.json` with no rewrite rules causes 404 on direct URL access to any non-root route | Add `vercel.json` rewrites: `{"rewrites": [{"source": "/(.*)", "destination": "/"}]}` |
| axios + Render cold start | Default axios timeout (no timeout set) means the request hangs for 60+ seconds with no feedback | Set `timeout: 30000` on axios instance; show "warming up server" UI at 3 seconds |
| Zustand + React StrictMode | Double-invocation of effects in dev can cause double-upload submissions | Guard upload action with an `isUploading` boolean flag in the store |
| pandas + JSON column detection | Columns containing valid JSON strings are classified as `object` type, not detected as structured data | Intentional — JSON column parsing is out of scope for v1; document this limitation |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recharts re-renders on every parent state change | Chart flickers, CPU spikes during interactions | Wrap chart components in `React.memo`; extract data arrays with `useMemo` keyed on dataset ID | Any time a tooltip hover updates global state |
| react-window with variable row heights | Scroll position jumps, blank rows appear | Use `FixedSizeList` with a fixed row height (40px) for the preview table | When row content wraps to 2+ lines |
| Correlation matrix computed on frontend | UI freezes for 2–3 seconds on wide datasets (50+ columns) | Always compute Pearson correlation on the backend with numpy/scipy; return the precomputed matrix | Datasets with > 20 columns |
| Zustand store holds full parsed dataset (100k rows) | Memory grows across uploads, never freed | Store only the first 1,000 rows in the frontend for preview; keep full data in backend session or re-fetch on demand | Datasets > 10,000 rows |
| Tailwind's `purge` not configured | 3MB CSS bundle in production | Ensure `content` paths in `tailwind.config.ts` cover all component files | At production build time |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Accepting any file MIME type | User uploads `.exe`, `.php`, or a ZIP bomb disguised as a CSV | Validate magic bytes server-side; accept only `text/csv`, `application/json`, and UTF-8 text content types |
| No file size limit on backend | DoS via repeated large file uploads, OOM crash on free tier | Hard-limit at 10MB in FastAPI before pandas touches the file |
| Passing raw filenames to filesystem | Path traversal attack if you ever write the file to disk using the user-supplied filename | Generate a UUID filename server-side; never use `file.filename` for disk writes |
| CSV formula injection in exported reports | If you ever render CSV content back as HTML or allow re-download, cells starting with `=` execute as formulas in Excel | Prefix any cell value starting with `=`, `+`, `-`, `@` with a tab character before including in any export |
| Exposing full pandas traceback in API errors | Stack traces reveal file paths, pandas version, system info | Catch all exceptions in FastAPI and return a sanitized error: `{"error": "Failed to parse file"}` — log full traceback server-side only |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No progress feedback during upload + analysis | User sees a static spinner for 5–15 seconds; assumes the app is broken | Show distinct states: "Uploading...", "Parsing...", "Computing stats...", "Done" using backend status or time-based heuristics |
| Auto-rendering ALL columns in summary cards | A 50-column dataset generates 50 cards — unreadable, slow to render | Show first 10 columns; add a "Show all columns" expander |
| Chart type chosen for display value, not data type | Rendering a pie chart for a column with 200 unique values | Auto-select chart type strictly from column dtype: numeric→histogram, categorical (≤20 unique)→bar, date→timeseries, high-cardinality categorical→"too many categories" message |
| Correlation heatmap shown for datasets with 1–2 numeric columns | Empty or trivial heatmap confuses users | Only render correlation section if ≥ 3 numeric columns exist; otherwise show "Need at least 3 numeric columns for correlation analysis" |
| No empty state for missing values column | User sees a "Missing Values" card showing 0% for all columns and doesn't understand why it's there | Hide missing values section entirely if no nulls exist; if nulls exist, highlight them prominently |
| Error messages from the backend shown raw | "500 Internal Server Error" or pandas exception text shown to user | Map all backend errors to friendly messages: "We couldn't parse this file. Make sure it's a valid CSV with headers." |

---

## "Looks Done But Isn't" Checklist

- [ ] **File Upload:** Drag-and-drop works visually, but file size validation fires before the upload request — verify backend also rejects oversized files independently.
- [ ] **Column Type Detection:** All columns are classified, but check with a CSV containing mixed-type columns (e.g., a "zip_code" column with leading zeros like `"01234"`) — should be `object`, not truncated to `1234`.
- [ ] **Correlation Heatmap:** Renders for the happy-path dataset, but verify it handles: (a) dataset with 0 numeric columns, (b) dataset with 1 numeric column, (c) dataset where two columns are perfectly collinear (correlation = 1.0 or NaN).
- [ ] **IQR Outlier Detection:** Toggle works, but verify the filter actually removes points from the visualization — not just marks them in the stats card without updating the chart data.
- [ ] **react-window Preview Table:** Scrolls correctly for 50 rows, but verify scroll position is reset to row 0 when a new file is uploaded (stale scroll position on new dataset looks like a bug).
- [ ] **CORS:** Passes local dev, but verify via `curl -H "Origin: https://your-vercel-domain.vercel.app"` against the live Render backend before demo day.
- [ ] **State Reset:** Upload File A, explore, upload File B — assert that no data, column selections, or filter state from File A survives in the UI.
- [ ] **Render Cold Start:** Test the deployed demo after 20 minutes of inactivity — verify the warm-up UX appears and the app recovers gracefully.
- [ ] **TypeScript `any` prohibition:** Run `tsc --noEmit --strict` and verify zero `any` types in the data pipeline types (API response → Zustand store → chart props).

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Render cold start discovered post-demo | LOW | Add `/health` endpoint + frontend warm-up call; add UptimeRobot ping (30 min work) |
| Mixed-type columns crashing analysis | MEDIUM | Add `low_memory=False` + secondary type inference pass in backend; re-test with messy CSVs |
| Recharts scatter crash discovered at demo | HIGH | Requires adding server-side sampling endpoint + new API field + frontend label; 1 day of rework |
| CORS broken in production | LOW | Add `ALLOWED_ORIGINS` env var to Render + update FastAPI middleware; 15 min fix |
| Zustand stale state across uploads | MEDIUM | Add `resetStore()` action + call it in upload handler; audit all store slices for missing fields |
| Event loop blocking on large file | MEDIUM | Wrap pandas call in `run_in_executor` + add 10MB size check; 2 hours of rework |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Render cold start | Phase 1 (Skeleton + Deploy) | Hit `/health` endpoint after 20 min idle; warm-up UI visible |
| pandas mixed-type inference | Phase 2 (Upload + Analysis API) | Upload CSV with mixed-type columns; all columns correctly classified |
| Recharts scatter crash | Phase 3 (Visualization) | Upload 50k-row CSV; scatter plot renders in < 1s with sample label |
| CORS on deployment | Phase 1 (Skeleton + Deploy) | `curl` health check from Vercel origin returns CORS headers |
| Zustand stale state | Phase 2 (State Layer) | Sequential upload test in Vitest; no stale fields after second upload |
| Event loop blocking | Phase 2 (Upload + Analysis API) | `/health` responds during concurrent large file upload (< 200ms) |
| File size / security | Phase 2 (Upload + Analysis API) | Upload 20MB file; backend returns 413 before pandas runs |
| SVG memory leak in charts | Phase 3 (Visualization) | React DevTools profiler shows no retained chart nodes after unmount |

---

## Sources

- [FastAPI performance mistakes (DEV Community)](https://dev.to/igorbenav/fastapi-mistakes-that-kill-your-performance-2b8k)
- [Render free tier cold start behavior (community.render.com)](https://community.render.com/t/do-web-services-on-a-free-tier-go-to-sleep-after-some-time-inactive/3303)
- [Fix Render cold start (Medium)](https://medium.com/@sauravhldr/fix-render-com-free-tier-slow-initial-load-cold-start-problem-using-free-options-and-easy-steps-c0b6c7af8276)
- [pandas type inference internals (rushter.com)](https://rushter.com/blog/pandas-data-type-inference/)
- [pandas DtypeWarning official docs](https://pandas.pydata.org/docs/reference/api/pandas.errors.DtypeWarning.html)
- [Recharts slow with large data (GitHub issue #1146)](https://github.com/recharts/recharts/issues/1146)
- [Recharts LTTB downsampling request (GitHub issue #1356)](https://github.com/recharts/recharts/issues/1356)
- [FastAPI CORS official tutorial](https://fastapi.tiangolo.com/tutorial/cors/)
- [CORSMiddleware not working discussion (GitHub fastapi #7319)](https://github.com/fastapi/fastapi/discussions/7319)
- [Zustand how to reset state (official docs)](https://zustand.docs.pmnd.rs/guides/how-to-reset-state)
- [FastAPI async file uploads — handling large files (Medium)](https://medium.com/@connect.hashblock/async-file-uploads-in-fastapi-handling-gigabyte-scale-data-smoothly-aec421335680)
- [CSV injection — OWASP Foundation](https://owasp.org/www-community/attacks/CSV_Injection)
- [Secure FastAPI file upload patterns (blog.greeden.me)](https://blog.greeden.me/en/2026/03/03/implementing-secure-file-uploads-in-fastapi-practical-patterns-for-uploadfile-size-limits-virus-scanning-s3-compatible-storage-and-presigned-urls/)
- [react-window vs react-virtualized (dhiwise.com)](https://www.dhiwise.com/post/react-window-vs-react-virtualized-a-simple-guide)
- [Vercel SPA rewrite rules (Vercel KB)](https://vercel.com/kb/guide/how-to-enable-cors)

---
*Pitfalls research for: Browser-based EDA / Interactive Data Exploration (DataLens)*
*Researched: 2026-03-27*
