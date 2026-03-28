# Phase 3: Visualization - Context

**Gathered:** 2026-03-29 (in progress)
**Status:** Partially gathered — 1 of 4 areas discussed

<domain>
## Phase Boundary

분석 결과를 인터랙티브 차트 컴포넌트로 렌더링 — 히스토그램, 바차트, 타임시리즈, 상관 히트맵(+산점도 모달), 이상값 패널(IQR 토글), 요약 카드, 결측값 시각화, 데이터 품질 알림. ChartRouter 타입 분기 + React.memo/useMemo 성능 최적화 포함.

</domain>

<decisions>
## Implementation Decisions

### 차트 레이아웃 & 구성
- 2열 그리드 배치 — 컬럼별 차트를 2열 그리드로 나열, 카드 헤더에 컬럼명 + 타입 배지
- 고정 높이 300px — 모든 차트 카드 동일 높이로 깔끔한 그리드 유지
- 페이지 섹션 순서: 요약 카드 → 분포 차트(2열 그리드) → 상관관계 히트맵 → 이상값 패널
- 미리보기 테이블 위에 요약, 아래로 점점 깊이 들어가는 EDA 워크플로 흐름

### 히트맵 & 산점도 모달
- (미논의 — 다음 세션에서 계속)

### 이상값 패널 & 토글
- (미논의 — 다음 세션에서 계속)

### 요약 카드 & 품질 알림
- (미논의 — 다음 세션에서 계속)

### Claude's Discretion
- (최종 세션 후 확정)

</decisions>

<prior_decisions>
## Carrying Forward from Earlier Phases

### Phase 1
- Tailwind CSS 4 + @theme 토큰 (bg-surface, text-primary 등)
- snake_case 유지 (camelCase 변환 없음)

### Phase 2
- 컬럼 타입 색상 체계: numeric=파랑, categorical=보라, datetime=초록, text=회색 — Phase 3 차트에서도 일관 적용
- 업로드 완료 후 드롭존 → 미리보기 테이블 + 분석 결과로 대체
- Recharts (히스토그램/바/산점도/타임시리즈), @nivo/heatmap 0.99 (상관 히트맵)
- 산점도 데이터 서버사이드 2,000개 다운샘플링
- React.memo + useMemo 성능 최적화

</prior_decisions>

<specifics>
## Specific Ideas

- EDA 도구답게 "개요 → 분포 → 관계 → 이상값" 순서로 점진적 탐색 흐름
- 2열 그리드는 컬럼 수가 많아도 한 눈에 비교 가능

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AnalysisResultResponse` (types/analysis.ts): summary, correlation, outliers, quality_alerts, row_count, column_count, missing_ratio, duplicate_count
- `ColumnMeta` + `ColumnType` (types/dataset.ts): 컬럼 메타데이터, 타입 분기 기반
- `analysisSlice` (store/analysisSlice.ts): analysisResult 상태 보유
- `uiSlice` (store/uiSlice.ts): status, error, analysisStep 상태
- `useStore` (store/index.ts): 3 슬라이스 통합 + resetStore()

### Established Patterns
- Zustand 슬라이스 패턴 (StateCreator 기반)
- Tailwind CSS 4 커스텀 테마 토큰
- snake_case API 응답 그대로 사용

### Integration Points
- App.tsx의 메인 영역에 섹션별 컴포넌트 렌더링
- analysisResult가 null이 아닐 때 차트 섹션 표시
- ChartRouter가 ColumnType별로 적절한 차트 컴포넌트 분기

</code_context>

<deferred>
## Deferred Ideas

None — 논의가 Phase 3 범위 내에서 유지됨

</deferred>

---

*Phase: 03-visualization*
*Context gathered: 2026-03-29 (partial — resume next session)*
