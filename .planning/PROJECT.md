# DataLens — Interactive Dataset Explorer

## What This Is

CSV/JSON 데이터를 업로드하면 자동으로 분포, 상관관계, 이상값을 탐색하는 웹 기반 데이터 플랫폼. 데이터를 모르는 사람도 브라우저에서 즉시 EDA(탐색적 데이터 분석)를 수행할 수 있는 인터페이스를 제공한다. React 18 + TypeScript SPA가 FastAPI 백엔드와 REST API로 통신하며, pandas가 데이터 처리를 담당한다.

## Core Value

**데이터 파일을 드롭하면 즉시 의미 있는 시각화와 인사이트를 자동으로 보여준다** — 별도 설정이나 코딩 없이.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] CSV/JSON 파일 드래그앤드롭 업로드 + 자동 파싱
- [ ] 컬럼 타입 자동 감지 (숫자/카테고리/날짜/텍스트)
- [ ] 미리보기 테이블 (첫 50행, 가상화)
- [ ] 컬럼 타입별 최적 차트 자동 렌더링 (히스토그램/바차트/타임시리즈)
- [ ] Pearson 상관관계 히트맵 + 산점도 모달
- [ ] IQR 기반 이상값 탐지 + 토글 필터
- [ ] 요약 리포트 카드 (행수, 컬럼수, 결측값, 기초통계)
- [ ] FastAPI 백엔드 (POST /api/upload, POST /api/analyze)
- [ ] React.memo + useMemo + react-window 성능 최적화
- [ ] Vitest + RTL 테스트 (훅 테스트 필수)
- [ ] GitHub Actions CI (PR마다 테스트 + 빌드)
- [ ] Vercel (FE) + Render (BE) 배포

### Out of Scope

- 사용자 인증/로그인 — v1은 퍼블릭 도구, 인증 불필요
- 데이터 영속 저장 — 세션 기반 처리, DB 없음
- 실시간 협업 — 단일 사용자 도구
- 데이터 편집/변환 — 탐색 전용, ETL 기능 제외
- 모바일 앱 — 웹 SPA 우선

## Context

- **목적**: 네이버랩스 인턴 지원 포트폴리오 프로젝트. JD 핵심 스택(React + TS + 테스트 + API 연동 + 시각화) 전부 증명이 목표.
- **도메인**: Jupyter Notebook(개발자 전용)과 Tableau(유료/무거움) 사이의 빈 공간을 노림.
- **기존 역량**: Python 데이터 분석 경험 보유, 프론트엔드 전환 중.
- **포트폴리오 위치**: 5개 프로젝트 중 2번째. Focus Valley(React 19 + Vitest + Playwright) 다음, DANFLIX 이전.

## Constraints

- **Timeline**: 3주 (2026.03.25 ~ 04.15)
- **Tech Stack (FE)**: React 18 + TypeScript + Vite, Zustand, Recharts, Tailwind CSS, axios
- **Tech Stack (BE)**: FastAPI + pandas + numpy + scipy + python-multipart
- **Testing**: Vitest + React Testing Library (FE), pytest (BE), msw (API 모킹)
- **Deploy**: Vercel (FE) + Render (BE)
- **Rules**: any 타입 금지, 테스트 없는 훅 금지, Props는 interface 필수, Tailwind CSS only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Recharts (not D3/Victory) | React 컴포넌트 기반, TS 지원 자연스러움, 선언적 차트 | — Pending |
| Zustand (not Redux/Jotai) | 보일러플레이트 최소, 타입 추론 우수, 단일 store | — Pending |
| FastAPI (not Express/Django) | JD 명시 기술, pandas 생태계 직접 활용 | — Pending |
| Monorepo (frontend/ + backend/) | 하나의 저장소에서 FE/BE 관리, 포트폴리오 제출 편의 | — Pending |
| react-window (not react-virtualized) | 경량, 대용량 테이블 가상화 충분 | — Pending |

---
*Last updated: 2026-03-27 after initialization*
