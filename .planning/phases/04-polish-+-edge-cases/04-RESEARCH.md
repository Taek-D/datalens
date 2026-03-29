# Phase 4: Polish + Edge Cases - Research

**Researched:** 2026-03-29
**Domain:** Integration testing (Vitest + RTL + MSW), TypeScript strict mode, edge-case UI states, Render cold-start UX
**Confidence:** HIGH

## Summary

Phase 4 closes the last open requirement (TEST-05) and hardens the application against adversarial inputs. The codebase after Phase 3 is fully functional: upload → analyze → chart rendering works end-to-end. Phase 4 adds the integration test suite that proves this, verifies graceful degradation on edge cases (0 numeric columns, 1 numeric column, all-null column), confirms sequential-upload state reset, enforces `tsc --strict` cleanliness, and validates the Render cold-start UX path.

The test infrastructure is already mature. Vitest + RTL + MSW v2 are all installed and wired. The MSW server setup (`src/test/setup.ts`) runs `beforeAll/afterEach/afterAll` lifecycle. The `handlers.ts` mock returns a 3-column dataset. The integration test (TEST-05) needs a **new test file** (`src/test/integration.test.tsx`) that mounts `<App>` via RTL, drives the full upload-to-chart flow with a realistic CSV fixture, and checks rendered output.

Edge-case states are partially handled: `CorrelationHeatmap` already renders an explanation message when `matrix.columns.length < 2`. `ColumnStatsTable` already renders "수치형 컬럼이 없습니다" when `summary` is empty. `OutlierPanel` renders "수치형 컬럼이 없습니다" when `outliers` is empty. The gaps are: (a) the MSW handler does not yet serve an edge-case fixture that triggers these paths, and (b) there is no test asserting these states render correctly.

**Primary recommendation:** Write one integration test file that covers all five success criteria. Use MSW handler overrides within the same file to test edge-case scenarios. Do not create separate test infrastructure — extend what already exists.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEST-05 | 업로드 → 분석 → 차트 렌더링 통합 테스트가 존재한다 | RTL `render(<App>)` + MSW mock drives full pipeline; confirmed pattern via existing hook tests |
</phase_requirements>

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | ^4.1.2 | Test runner | Already configured in vite.config.ts |
| @testing-library/react | ^16.3.2 | Component rendering + user events | Already used in hook tests |
| msw | ^2.12.14 | API mocking | Already wired in src/mocks/server.ts |
| @testing-library/jest-dom | ^6.9.1 | DOM matchers | Already in src/test/setup.ts |
| typescript | ~5.9.3 | `tsc --strict` type checking | Already configured in tsconfig.app.json |

### No new packages required

All test infrastructure is in place. Phase 4 is purely about writing tests and fixing any issues they reveal.

**Test commands (already work):**
```bash
# From frontend/
pnpm test                          # vitest run — full suite
npx vitest run src/test/integration.test.tsx   # single file
tsc --noEmit                       # type check (strict mode already on)
```

## Architecture Patterns

### Test File Structure

```
frontend/src/
├── test/
│   ├── setup.ts              # existing — MSW lifecycle
│   └── integration.test.tsx  # NEW — TEST-05 integration test
├── mocks/
│   ├── handlers.ts           # existing — default happy-path mocks
│   └── server.ts             # existing — setupServer(...)
```

### Pattern 1: Full App Integration Test with RTL

**What:** Mount `<App>` with `render()`, simulate a file drop/select, wait for analysis to complete, then assert DOM output.

**When to use:** For TEST-05 and all five success criteria.

**Key insight about the existing mock:** `handlers.ts` returns `mockUploadResponse` with 3 columns (`age: numeric`, `category: categorical`, `description: text`) and `mockAnalysisResponse` with a 2-column correlation matrix. This is the happy-path fixture. It already covers mixed-type columns. The integration test can use it as-is for the primary flow.

