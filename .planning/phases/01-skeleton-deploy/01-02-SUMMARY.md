---
phase: 01-skeleton-deploy
plan: 02
subsystem: infra
tags: [ci, github-actions, vercel, render, cors, deployment]
dependency_graph:
  requires:
    - 01-01 (frontend scaffold with pnpm-lock.yaml, backend scaffold with requirements.txt)
  provides:
    - .github/workflows/ci.yml (dual-job CI triggered on PR to main)
    - frontend/vercel.json (SPA rewrite rule for React Router deep links)
    - frontend/.env.production (VITE_API_URL placeholder)
    - backend/.env.example (ALLOWED_ORIGINS documentation for Render)
  affects:
    - Every future PR to main triggers automated CI checks
    - Vercel deployment reads vercel.json for SPA routing
    - Render deployment reads ALLOWED_ORIGINS env var for CORS
tech_stack:
  added:
    - GitHub Actions (pnpm/action-setup@v4, actions/setup-node@v4, actions/setup-python@v5)
    - Vercel SPA rewrite via vercel.json
  patterns:
    - pnpm/action-setup@v4 MUST precede actions/setup-node@v4 for cache activation
    - cache-dependency-path is repo-root-relative (not working-directory-relative)
    - --frozen-lockfile prevents silent lockfile mutation in CI
    - ALLOWED_ORIGINS env var set in Render dashboard (never hardcoded)
key_files:
  created:
    - .github/workflows/ci.yml
    - frontend/vercel.json
    - frontend/.env.production
    - backend/.env.example
  modified: []
decisions:
  - "pytest.ini with asyncio_mode=auto already existed from Plan 01 — no duplication needed"
  - "vercel.json placed inside frontend/ (not repo root) because Vercel root directory is set to frontend/"
  - "ALLOWED_ORIGINS documented in .env.example for Render dashboard — never hardcoded in source"
  - "checkpoint:human-verify Task 3 auto-approved (AUTO_CHAIN=true) — deployment steps documented for human to execute"
metrics:
  duration_minutes: 5
  completed_date: "2026-03-27"
  tasks_completed: 3
  tasks_total: 3
  files_created: 4
  files_modified: 0
---

# Phase 1 Plan 2: CI Pipeline and Deployment Configuration Summary

**One-liner:** GitHub Actions dual-job CI (pnpm+vitest frontend, pip+pytest backend) triggered on PR to main, with Vercel SPA rewrite config and CORS-ready Render env documentation.

## What Was Built

**CI Pipeline (`.github/workflows/ci.yml`):**
- Two independent jobs running in parallel on every PR to `main`
- `test-frontend`: `pnpm install --frozen-lockfile` → `pnpm run lint` → `pnpm run test` → `pnpm run build`
- `test-backend`: `pip install -r requirements.txt` → `pytest`
- pnpm cache via `pnpm/action-setup@v4` (placed before `actions/setup-node@v4` — critical ordering)
- pip cache via `actions/setup-python@v5` with `cache-dependency-path: backend/requirements.txt`

**Vercel SPA Config (`frontend/vercel.json`):**
- SPA rewrite rule: all routes (`/(.*)`) serve `index.html`
- Prevents Vercel 404 on direct deep-link access to any React Router route
- Placed in `frontend/` because Vercel root directory is configured to `frontend/`

**Deployment Env Stubs:**
- `frontend/.env.production`: `VITE_API_URL` placeholder with update instructions
- `backend/.env.example`: `ALLOWED_ORIGINS` documentation for Render dashboard setup

## Verification Results

| Check | Result |
|-------|--------|
| `.github/workflows/ci.yml` exists with two jobs | PASS |
| `pnpm/action-setup@v4` before `actions/setup-node@v4` | PASS |
| `--frozen-lockfile` present | PASS |
| `frontend/vercel.json` valid JSON | PASS (validated via Node.js JSON.parse) |
| SPA rewrite rule present | PASS |
| `backend/.env.example` documents `ALLOWED_ORIGINS` | PASS |
| `frontend/.env.production` has `VITE_API_URL` placeholder | PASS |

## Deployment Instructions (for human)

Task 3 (Deploy to Vercel + Render) was auto-approved in AUTO mode. The step-by-step instructions are in the plan file at `.planning/phases/01-skeleton-deploy/01-02-PLAN.md` Task 3.

**Summary of steps:**
1. Push commits to main
2. Deploy frontend to Vercel (root dir: `frontend/`, add `VITE_API_URL` env var)
3. Deploy backend to Render (root dir: `backend/`, start cmd: `uvicorn main:app --host 0.0.0.0 --port $PORT`, add `ALLOWED_ORIGINS` env var)
4. Update `VITE_API_URL` in Vercel with actual Render URL
5. Verify: `curl https://<render-url>/health` → `{"status":"ok"}`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Existing file] pytest.ini already existed from Plan 01**
- **Found during:** Task 1 setup
- **Issue:** Plan 01 already created `backend/pytest.ini` with `asyncio_mode = auto` — Plan 02 also lists it as a file to create
- **Fix:** Skipped creation — existing file already satisfies the done criteria exactly
- **Files modified:** None (no change needed)

None — plan executed as written (2 auto tasks + 1 auto-approved checkpoint).

## Self-Check: PASSED

Files verified present:
- .github/workflows/ci.yml — FOUND
- frontend/vercel.json — FOUND
- frontend/.env.production — FOUND
- backend/.env.example — FOUND

Commits verified:
- d7c5070 — CI workflow
- bb52c6e — Vercel config and env stubs
