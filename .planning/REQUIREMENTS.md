# Requirements: DataLens

**Defined:** 2026-03-27
**Core Value:** 데이터 파일을 드롭하면 즉시 의미 있는 시각화와 인사이트를 자동으로 보여준다 — 별도 설정이나 코딩 없이.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: Vite + React 18 + TypeScript 모노레포 프로젝트 구조 (frontend/ + backend/)
- [x] **INFRA-02**: FastAPI 백엔드 프로젝트 구조 (Pydantic 스키마 + 서비스 레이어)
- [x] **INFRA-03**: TypeScript 인터페이스와 Pydantic 스키마 간 데이터 계약 정의
- [x] **INFRA-04**: CORS 환경변수 기반 설정 (배포 환경별 origin 관리)
- [x] **INFRA-05**: /health 엔드포인트 + 프론트엔드 워밍업 호출 (Render 콜드스타트 대응)
- [x] **INFRA-06**: GitHub Actions CI (PR마다 FE 테스트 + BE 테스트 + 빌드)
- [x] **INFRA-07**: Vercel (FE) + Render (BE) 배포 파이프라인

### Upload

- [ ] **UPLD-01**: 사용자가 CSV/JSON 파일을 드래그앤드롭으로 업로드할 수 있다
- [ ] **UPLD-02**: 사용자가 파일 선택 대화상자로도 업로드할 수 있다 (폴백)
- [x] **UPLD-03**: 업로드 시 컬럼 타입을 자동 감지한다 (숫자/카테고리/날짜/텍스트)
- [ ] **UPLD-04**: 업로드 후 첫 50행 미리보기 테이블을 즉시 표시한다 (react-window 가상화)
- [x] **UPLD-05**: 파일 크기 제한 (10MB) 초과 시 명확한 에러 메시지를 표시한다
- [ ] **UPLD-06**: 새 파일 업로드 시 이전 데이터 상태가 완전히 초기화된다

### Analysis API

- [x] **ANLZ-01**: POST /api/upload 엔드포인트가 파일을 파싱하여 컬럼 메타 + 미리보기를 반환한다
- [x] **ANLZ-02**: POST /api/analyze 엔드포인트가 분포/상관/이상값/요약 분석 결과를 반환한다
- [x] **ANLZ-03**: pandas 처리를 run_in_executor로 감싸 이벤트 루프 블로킹을 방지한다
- [x] **ANLZ-04**: low_memory=False + 2차 타입 추론으로 혼합 타입 컬럼을 올바르게 처리한다

### Visualization

- [ ] **VIZL-01**: 숫자형 컬럼에 히스토그램을 자동 렌더링한다
- [ ] **VIZL-02**: 카테고리형 컬럼에 바차트를 자동 렌더링한다 (상위 20개)
- [ ] **VIZL-03**: 날짜형 컬럼에 타임시리즈 라인차트를 자동 렌더링한다
- [ ] **VIZL-04**: 컬럼 클릭 시 해당 차트로 포커스가 이동한다
- [ ] **VIZL-05**: 수치형 컬럼 간 Pearson 상관관계 히트맵을 표시한다 (@nivo/heatmap)
- [ ] **VIZL-06**: 히트맵 셀 클릭 시 해당 두 컬럼의 산점도 모달을 표시한다
- [ ] **VIZL-07**: 산점도 데이터는 서버에서 2,000개 이하로 다운샘플링한다

### Outlier Detection

- [ ] **OTLR-01**: IQR 방식으로 각 수치형 컬럼의 이상값을 자동 탐지한다
- [ ] **OTLR-02**: 각 컬럼별 이상값 개수와 IQR 경계를 표시한다
- [ ] **OTLR-03**: 이상값 포함/제외 토글 시 차트와 통계가 실시간 반영된다

### Summary & Quality

- [ ] **SUMM-01**: 데이터셋 개요 카드를 표시한다 (행 수, 컬럼 수, 결측값 비율, 중복 행 수)
- [ ] **SUMM-02**: 수치형 컬럼 기초통계를 표시한다 (mean, std, min, max, Q1, median, Q3, skewness)
- [ ] **SUMM-03**: 컬럼별 결측값 분석을 시각화한다
- [ ] **SUMM-04**: 데이터 품질 알림을 표시한다 (상수 컬럼, 높은 카디널리티, 높은 null 비율, 심한 왜도)