**Example — core integration pattern:**
```typescript
// Source: existing useUpload.test.ts + useAnalysis.test.ts patterns
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

it('upload → analyze → chart renders', async () => {
  render(<App />);
  const input = screen.getByRole('...', ...);
  await userEvent.upload(input, csvFile);
  await waitFor(() => screen.getByText('데이터 개요'));
  // assert charts visible
});
```

**Note:** `@testing-library/user-event` may need installing. Alternatively, fire events directly with RTL's `fireEvent`. Check whether `userEvent` is already available — if not, `fireEvent.change(input, { target: { files: [file] } })` is the fallback pattern already used in `useUpload.test.ts`.

Looking at `useUpload.test.ts` line 115–118, the existing tests use the raw event object pattern without `userEvent`. Follow the same pattern for consistency:
```typescript
fireEvent.change(fileInput, {
  target: { files: [csvFile] }
});
```

### Pattern 2: MSW Handler Override for Edge Cases

**What:** Use `server.use(http.post(...))` inside a test to override the default handler with an edge-case response.

**When to use:** Tests 2, 3 (edge-case UI states).

```typescript
// Source: existing analysisApi.test.ts line 18-27 pattern
server.use(
  http.post('http://localhost:8000/api/analyze', () =>
    HttpResponse.json(edgeCaseAnalysisResponse)
  )
);
```

MSW's `server.resetHandlers()` in `afterEach` (already in setup.ts) ensures overrides don't leak between tests.

### Pattern 3: Store Reset for Sequential Upload Test

**What:** For the "second upload starts from fully reset state" test, call `resetStore()` or simulate the "새 파일 업로드" button click, then upload again.

**The actual reset path:** In `App.tsx`, clicking the "새 파일 업로드" button calls `resetStore()` which sets all state back to `initialState` (lines 13–23 in `store/index.ts`). The integration test can click that button with RTL, then upload a second file and verify no stale data.

**Alternatively:** The store `useStore.getState().resetStore()` can be called directly between test steps without clicking the button — already used in `beforeEach` of existing tests.

### Pattern 4: TypeScript Strict Mode Audit

**What:** Run `tsc --noEmit` from `frontend/` and address all errors.

**Known strict rules already in tsconfig.app.json:**
- `strict: true` (includes `strictNullChecks`, `noImplicitAny`)
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `verbatimModuleSyntax: true` — requires `import type` for type-only imports
- `erasableSyntaxOnly: true`

**Known risk areas** based on code review:
- `CorrelationHeatmap.tsx` line 85: `cell.value as number` cast — verify this doesn't hide a null
- `useChartData.test.ts` line 13: `as unknown as ReturnType<typeof vi.fn>` — complex cast in test file
- `analysisApi.ts` line 88: `err.response?.data?.detail as string | undefined` — acceptable narrowing but worth verifying

### Pattern 5: Health Check / Cold-Start UX Test

**What:** The `serverStatus` state in `App.tsx` drives the "연결 중..." banner. The test needs to verify the banner appears when the health check is slow (> 2 seconds) and disappears on success.

**Current implementation (App.tsx lines 24–43):**
- Sets `serverStatus = 'warming'` after 2000ms timeout
- Sets `serverStatus = 'ready'` on successful `/health` response
- Shows amber banner when `serverStatus === 'warming'`

**MSW handler needed:** A `/health` GET handler must exist. Current `handlers.ts` only covers POST `/api/upload` and POST `/api/analyze`. The health check will be **unhandled** by MSW, causing `onUnhandledRequest: 'error'` to throw in the test environment.

**Critical finding:** `setup.ts` line 5 sets `onUnhandledRequest: 'error'`. This means any test that renders `<App>` will fail unless a `/health` GET handler is added to `handlers.ts`.

**Fix:** Add to `handlers.ts`:
```typescript
http.get('http://localhost:8000/health', () =>
  HttpResponse.json({ status: 'ok' })
)
```

### Anti-Patterns to Avoid

