# Phase 1: Skeleton + Deploy - Research

**Researched:** 2026-03-27
**Domain:** Monorepo scaffold — Vite + React 18 + FastAPI + GitHub Actions CI + Vercel + Render deployment + data contracts
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Top-level `frontend/` and `backend/` directories — not a workspace monorepo (no pnpm workspaces)
- `frontend/`: Vite + React 18 + TypeScript project (pnpm as package manager)
- `backend/`: FastAPI project with `requirements.txt` (no Poetry/pipenv)
- Shared types are manually kept in sync between `frontend/src/types/` and `backend/schemas/`
- Node >= 20.19 (required by Vite 8)
- Python >= 3.11 (required by pandas 3.0.1)
- Tailwind CSS v4 with `@tailwindcss/vite` plugin — no PostCSS config, no `tailwind.config.js`
- CSS entry: `@import "tailwindcss"` in main CSS file
- Store allowed origins in `ALLOWED_ORIGINS` environment variable
- Never hardcode `localhost` or use `allow_origins=["*"]` with `allow_credentials=True`
- Development: `http://localhost:5173` (Vite default)
- Production: Vercel deployment URL
- `GET /health` endpoint on FastAPI from day one
- Frontend calls `/health` on app mount before any user action
- If response takes > 2 seconds, show "분석 서버에 연결 중..." UI indicator
- Recovery is automatic — indicator disappears when health check succeeds
- Single GitHub Actions workflow with two jobs: `test-frontend` and `test-backend`
- Frontend job: pnpm install → lint → test → build
- Backend job: pip install → pytest → (optional lint)
- Trigger: pull_request to `main`
- Vercel: auto-deploy from `main` branch, root directory set to `frontend/`
- Render: free tier web service, root directory `backend/`, start command `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables configured per service (CORS origins, API URL)
- TypeScript interfaces in `frontend/src/types/dataset.ts` and `frontend/src/types/analysis.ts`
- Pydantic v2 schemas in `backend/schemas/upload.py` and `backend/schemas/analysis.py`
- Shapes must match exactly: `ColumnMeta`, `UploadResponse`, `AnalysisResultResponse`
- Contract includes: `ColumnType` enum (`numeric` | `categorical` | `datetime` | `text`)

### Claude's Discretion
- Exact Tailwind v4 `@theme` token definitions (colors, spacing)
- ESLint/Prettier configuration specifics
- Backend directory structure beyond `schemas/` and `services/`
- README content for initial scaffold

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Vite + React 18 + TypeScript 모노레포 프로젝트 구조 (frontend/ + backend/) | Vite 8 `create vite` template, pnpm as package manager, directory structure patterns |
| INFRA-02 | FastAPI 백엔드 프로젝트 구조 (Pydantic 스키마 + 서비스 레이어) | FastAPI main.py layout, router registration, service layer pattern |
| INFRA-03 | TypeScript 인터페이스와 Pydantic 스키마 간 데이터 계약 정의 | Pydantic v2 BaseModel with str enum, TypeScript interface mirror patterns |
| INFRA-04 | CORS 환경변수 기반 설정 (배포 환경별 origin 관리) | CORSMiddleware with ALLOWED_ORIGINS env var, verified against FastAPI official docs |
| INFRA-05 | /health 엔드포인트 + 프론트엔드 워밍업 호출 (Render 콜드스타트 대응) | Render cold start behavior, health endpoint pattern, useEffect warm-up call |
| INFRA-06 | GitHub Actions CI (PR마다 FE 테스트 + BE 테스트 + 빌드) | pnpm/action-setup@v4 + actions/setup-node@v4, dual-language job structure |
| INFRA-07 | Vercel (FE) + Render (BE) 배포 파이프라인 | Vercel root directory setting + vercel.json SPA rewrite, Render FastAPI deploy docs |
</phase_requirements>

---

## Summary

Phase 1 is a pure infrastructure scaffold — no feature code. The goal is a monorepo where `pnpm dev` starts Vite on port 5173 and `uvicorn main:app --reload` starts FastAPI on port 8000, with the frontend proxying `/api` calls to the backend in development. Both services deploy live to Vercel and Render, GitHub Actions CI passes on every PR, and the data contract (TypeScript interfaces + Pydantic v2 schemas) is established so Phase 2 can build on typed foundations.

All seven requirements in this phase are well-documented infrastructure patterns. The project-level research (STACK.md, ARCHITECTURE.md, PITFALLS.md) already covers all major concerns in depth. Phase 1 research focuses on the specific configuration artifacts that will be written: Tailwind v4 exact setup, Vite proxy config, CORS middleware pattern, GitHub Actions pnpm + Python dual-job YAML, Vercel `vercel.json` SPA rewrite, Render start command, and Pydantic v2 schema syntax for the data contract.

The two critical pitfalls that must be addressed in this phase are CORS breakage on deployment (configure `ALLOWED_ORIGINS` from day one) and Render cold start (implement `/health` endpoint + frontend warm-up call before any feature work). Both are locked decisions already confirmed in CONTEXT.md.

**Primary recommendation:** Build in this order — directory scaffold → package installs → data contract types → FastAPI `main.py` with health + CORS → `vite.config.ts` with proxy → CI YAML → deploy configuration. Writing types/schemas first ensures every subsequent artifact can be typed correctly from the start.

---

## Standard Stack

### Core (Phase 1 relevant)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | 8.0.3 | Frontend build tool + dev server | Native ESM, sub-second HMR, pnpm-compatible, requires Node >=20.19 |
| React | 18.3.x | UI framework | Concurrent features; v19 peer dep risk with Recharts/RTL avoided |
| TypeScript | 5.x | Type safety | Eliminates `any` bugs at data pipeline boundary; required by project rules |
| FastAPI | 0.135.2 | Python API backend | Async ASGI, native Pydantic v2, CORSMiddleware built-in |
| uvicorn | 0.42.0 | ASGI server | Standard FastAPI runner; Render uses `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Tailwind CSS | 4.2.2 | Utility styling | CSS-first `@theme`, Vite plugin replaces PostCSS, up to 5x faster builds |
| @tailwindcss/vite | 4.x | Tailwind v4 Vite integration | Replaces PostCSS plugin; single-line setup in `vite.config.ts` |
| pnpm | latest | Package manager | Project requirement; lockfile must be committed for CI caching |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| python-multipart | 0.0.22 | Multipart form parsing | Required by FastAPI for `UploadFile` — without it, POST /api/upload raises 422 |
| ESLint | 9.x | Frontend linting | CI `test-frontend` job runs lint step |
| pytest | 9.0.2 | Backend test runner | CI `test-backend` job runs `pytest` |

