# Phase 1: Skeleton + Deploy - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Monorepo scaffold where frontend (React 18 + TypeScript + Vite) and backend (FastAPI + pandas) communicate, CI passes on every PR, both services are deployed on Vercel + Render, and data contracts (TypeScript interfaces + Pydantic schemas) are defined. No feature code — only infrastructure.

</domain>

<decisions>
## Implementation Decisions

### Monorepo Structure
- Top-level `frontend/` and `backend/` directories — not a workspace monorepo (no pnpm workspaces)
- `frontend/`: Vite + React 18 + TypeScript project (pnpm as package manager)
- `backend/`: FastAPI project with `requirements.txt` (no Poetry/pipenv)
- Shared types are manually kept in sync between `frontend/src/types/` and `backend/schemas/`

### Package Versions (Research-Verified)
- Node >= 20.19 (required by Vite 8)
- Python >= 3.11 (required by pandas 3.0.1)
- Tailwind CSS v4 with `@tailwindcss/vite` plugin — no PostCSS config, no `tailwind.config.js`
- CSS entry: `@import "tailwindcss"` in main CSS file

### CORS Configuration
- Store allowed origins in `ALLOWED_ORIGINS` environment variable
- Never hardcode `localhost` or use `allow_origins=["*"]` with `allow_credentials=True`
- Development: `http://localhost:5173` (Vite default)
- Production: Vercel deployment URL

### Cold Start Mitigation
- `GET /health` endpoint on FastAPI from day one
- Frontend calls `/health` on app mount before any user action
- If response takes > 2 seconds, show "분석 서버에 연결 중..." UI indicator
- Recovery is automatic — indicator disappears when health check succeeds

### CI Pipeline
- Single GitHub Actions workflow with two jobs: `test-frontend` and `test-backend`
- Frontend job: pnpm install → lint → test → build
- Backend job: pip install → pytest → (optional lint)
- Trigger: pull_request to `main`

### Deployment
- Vercel: auto-deploy from `main` branch, root directory set to `frontend/`
- Render: free tier web service, root directory `backend/`, start command `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables configured per service (CORS origins, API URL)

### Data Contracts
- TypeScript interfaces in `frontend/src/types/dataset.ts` and `frontend/src/types/analysis.ts`
- Pydantic v2 schemas in `backend/schemas/upload.py` and `backend/schemas/analysis.py`
- Shapes must match exactly: `ColumnMeta`, `UploadResponse`, `AnalysisResultResponse`
- Contract includes: `ColumnType` enum (`numeric` | `categorical` | `datetime` | `text`)

### Claude's Discretion
- Exact Tailwind v4 `@theme` token definitions (colors, spacing)
- ESLint/Prettier configuration specifics
- Backend directory structure beyond `schemas/` and `services/`
- README content for initial scaffold

</decisions>

<specifics>
## Specific Ideas

- Vite proxy 설정으로 개발 시 `/api` 요청을 FastAPI로 포워딩 — CORS 문제 없이 로컬 개발
- `frontend/.env` → `VITE_API_URL` (production Render URL)
- `backend/.env` → `ALLOWED_ORIGINS` (production Vercel URL)
- Tailwind v4는 CSS-first config 방식 — `tailwind.config.js` 없이 `@theme` 블록으로 커스텀 토큰 정의

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None — patterns will be established in this phase

### Integration Points
- `CLAUDE.md` already exists at project root with architecture overview and rules
- `.planning/` directory with full research, requirements, and roadmap

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-skeleton-deploy*
*Context gathered: 2026-03-27*