- **Snapshot testing for charts:** Chart libraries render SVG that changes with library updates. Use behavior assertions (`getByText`, `getByRole`) not `toMatchSnapshot()`.
- **Waiting with `setTimeout` in tests:** Use `waitFor()` from RTL instead of arbitrary sleeps.
- **Testing implementation details:** Assert what the user sees (text content, ARIA roles), not internal state directly — except where store state assertions are the only way (e.g., confirming reset).
- **Not resetting store between tests:** `beforeEach(() => useStore.getState().resetStore())` is required — already the pattern in existing tests.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Async waiting in tests | Manual `setTimeout` | `waitFor()` from RTL | RTL handles polling + timeout correctly |
| API mocking | `vi.mock('axios')` | MSW v2 handlers | Already set up; more realistic (intercepts actual HTTP) |
| Simulating file input | Custom drag simulation | `fireEvent.change(input, { target: { files: [...] } })` | Already used in useUpload.test.ts |
| Type checking | Custom type validators | `tsc --noEmit` | Already configured, zero configuration needed |

**Key insight:** The test infrastructure is production-ready. Phase 4 writes tests against existing infrastructure, not new infrastructure.

## Common Pitfalls

### Pitfall 1: Unhandled MSW Request for `/health`

**What goes wrong:** `render(<App>)` triggers `useEffect` that calls `apiClient.get('/health')`. MSW is set to `onUnhandledRequest: 'error'`. Without a `/health` handler, every integration test that renders `<App>` fails immediately.

**Why it happens:** `handlers.ts` only covers upload and analyze endpoints.

**How to avoid:** Add `http.get('http://localhost:8000/health', ...)` to `handlers.ts` before writing any App-level integration test.

**Warning signs:** Test error message like "Unhandled request: GET http://localhost:8000/health".

### Pitfall 2: `apiClient` Base URL Mismatch

**What goes wrong:** `client.ts` uses `import.meta.env.VITE_API_URL ?? 'http://localhost:8000'`. In the test environment `import.meta.env.VITE_API_URL` is undefined, so the base URL is `http://localhost:8000`. MSW handlers in `handlers.ts` already use `http://localhost:8000/...` — these match, so no issue.

**How to verify:** MSW handler URLs must exactly match `baseURL + path`. Current handlers use full URLs (`http://localhost:8000/api/upload`), not relative paths. This is correct.

### Pitfall 3: `@nivo/heatmap` and SVG Rendering in jsdom

**What goes wrong:** Nivo renders SVG via D3 measurement APIs that are not available in jsdom. Attempting to render `<CorrelationHeatmap>` in a unit test will throw errors about `getBoundingClientRect` or similar.

**Why it happens:** jsdom does not implement SVG layout.

**How to avoid:** For integration tests that render `<App>` → `<AnalysisView>` → `<CorrelationHeatmap>`, mock the heatmap component at the module level:
```typescript
vi.mock('../components/charts/CorrelationHeatmap', () => ({
  CorrelationHeatmap: () => <div data-testid="correlation-heatmap" />
}));
```
Alternatively, assert the text fallback that renders when `matrix.columns.length < 2` (this does not render the SVG).

**Warning signs:** Test errors mentioning `ResizeObserver`, `getBoundingClientRect`, or `@nivo` internals.

### Pitfall 4: `react-window` in jsdom

**What goes wrong:** `FixedSizeList` (used in `OutlierPanel` and `DataTable`) requires container dimensions which jsdom sets to 0. This causes `FixedSizeList` to render 0 items.

**How to avoid:** Mock `react-window` in tests that need to see list content:
```typescript
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemData }: MockProps) => (
    <div>{Array.from({ length: itemCount }, (_, i) => children({ index: i, style: {}, data: itemData }))}</div>
  )
}));
```
Or assert on headings/summary text that does not depend on the virtualized list rendering items.

**Warning signs:** OutlierPanel renders table header but no rows.

### Pitfall 5: Store State Leaking Between Tests

**What goes wrong:** Zustand store is a module-level singleton. Tests that modify store state contaminate subsequent tests.