**Installation:**
```bash
# Frontend (in frontend/)
pnpm create vite@latest . -- --template react-ts
pnpm add tailwindcss@4 @tailwindcss/vite@4

# Backend (in backend/)
python -m venv .venv
pip install fastapi==0.135.2 uvicorn[standard]==0.42.0 python-multipart==0.0.22
pip install pytest==9.0.2
```

---

## Architecture Patterns

### Recommended Project Structure

```
datalens/                          # repo root
├── .github/
│   └── workflows/
│       └── ci.yml                 # single workflow, two jobs
├── frontend/                      # Vite + React 18 + TypeScript
│   ├── src/
│   │   ├── types/
│   │   │   ├── dataset.ts         # ColumnType, ColumnMeta, UploadResponse
│   │   │   └── analysis.ts        # AnalysisResultResponse (stub in Phase 1)
│   │   ├── api/
│   │   │   └── client.ts          # axios instance with baseURL from VITE_API_URL
│   │   ├── App.tsx                # calls /health on mount
│   │   └── main.tsx
│   ├── public/
│   ├── vercel.json                # SPA rewrite rules
│   ├── vite.config.ts             # proxy + tailwind plugin
│   ├── .env                       # VITE_API_URL=http://localhost:8000 (dev)
│   ├── .env.production            # VITE_API_URL=https://your-app.onrender.com
│   └── package.json
│
└── backend/                       # FastAPI + Python
    ├── app/
    │   ├── main.py                # FastAPI app, CORS, router registration
    │   ├── api/
    │   │   └── health.py          # GET /health router
    │   ├── schemas/
    │   │   ├── upload.py          # Pydantic: ColumnType, ColumnMeta, UploadResponse
    │   │   └── analysis.py        # Pydantic: AnalysisResultResponse (stub)
    │   └── core/
    │       └── config.py          # ALLOWED_ORIGINS env var
    ├── tests/
    │   └── test_health.py         # pytest: GET /health returns 200
    └── requirements.txt
```