### State & Performance

- [ ] **PERF-01**: Zustand DatasetStore로 전역 상태를 관리한다 (3 슬라이스: dataset, analysis, ui)
- [ ] **PERF-02**: React.memo + useMemo로 불필요한 차트 리렌더링을 방지한다
- [ ] **PERF-03**: react-window로 대용량 데이터 테이블을 가상화한다

### Testing

- [ ] **TEST-01**: 모든 커스텀 훅에 대응하는 Vitest 테스트가 존재한다
- [ ] **TEST-02**: ChartRouter 타입 분기 로직에 유닛 테스트가 존재한다
- [ ] **TEST-03**: analysisApi에 MSW 기반 모킹 테스트가 존재한다
- [x] **TEST-04**: 백엔드 서비스에 pytest 테스트가 존재한다
- [ ] **TEST-05**: 업로드 → 분석 → 차트 렌더링 통합 테스트가 존재한다

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Extended Features

- **EXT-01**: Per-column detail panel (컬럼 클릭 → 전체 통계 + 시각화 드로어)
- **EXT-02**: Excel/XLSX 파일 업로드 지원
- **EXT-03**: 정적 HTML 리포트 내보내기
- **EXT-04**: 중복 행 상세 뷰어

## Out of Scope

| Feature | Reason |
|---------|--------|
| 인브라우저 데이터 편집 | EDA 도구를 데이터 에디터로 변환 — 완전히 다른 제품 |
| 사용자 인증/세션 저장 | 인증은 별도 제품 수직. v1은 DB 없는 세션 기반 |
| 실시간 DB/API/S3 커넥터 | 자격 증명 관리, 연결 풀링 등 EDA 핵심과 무관한 수주 작업 |
| 협업/멀티유저 편집 | WebSocket/CRDT 인프라 필요 |
| 50MB+ 파일 지원 | 브라우저 메모리 한계, Web Worker 스트리밍 아키텍처 필요 |
| AI/NL 질의 인터페이스 | LLM 통합은 포트폴리오 일정 외 |
| 모바일 앱 | 웹 SPA 우선 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| INFRA-05 | Phase 1 | Complete |
| INFRA-06 | Phase 1 | Complete |
| INFRA-07 | Phase 1 | Complete |
| UPLD-01 | Phase 2 | Pending |
| UPLD-02 | Phase 2 | Pending |
| UPLD-03 | Phase 2 | Complete |
| UPLD-04 | Phase 2 | Pending |
| UPLD-05 | Phase 2 | Complete |
| UPLD-06 | Phase 2 | Pending |
| ANLZ-01 | Phase 2 | Complete |
| ANLZ-02 | Phase 2 | Complete |
| ANLZ-03 | Phase 2 | Complete |
| ANLZ-04 | Phase 2 | Complete |
| VIZL-01 | Phase 3 | Pending |
| VIZL-02 | Phase 3 | Pending |
| VIZL-03 | Phase 3 | Pending |
| VIZL-04 | Phase 3 | Pending |
| VIZL-05 | Phase 3 | Pending |
| VIZL-06 | Phase 3 | Pending |
| VIZL-07 | Phase 3 | Pending |
| OTLR-01 | Phase 3 | Pending |
| OTLR-02 | Phase 3 | Pending |
| OTLR-03 | Phase 3 | Pending |
| SUMM-01 | Phase 3 | Pending |
| SUMM-02 | Phase 3 | Pending |
| SUMM-03 | Phase 3 | Pending |
| SUMM-04 | Phase 3 | Pending |
| PERF-01 | Phase 2 | Pending |
| PERF-02 | Phase 3 | Pending |
| PERF-03 | Phase 3 | Pending |
| TEST-01 | Phase 2 | Pending |
| TEST-02 | Phase 3 | Pending |
| TEST-03 | Phase 2 | Pending |
| TEST-04 | Phase 2 | Complete |
| TEST-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after 01-02 completion (INFRA-01 through INFRA-07 all complete)*
