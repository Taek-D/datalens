# DataLens — Interactive Dataset Explorer

## What This Is

CSV/JSON 데이터를 업로드하면 자동으로 분포, 상관관계, 이상값을 탐색하는 웹 기반 데이터 플랫폼. 데이터를 모르는 사람도 브라우저에서 즉시 EDA(탐색적 데이터 분석)를 수행할 수 있는 인터페이스를 제공한다. React 18 + TypeScript SPA가 FastAPI 백엔드와 REST API로 통신하며, pandas가 데이터 처리를 담당한다.

## Core Value

**데이터 파일을 드롭하면 즉시 의미 있는 시각화와 인사이트를 자동으로 보여준다** — 별도 설정이나 코딩 없이.

## Requirements

### Validated

- ✓ CSV/JSON 파일 드래그앤드롭 업로드 + 자동 파싱 — v1.0
- ✓ 컬럼 타입 자동 감지 (숫자/카테고리/날짜/텍스트) — v1.0
- ✓ 미리보기 테이블 (첫 50행, react-window 가상화) — v1.0
- ✓ 컬럼 타입별 최적 차트 자동 렌더링 (히스토그램/바차트/타임시리즈) — v1.0
- ✓ Pearson 상관관계 히트맵 + 산점도 모달 (2,000개 다운샘플링) — v1.0
- ✓ IQR 기반 이상값 탐지 + 전체 토글 필터 — v1.0
- ✓ 요약 카드 (행수, 컬럼수, 결측비율, 중복수) + 품질 알림 — v1.0
- ✓ FastAPI 백엔드 (POST /api/upload, /api/analyze, /api/scatter) — v1.0
- ✓ React.memo + useMemo + react-window 성능 최적화 — v1.0
- ✓ 110+ 테스트 (48 FE Vitest + 62 BE pytest) — v1.0
- ✓ GitHub Actions CI (PR마다 테스트 + 빌드) — v1.0
- ✓ Vercel (FE) + Render (BE) 배포 — v1.0

### Active

(None — v1.0 shipped, next milestone TBD)

### Out of Scope

- 사용자 인증/로그인 — v1은 퍼블릭 도구, 인증 불필요
- 데이터 영속 저장 — 세션 기반 처리, DB 없음
- 실시간 협업 — 단일 사용자 도구
- 데이터 편집/변환 — 탐색 전용, ETL 기능 제외
- 모바일 앱 — 웹 SPA 우선

## Context

- **목적**: 네이버랩스 인턴 지원 포트폴리오 프로젝트. JD 핵심 스택(React + TS + 테스트 + API 연동 + 시각화) 전부 증명이 목표.
- **도메인**: Jupyter Notebook(개발자 전용)과 Tableau(유료/무거움) 사이의 빈 공간을 노림.
- **현재 상태**: v1.0 shipped. 2,916 LOC TypeScript (FE) + 1,174 LOC Python (BE). Vercel + Render 배포 완료.
- **포트폴리오 위치**: 5개 프로젝트 중 2번째. Focus Valley(React 19 + Vitest + Playwright) 다음, DANFLIX 이전.

## Constraints

- **Timeline**: 3주 (2026.03.25 ~ 04.15)
- **Tech Stack (FE)**: React 18 + TypeScript + Vite, Zustand, Recharts, @nivo/heatmap, Tailwind CSS 4, axios
- **Tech Stack (BE)**: FastAPI + pandas + numpy + scipy + python-multipart
- **Testing**: Vitest + React Testing Library (FE), pytest (BE), MSW (API 모킹)
- **Deploy**: Vercel (FE) + Render (BE)
- **Rules**: any 타입 금지, 테스트 없는 훅 금지, Props는 interface 필수, Tailwind CSS only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Recharts (not D3/Victory) | React 컴포넌트 기반, TS 지원 자연스러움, 선언적 차트 | ✓ Good |
| Zustand 3-slice (not Redux/Jotai) | 보일러플레이트 최소, 타입 추론 우수, dataset/analysis/ui 분리 | ✓ Good |
| FastAPI (not Express/Django) | JD 명시 기술, pandas 생태계 직접 활용 | ✓ Good |
| Monorepo (frontend/ + backend/) | 하나의 저장소에서 FE/BE 관리, 포트폴리오 제출 편의 | ✓ Good |
| react-window v2 (not react-virtualized) | 경량, List + rowComponent API, 대용량 테이블/목록 가상화 | ✓ Good |
| @nivo/heatmap 0.99 (not Recharts) | Recharts에 없는 히트맵 전문 라이브러리, D3 기반 색상 스케일 | ✓ Good |
| In-memory dict (not Redis/DB) | 단일 프로세스 Render 무료 티어에 충분, v1 세션 기반 | ✓ Good |
| run_in_executor (not celery) | pandas 처리 시 이벤트 루프 블로킹 방지, 경량 솔루션 | ✓ Good |

---
*Last updated: 2026-03-29 after v1.0 milestone*