### Pattern 1: Tailwind CSS v4 Vite Setup (CSS-First)

**What:** Tailwind v4 uses a Vite plugin instead of PostCSS. No `tailwind.config.js`. All config is in CSS via `@theme` directive.

**When to use:** Always for greenfield Vite projects in 2026.

**vite.config.ts:**
```typescript
// Source: https://tailwindcss.com/docs/installation/using-vite
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Do NOT rewrite — FastAPI routes are already /api/upload, /api/analyze
      },
    },
  },
})
```

**src/index.css (or src/styles/global.css):**
```css
/* Source: https://tailwindcss.com/docs/installation/using-vite */
@import "tailwindcss";

@theme {
  /* Custom design tokens — Claude's discretion per CONTEXT.md */
  --color-primary: oklch(0.62 0.2 260);
  --color-surface: oklch(0.98 0 0);
  --font-sans: Inter, system-ui, sans-serif;
}
```

**Key constraints verified:**
- No `tailwind.config.js` — CSS `@theme` block only
- No `@tailwind base/components/utilities` directives — replaced by `@import "tailwindcss"`
- `@theme` variables must be top-level (not nested)
- Namespace convention: `--color-*` generates `bg-*`, `text-*`; `--font-*` generates `font-*`

### Pattern 2: FastAPI main.py with CORS + Health

**What:** Minimal FastAPI app with CORSMiddleware configured from environment variable and a `/health` endpoint.

**Source:** https://fastapi.tiangolo.com/tutorial/cors/

```python
# backend/app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="DataLens API")

# CORS — configured via env var, never hardcoded
allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173"   # dev default only
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,   # No auth in v1 — keep False to allow flexibility
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}
```

**Critical constraint:** Do NOT use `allow_origins=["*"]` with `allow_credentials=True` — browsers reject this combination by spec (verified against FastAPI official docs).

### Pattern 3: Pydantic v2 Data Contract Schemas

**What:** Pydantic v2 schemas that mirror TypeScript interfaces exactly. The `ColumnType` enum is the shared vocabulary between FE and BE.

```python
# backend/schemas/upload.py
from enum import Enum
from pydantic import BaseModel

class ColumnType(str, Enum):
    numeric = "numeric"
    categorical = "categorical"
    datetime = "datetime"
    text = "text"

class ColumnMeta(BaseModel):
    name: str
    type: ColumnType
    nullable: bool
    unique_count: int

class UploadResponse(BaseModel):
    columns: list[ColumnMeta]
    preview: list[dict]       # first 50 rows, raw values
    row_count: int
```

**Matching TypeScript interface:**
```typescript
// frontend/src/types/dataset.ts
export type ColumnType = 'numeric' | 'categorical' | 'datetime' | 'text';

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  nullable: boolean;
  unique_count: number;
}

export interface UploadResponse {
  columns: ColumnMeta[];
  preview: Record<string, unknown>[];
  row_count: number;
}
```

**Contract rules:**
- `ColumnType` values must match exactly (same strings)
- `snake_case` in Python maps to `snake_case` in TypeScript (no camelCase transform in v1)
- `list[dict]` in Pydantic → `Record<string, unknown>[]` in TypeScript (typed further in Phase 2)

### Pattern 4: Vite Proxy (Development)

**What:** Vite's `server.proxy` forwards `/api` requests to the FastAPI backend in development, eliminating CORS issues during local development entirely.

**Source:** https://vite.dev/config/server-options#server-proxy

```typescript
// In vite.config.ts server.proxy section:
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      // Do NOT add rewrite — FastAPI routes already include /api prefix
    },
  },
},
```

**Environment variable strategy:**
- `frontend/.env` → `VITE_API_URL=http://localhost:8000` (used directly in production axios baseURL)
- `frontend/.env.production` → `VITE_API_URL=https://your-app.onrender.com`
- In development, proxy intercepts — `VITE_API_URL` is effectively ignored
- In production (Vercel), axios uses `VITE_API_URL` directly (no proxy)

```typescript
// frontend/src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  timeout: 30000,   // Render cold start can take 30–60s
});
```

