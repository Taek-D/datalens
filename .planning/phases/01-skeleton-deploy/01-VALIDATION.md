---
phase: 1
slug: skeleton-deploy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (FE)** | Vitest 4.1.2 + @testing-library/react 16.3.2 |
| **Framework (BE)** | pytest 9.0.2 + httpx 0.28.1 |
| **Config file (FE)** | `frontend/vite.config.ts` (test section) |
| **Config file (BE)** | `backend/pyproject.toml` (Wave 0 creates) |
| **Quick run (FE)** | `cd frontend && pnpm run test --run` |
| **Quick run (BE)** | `cd backend && pytest` |
| **Full suite** | Both jobs in `.github/workflows/ci.yml` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** `cd backend && pytest tests/test_health.py -x` + `cd frontend && npx tsc --noEmit`
- **After every plan wave:** Full CI — both `test-frontend` and `test-backend` jobs green
- **Before `/gsd:verify-work`:** Deployed URLs responsive + `/health` returns 200 from Render
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | INFRA-01 | build smoke | `cd frontend && pnpm run build` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | INFRA-02 | smoke | `cd backend && pytest tests/test_health.py -x` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | INFRA-04 | unit (pytest) | `cd backend && pytest tests/test_cors.py -x` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | INFRA-05 | unit (pytest) | `cd backend && pytest tests/test_health.py -x` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | INFRA-03 | type check | `cd frontend && npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | INFRA-06 | manual/CI | GitHub Actions PR check | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | INFRA-07 | smoke (curl) | Post-deploy manual curl | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/test_health.py` — stubs for INFRA-05 (GET /health returns `{"status": "ok"}`)
- [ ] `backend/tests/test_cors.py` — stubs for INFRA-04 (CORS headers for allowed/disallowed origins)
- [ ] `backend/tests/conftest.py` — shared `TestClient` fixture
- [ ] `frontend/src/test/setup.ts` — `@testing-library/jest-dom` import
- [ ] `frontend/vite.config.ts` test section — `environment: 'jsdom'`, `globals: true`
- [ ] Framework installs: `pip install pytest==9.0.2 httpx==0.28.1` (add to requirements.txt)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CI workflow triggers on PR | INFRA-06 | Requires actual GitHub PR | Create PR, verify Actions run green |
| Vercel serves frontend | INFRA-07 | Requires deployed URL | `curl -s https://<vercel-url>/ \| head -5` |
| Render /health responds | INFRA-07 | Requires deployed URL | `curl -s https://<render-url>/health` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