**How to avoid:** `beforeEach(() => useStore.getState().resetStore())` — already the established pattern in `useUpload.test.ts` line 9 and `useAnalysis.test.ts` line 9. Follow the same pattern in the integration test.

### Pitfall 6: `verbatimModuleSyntax` + Implicit Type Imports

**What goes wrong:** TypeScript compiler throws `TS1484: '[identifier]' is a type and must be imported using a type-only import` when type imports are not prefixed with `import type`.

**Why it happens:** `verbatimModuleSyntax: true` in `tsconfig.app.json`. Already known from Phase 2 decisions.

**How to avoid:** Always use `import type { Foo }` for type-only imports in any new files written during Phase 4.

## Code Examples

Verified patterns from existing codebase:

### Edge-Case: 0 Numeric Columns (ColumnStatsTable already handles)
```typescript
// Source: frontend/src/components/analysis/ColumnStatsTable.tsx line 36-43
if (!summary || Object.keys(summary).length === 0) {
  return (
    <p className="text-sm text-gray-500">수치형 컬럼이 없습니다.</p>
  );
}
```
The MSW mock needs to return `summary: {}` (empty object) and `correlation: { columns: [], values: [] }` to trigger these paths.

### Edge-Case: < 2 Numeric Columns (CorrelationHeatmap already handles)
```typescript
// Source: frontend/src/components/charts/CorrelationHeatmap.tsx line 54-59
if (matrix.columns.length < 2) {
  return (
    <div ...>
      상관관계 분석에는 2개 이상의 수치형 컬럼이 필요합니다.
    </div>
  );
}
```

### Edge-Case: All-Null Column (stats_service.py already handles)
```python
# Source: backend/app/services/stats_service.py line 31-33
if len(series) == 0:  # all values null → dropna() gives empty series
    result[col] = SummaryStats()  # all fields default to None
```
`SummaryStats()` with all `None` fields → frontend `ColumnStatsTable` renders `-` for each via `fmt()` function. This is already correctly handled.

### State Reset Pattern
```typescript
// Source: frontend/src/store/index.ts line 29
resetStore: () => args[0](initialState),

// Usage in tests (from useUpload.test.ts line 9-11)
beforeEach(() => {
  useStore.getState().resetStore();
});
```

### MSW Override Pattern
```typescript
// Source: frontend/src/api/analysisApi.test.ts line 18-26
server.use(
  http.post('http://localhost:8000/api/upload', () =>
    new HttpResponse(null, { status: 413 })
  )
);
```