### Pattern 5: GitHub Actions Dual-Language CI

**What:** Single workflow file with two independent jobs — `test-frontend` (pnpm) and `test-backend` (pip/pytest). Both must pass for the PR check to go green.

**Source:** pnpm/action-setup@v4 + actions/setup-node@v4 official docs

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml

      - run: pnpm install --frozen-lockfile

      - run: pnpm run lint

      - run: pnpm run test --run    # Vitest non-interactive mode

      - run: pnpm run build

  test-backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: backend/requirements.txt

      - run: pip install -r requirements.txt

      - run: pytest
```

**Key details:**
- `pnpm/action-setup@v4` must come BEFORE `actions/setup-node@v4` for cache to work
- `cache-dependency-path` must point to `frontend/pnpm-lock.yaml` (not root) since monorepo
- `--frozen-lockfile` on CI prevents accidental lockfile mutation
- `pnpm run test --run` passes `--run` flag to Vitest for non-watch (one-shot) execution
- Python cache uses `pip` and `cache-dependency-path: backend/requirements.txt`

### Pattern 6: Vercel Deployment (SPA + Root Directory)

**What:** Vercel serves the Vite SPA from `frontend/` subdirectory. Needs `vercel.json` for React Router deep-link support.

**Source:** https://vercel.com/docs/frameworks/frontend/vite (official docs, verified 2026-03-27)

```json
// frontend/vercel.json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Vercel project settings (configured via dashboard, not code):**
- Root Directory: `frontend`
- Framework Preset: Vite (auto-detected)
- Build Command: `pnpm run build` (auto-detected)
- Output Directory: `dist` (auto-detected)
- Environment Variables: `VITE_API_URL` = `https://your-app.onrender.com`

**Note:** `vercel.json` goes inside `frontend/` (the project root as seen by Vercel), not the repo root.

### Pattern 7: Render Deployment (FastAPI)

**What:** Render free-tier web service running FastAPI via uvicorn. Render injects `$PORT` automatically.

**Source:** https://render.com/docs/deploy-fastapi (official, verified 2026-03-27)

**Render web service settings:**
- Root Directory: `backend`
- Runtime: Python 3.11
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment Variables:
  - `ALLOWED_ORIGINS` = `https://your-app.vercel.app`
  - `PYTHON_VERSION` = `3.11.0` (optional, pin for reproducibility)

**Note:** `main:app` means `app` variable in `backend/main.py`. If FastAPI app is in `backend/app/main.py`, the start command becomes `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

### Pattern 8: Frontend Health Check Warm-up

**What:** `useEffect` in `App.tsx` calls `/health` on mount to wake the Render backend before the user does anything.

```typescript
// frontend/src/App.tsx
import { useEffect, useState } from 'react';
import { apiClient } from './api/client';

type ServerStatus = 'idle' | 'warming' | 'ready' | 'error';

