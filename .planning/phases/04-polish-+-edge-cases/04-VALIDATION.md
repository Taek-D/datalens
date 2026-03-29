---
phase: 4
slug: polish-+-edge-cases
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 + React Testing Library 16.3.2 + MSW 2.12.14 (FE), pytest (BE) |
| **Config file** | frontend/vite.config.ts (vitest config), backend/pytest.ini |
| **Quick run command** | `cd frontend && npx vitest run` |
| **Full suite command** | `cd frontend && npx vitest run && cd ../backend && python -m pytest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx vitest run`
- **After every plan wave:** Run full suite (FE + BE)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | TEST-05 | integration | `cd frontend && npx vitest run src/__tests__/integration.test.tsx` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | SC-2 | unit | `cd frontend && npx vitest run` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | SC-4 | static | `cd frontend && npx tsc --noEmit` | ✅ | ⬜ pending |
| 04-01-04 | 01 | 1 | SC-5 | manual | N/A (deployment verification) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Add `/health` GET handler to MSW `setup.ts` — required before any integration test renders `<App>`
- [ ] Create integration test fixture CSV with mixed types (numeric, categorical, datetime, text, all-null column)
- [ ] Mock `CorrelationHeatmap` at module level for jsdom (nivo SVG incompatible)

*Existing infrastructure (Vitest, RTL, MSW) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cold-start /health < 5s | SC-5 | Requires deployed Render instance | Deploy backend, wait for cold start, time `/health` response |
| Connecting... indicator | SC-5 | Requires real network latency | Open deployed frontend after Render sleep, observe banner |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