### tsc Type Check Command
```bash
# From frontend/ directory — checks against tsconfig.app.json (strict: true)
npx tsc --noEmit
# or via build script:
npm run build  # runs `tsc -b && vite build`
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `msw` v1 (`rest.get`) | `msw` v2 (`http.get`, `HttpResponse`) | 2023 | Installed v2.12.14 — use `http.*` not `rest.*` |
| `@testing-library/user-event` v13 | fireEvent pattern | — | Project uses direct `fireEvent` (no userEvent installed) — follow same |
| Global `asyncio_mode` via decorator | `asyncio_mode = auto` in pytest.ini | pytest-asyncio 0.21 | Already configured correctly |

**Deprecated/outdated:**
- `rest.get/post` from MSW v1: replaced by `http.get/post` — project already uses v2 correctly.
- `asyncio_mode` per-test decorator: replaced by `asyncio_mode = auto` in `pytest.ini` — already configured.

## Open Questions

1. **`@testing-library/user-event` availability**
   - What we know: `package.json` does not list `@testing-library/user-event` as a dependency
   - What's unclear: Whether to install it or use the existing `fireEvent` pattern
   - Recommendation: Use `fireEvent` — it's the established pattern in this codebase (see `useUpload.test.ts`), avoids a new dependency, and is sufficient for file input simulation

2. **Nivo SVG rendering in jsdom**
   - What we know: `@nivo/heatmap` uses D3 for layout calculations that jsdom does not support
   - What's unclear: Whether the integration test will hit this or skip the heatmap section
   - Recommendation: Mock `CorrelationHeatmap` at module level in the integration test, OR scope the test to assertions that don't require the heatmap SVG to render (e.g., assert the section heading exists, not the SVG cells)

3. **Render cold-start 5-second test**
   - What we know: Success criterion 5 is about the deployed Render backend — not a unit test
   - What's unclear: Whether this is a manual verification or an automated test
   - Recommendation: This is a manual deployment verification step, not an automated test. The automated test coverage is the `App.tsx` warm-up banner logic (that the banner appears when `/health` is slow and disappears on success). Use fake timers (`vi.useFakeTimers()`) to simulate the 2000ms delay.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 + React Testing Library 16.3.2 |
| Config file | `frontend/vite.config.ts` (test section) |
| Quick run command | `cd frontend && pnpm test` |
| Full suite command | `cd frontend && pnpm test` (same — no watch mode in CI) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-05 | upload → analyze → chart render pipeline | integration | `cd frontend && npx vitest run src/test/integration.test.tsx` | ❌ Wave 0 |
| TEST-05 | 0 numeric columns → empty-state message (not blank heatmap) | integration | same file | ❌ Wave 0 |
| TEST-05 | 1 numeric column → heatmap disabled with explanation | integration | same file | ❌ Wave 0 |
| TEST-05 | all-null column → "-" in stats (not crash) | integration | same file | ❌ Wave 0 |
| TEST-05 | second upload starts from fully reset state | integration | same file | ❌ Wave 0 |
| TEST-05 | `tsc --noEmit` zero errors | static analysis | `cd frontend && npx tsc --noEmit` | ❌ verify |
| TEST-05 | `/health` cold-start banner appears | integration | same file | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd frontend && pnpm test`
- **Per wave merge:** `cd frontend && pnpm test && npx tsc --noEmit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/test/integration.test.tsx` — covers all TEST-05 sub-cases
- [ ] `frontend/src/mocks/handlers.ts` — add `/health` GET handler (critical — unhandled request error)
- [ ] Edge-case MSW fixtures in `handlers.ts` or inline in integration test — 0-numeric, 1-numeric, all-null column scenarios

*(No new framework install needed — all dependencies present)*

## Sources

### Primary (HIGH confidence)
- Direct codebase read — `frontend/src/test/setup.ts`, `frontend/src/mocks/handlers.ts`, `frontend/src/mocks/server.ts`
- Direct codebase read — `frontend/src/api/analysisApi.test.ts`, `frontend/src/hooks/useUpload.test.ts`, `frontend/src/hooks/useAnalysis.test.ts`
- Direct codebase read — `frontend/vite.config.ts` (Vitest config), `frontend/tsconfig.app.json` (strict rules)
- Direct codebase read — `frontend/src/App.tsx` (health check logic, state machine, reset button)
- Direct codebase read — `frontend/src/store/index.ts`, `frontend/src/store/uiSlice.ts` (resetStore, status transitions)
- Direct codebase read — `frontend/src/components/charts/CorrelationHeatmap.tsx` (< 2 columns guard)
- Direct codebase read — `frontend/src/components/analysis/ColumnStatsTable.tsx` (empty summary guard)
- Direct codebase read — `frontend/src/components/analysis/OutlierPanel.tsx` (empty outliers guard)
- Direct codebase read — `backend/app/services/stats_service.py` (all-null column handling)
- Direct codebase read — `backend/app/services/correlation_service.py` (< 2 numeric columns handling)
- Direct codebase read — `frontend/package.json` (exact library versions)

### Secondary (MEDIUM confidence)
- Known jsdom limitations with SVG/D3 (Nivo heatmap) — well-documented community pattern

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, versions confirmed from package.json
- Architecture: HIGH — test patterns directly observable from existing test files
- Pitfalls: HIGH — `onUnhandledRequest: 'error'` + `/health` gap is deterministic; jsdom/SVG limitation is well-known

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable stack — Vitest, MSW, RTL versions pinned)