function App() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>('idle');

  useEffect(() => {
    let warmupTimer: ReturnType<typeof setTimeout>;

    const checkHealth = async () => {
      // Show "connecting" indicator if health takes > 2s
      warmupTimer = setTimeout(() => {
        setServerStatus('warming');
      }, 2000);

      try {
        await apiClient.get('/health');
        clearTimeout(warmupTimer);
        setServerStatus('ready');
      } catch {
        clearTimeout(warmupTimer);
        setServerStatus('error');
      }
    };

    checkHealth();
    return () => clearTimeout(warmupTimer);
  }, []);

  return (
    <>
      {serverStatus === 'warming' && (
        <div className="fixed top-0 inset-x-0 bg-amber-50 text-amber-800 text-sm text-center py-2">
          분석 서버에 연결 중... (최대 60초 소요될 수 있습니다)
        </div>
      )}
      {/* rest of app */}
    </>
  );
}
```

### Anti-Patterns to Avoid

- **Hardcoding CORS origins:** Never write `allow_origins=["http://localhost:5173"]` in committed code — the Vercel URL is not known at dev time and this causes silent production breakage.
- **Using `allow_origins=["*"]` with `allow_credentials=True`:** Browsers reject this by spec; FastAPI will start but all credentialed requests will fail in the browser.
- **Skipping `vercel.json` rewrites:** Without it, any direct URL access to a non-root route (e.g., `/upload`) returns Vercel's 404, not the React app.
- **`uvicorn main:app` without `--host 0.0.0.0`:** Render routes external traffic to the container; binding only to `127.0.0.1` (default) means all requests time out.
- **No `--frozen-lockfile` in CI:** Allows pnpm to silently update lockfile during CI, making builds non-reproducible.
- **Using `pnpm run test` without `--run` in CI:** Vitest defaults to watch mode; the CI job hangs indefinitely.
- **Placing `vercel.json` at repo root:** When Vercel's root directory is set to `frontend/`, it looks for `vercel.json` inside `frontend/`, not the repo root.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CORS preflight handling | Custom middleware | FastAPI `CORSMiddleware` | Handles OPTIONS, `Access-Control-*` headers, credentials correctly |
| Proxy in dev | nginx or custom proxy server | `vite.config.ts` `server.proxy` | Zero config, dev-only, no separate process needed |
| CI caching | Custom cache steps | `pnpm/action-setup@v4` + `actions/setup-node@v4` cache | Built-in pnpm store caching via lockfile hash |
| SPA routing on Vercel | Server-side routing logic | `vercel.json` rewrites | One JSON file, officially supported pattern |
| Port binding on Render | Reading PORT manually | `--port $PORT` in start command | Render injects PORT automatically |

**Key insight:** All infrastructure in Phase 1 has a single canonical solution supported by official documentation. Hand-rolling any of these introduces subtle bugs (CORS, routing, caching) that are hard to debug in deployed environments.

---

## Common Pitfalls

### Pitfall 1: CORS Silently Breaks on Deployment

**What goes wrong:** Local dev works (Vite proxy eliminates CORS), but after deploying to Render, the Vercel origin is not in `allow_origins` — all browser requests fail with CORS error.

**Why it happens:** `ALLOWED_ORIGINS` env var is not set on Render, so it falls back to `http://localhost:5173` only.

**How to avoid:** Set `ALLOWED_ORIGINS` in Render dashboard as part of the deployment step. Verify with:
```bash
curl -I -H "Origin: https://your-app.vercel.app" https://your-api.onrender.com/health
# Must see: Access-Control-Allow-Origin: https://your-app.vercel.app
```

**Warning signs:** All API calls succeed locally but fail with `blocked by CORS policy` in the browser console after deploy.

### Pitfall 2: Render Cold Start Kills First Impression

**What goes wrong:** Render free tier sleeps after 15 minutes of inactivity. First request takes 30–60 seconds. Without the warm-up call, the user's first file upload attempt hangs.

**Why it happens:** The health check warm-up must be implemented in Phase 1 — adding it later requires revisiting `App.tsx` after feature code is already there.

**How to avoid:** Implement the `useEffect` health warm-up in `App.tsx` as part of Phase 1 scaffold (see Pattern 8 above).

**Warning signs:** Local demo is fast, but deployed demo freezes on first interaction.

### Pitfall 3: Vite Test Hangs in CI

**What goes wrong:** `pnpm run test` in GitHub Actions hangs indefinitely because Vitest starts in watch mode.

**How to avoid:** Use `pnpm run test --run` or configure `package.json` `"test": "vitest run"` (not `"vitest"`).

### Pitfall 4: pnpm/action-setup Order in CI

**What goes wrong:** Cache misses on every CI run if `actions/setup-node@v4` runs before `pnpm/action-setup@v4`.

**How to avoid:** Always put `pnpm/action-setup@v4` BEFORE `actions/setup-node@v4`. The node action reads the pnpm store path set by the pnpm action.

### Pitfall 5: Backend Module Path Mismatch

**What goes wrong:** `uvicorn main:app` fails on Render if the FastAPI app is in `backend/app/main.py` instead of `backend/main.py`.

**How to avoid:** Decide the module path before starting. If using `backend/app/main.py`, start command is `uvicorn app.main:app --host 0.0.0.0 --port $PORT` with Render root directory set to `backend`.

### Pitfall 6: TypeScript `any` in Data Contract Types

**What goes wrong:** Using `any` for the `preview` field (first 50 rows) passes TypeScript but breaks the project rule against `any` types.

**How to avoid:** Use `Record<string, unknown>[]` for `preview` rows in Phase 1. Phase 2 will refine individual cell types as part of the upload service.

---

## Code Examples

Verified patterns from official sources:

### Pydantic v2 Schema with Enum (Phase 1 stub)

```python
# backend/schemas/analysis.py — Phase 1 stub (full schema in Phase 2)
from pydantic import BaseModel

class AnalysisResultResponse(BaseModel):
    """Placeholder schema — full definition in Phase 2."""
    status: str = "pending"
```

### FastAPI Health Endpoint

```python
# backend/app/api/health.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "ok"}

# In main.py:
# app.include_router(router)
```

### axios Client with Timeout

```typescript
// frontend/src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  timeout: 30000,
});
```

### requirements.txt (Phase 1 minimal)

```
fastapi==0.135.2
uvicorn[standard]==0.42.0
python-multipart==0.0.22
pytest==9.0.2
httpx==0.28.1
```

### Vitest Config (Phase 1 minimal)

```typescript
// frontend/vite.config.ts — test section
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

```typescript
// frontend/src/test/setup.ts
import '@testing-library/jest-dom';
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PostCSS + `tailwind.config.js` | `@tailwindcss/vite` plugin + `@import "tailwindcss"` | Tailwind v4 (2025) | No config file, CSS-first `@theme`, 5x faster builds |
| `rest.*` handlers in MSW | `http.*` handlers in MSW v2 | MSW v2 (2023) | Old API causes runtime warnings |
| `actions/setup-node` with npm cache | `pnpm/action-setup@v4` + `actions/setup-node@v4` with pnpm cache | 2021+ | Proper pnpm store caching |
| `routes` in `vercel.json` | `rewrites` in `vercel.json` | Vercel platform update | `routes` is legacy; `rewrites` is current |
| Pydantic v1 `Config` class | Pydantic v2 `model_config = ConfigDict(...)` | Pydantic v2 (2023) | FastAPI 0.100+ removed v1 compat shim |

**Deprecated/outdated:**
- `@tailwind base/components/utilities` directives: replaced by `@import "tailwindcss"` in v4
- `tailwind.config.js` for new projects: CSS `@theme` block only in v4
- `rest.*` MSW handlers: use `http.*` in MSW v2
- `Pydantic` v1 syntax in FastAPI: FastAPI 0.100+ requires Pydantic v2

---

## Open Questions

1. **Exact Vercel project URL before deployment**
   - What we know: Vercel URL format is `https://[project-name]-[hash].vercel.app` or custom domain
   - What's unclear: URL is not known until first deploy — chicken-and-egg with `ALLOWED_ORIGINS` on Render
   - Recommendation: Deploy Vercel first (no CORS needed for static SPA), get URL, then set `ALLOWED_ORIGINS` on Render and redeploy. Health check will work after Render env var is set.

2. **Backend module path: `backend/main.py` vs `backend/app/main.py`**
   - What we know: CONTEXT.md says root directory `backend/` with start command `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - What's clear: Start command `uvicorn main:app` implies `backend/main.py` must exist (or `backend/app/main.py` with `uvicorn app.main:app`)
   - Recommendation: Use `backend/app/main.py` (matches ARCHITECTURE.md structure), update Render start command to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Tailwind v4 `@theme` color format — hex vs oklch**
   - What we know: Official Tailwind v4 docs use `oklch()` format; hex works too but oklch gives better color manipulation
   - What's unclear: Claude's discretion for exact token values (CONTEXT.md)
   - Recommendation: Use oklch for new tokens (consistent with Tailwind defaults), provide hex fallbacks in comments

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework (Frontend) | Vitest 4.1.2 + @testing-library/react 16.3.2 |
| Framework (Backend) | pytest 9.0.2 + httpx 0.28.1 |
| Config file (FE) | `frontend/vite.config.ts` (test section) |
| Config file (BE) | `backend/pytest.ini` or `backend/pyproject.toml` (Wave 0 gap) |
| Quick run (FE) | `cd frontend && pnpm run test --run` |
| Quick run (BE) | `cd backend && pytest` |
| Full suite | Both jobs in `ci.yml` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | `pnpm dev` starts Vite on 5173, `pnpm run build` succeeds | build smoke | `cd frontend && pnpm run build` | ❌ Wave 0 |
| INFRA-02 | FastAPI starts, registers routers correctly | smoke | `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8001 &; sleep 2; curl localhost:8001/health` | ❌ Wave 0 |
| INFRA-03 | TypeScript compiles with no errors against defined types | type check | `cd frontend && npx tsc --noEmit` | ❌ Wave 0 |
| INFRA-04 | CORS headers present for allowed origin, absent for disallowed | unit (pytest) | `cd backend && pytest tests/test_cors.py -x` | ❌ Wave 0 |
| INFRA-05 | GET /health returns `{"status": "ok"}` with 200 | unit (pytest) | `cd backend && pytest tests/test_health.py -x` | ❌ Wave 0 |
| INFRA-06 | CI workflow triggers on PR and both jobs pass | manual/CI | GitHub Actions PR check | ❌ Wave 0 |
| INFRA-07 | Vercel URL serves HTML, Render /health returns 200 | smoke (curl) | Post-deploy manual curl verification | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `cd backend && pytest tests/test_health.py -x` + `cd frontend && npx tsc --noEmit`
- **Per wave merge:** Full CI — both `test-frontend` and `test-backend` jobs green
- **Phase gate:** Deployed URLs responsive + `/health` returns 200 from Render before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/tests/test_health.py` — covers INFRA-05 (`GET /health` returns `{"status": "ok", ...}`)
- [ ] `backend/tests/test_cors.py` — covers INFRA-04 (CORS headers for allowed/disallowed origins)
- [ ] `backend/tests/conftest.py` — shared `TestClient` fixture
- [ ] `frontend/src/test/setup.ts` — `@testing-library/jest-dom` import
- [ ] `frontend/vite.config.ts` test section — `environment: 'jsdom'`, `globals: true`
- [ ] Framework installs: `pip install pytest==9.0.2 httpx==0.28.1` (add to requirements.txt)

---

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4 Vite installation — official docs](https://tailwindcss.com/docs/installation/using-vite) — exact plugin setup and `@import "tailwindcss"` syntax verified
- [Tailwind CSS v4 @theme documentation — official docs](https://tailwindcss.com/docs/theme) — `@theme` syntax, namespace conventions, oklch color format
- [FastAPI CORS official tutorial](https://fastapi.tiangolo.com/tutorial/cors/) — `CORSMiddleware` exact parameters, `allow_credentials` + wildcard constraint
- [Vercel Vite framework docs — official](https://vercel.com/docs/frameworks/frontend/vite) — SPA rewrite `vercel.json` pattern verified
- [Render FastAPI deploy docs — official](https://render.com/docs/deploy-fastapi) — `uvicorn main:app --host 0.0.0.0 --port $PORT` confirmed
- [Vite server.proxy official docs](https://vite.dev/config/server-options#server-proxy) — proxy config syntax, `changeOrigin` option

### Secondary (MEDIUM confidence)
- [pnpm/action-setup GitHub repo](https://github.com/pnpm/action-setup) — `pnpm/action-setup@v4` with `actions/setup-node@v4` cache pattern
- [GitHub Actions monorepo CI discussion](https://github.com/orgs/community/discussions/26251) — `cache-dependency-path` for monorepo lockfiles
- [PNPM GitHub Actions Cache — theodorusclarence.com](https://theodorusclarence.com/shorts/github/pnpm-github-actions-cache) — setup order requirement (pnpm before node)

### Tertiary (LOW confidence)
None — all critical claims verified with primary sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions from STACK.md, verified via npm/PyPI registries 2026-03-27
- Tailwind v4 setup: HIGH — verified directly against official Tailwind docs (fetched 2026-03-27)
- CORS pattern: HIGH — verified against FastAPI official tutorial
- Vercel SPA rewrite: HIGH — verified against official Vercel Vite docs
- Render deployment: HIGH — verified against official Render FastAPI docs
- GitHub Actions CI YAML: MEDIUM-HIGH — pnpm/action-setup@v4 pattern from official repo + community verification
- Pydantic v2 schema syntax: HIGH — from project-level research, FastAPI official docs
- Vite proxy syntax: HIGH — verified against official Vite docs

**Research date:** 2026-03-27
**Valid until:** 2026-06-27 (stable infrastructure patterns — low churn risk)
