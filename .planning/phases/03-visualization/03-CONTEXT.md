# Phase 3: Visualization - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

분석 결과를 인터랙티브 차트 컴포넌트로 렌더링 — 히스토그램, 바차트, 타임시리즈, 상관 히트맵(+산점도 모달), 이상값 패널(IQR 토글), 요약 카드, 결측값 시각화, 데이터 품질 알림. ChartRouter 타입 분기 + React.memo/useMemo 성능 최적화 포함.

</domain>

<decisions>
## Implementation Decisions

### 차트 레이아웃 & 구성
- 2열 그리드 배치 — 컬럼별 차트를 2열 그리드로 나열, 카드 헤더에 컬럼명 + 타입 배지
- 고정 높이 300px — 모든 차트 카드 동일 높이로 깔끔한 그리드 유지
- 페이지 섹션 순서: 요약 카드 → 품질 알림 → 분포 차트(2열 그리드) → 상관관계 히트맵 → 이상값 패널
- 미리보기 테이블 위에 요약, 아래로 점점 깊이 들어가는 EDA 워크플로 흐름

### 히트맵 & 산점도 모달
- 파랑(-1) → 흰색(0) → 빨강(+1) 단색 그라디언트 색상 스케일
- 각 셀에 상관계수 숫자 항상 표시 (색상만으로 정확한 값 파악 어려움)
- 셀 클릭 시 센터 모달로 산점도 열기 — 배경 클릭 또는 X 버튼으로 닫기
- 산점도 모달에 차트 + 메타정보: 상관계수, 두 컬럼명, "Showing N of M" 레이블
- 산점도 데이터는 서버사이드 2,000개 다운샘플링 (Phase 2에서 결정)

### 이상값 패널 & 토글
- 테이블 형식 레이아웃: 컬럼명 | IQR 범위 (lower~upper) | 이상값 수
- 전체 토글 — 하나의 토글로 모든 컬럼의 이상값 일괄 제외/포함
- 토글 ON 시 이상값 제외 후 히스토그램/통계 리드로우 (실시간 비교 가능)
- 이상값 없는 컬럼도 테이블에 표시하되 0건 표기 — 모든 컬럼 상황 한 눈에 확인

### 요약 카드 & 품질 알림
- 4칸 그리드 대시보드 — row_count, column_count, missing_ratio, duplicate_count
- 결측값은 요약 카드의 missing_ratio 카드로 통합 표시 (별도 차트 불필요)
- 품질 알림은 severity에 따라 색상 구분한 배너 리스트 (warning=노랑, critical=빨강)
- 품질 알림 배치: 요약 카드 바로 아래 — 데이터 개요 확인 후 바로 품질 이슈 인지
- 배너에 컬럼명 + 메시지 표시 (상수컬럼, 높은 카디널리티, null 비율, 편향)

### Claude's Discretion
- 로딩 스켈레톤 디자인
- 정확한 spacing과 typography
- 에러 상태 처리
- 히트맵 셀 호버 인터랙션 세부사항
- 차트 애니메이션/트랜지션

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
- 히트맵은 학술 논문/Jupyter 스타일의 빨강-파랑 diverging 색상 관례 따름
- 이상값 패널은 pandas describe() + IQR 정보를 시각적으로 재구성한 느낌

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AnalysisResultResponse` (types/analysis.ts): summary, correlation, outliers, quality_alerts, row_count, column_count, missing_ratio, duplicate_count
- `ColumnMeta` + `ColumnType` (types/dataset.ts): 컬럼 메타데이터, 타입 분기 기반
- `OutlierResult` (types/analysis.ts): column, lower_bound, upper_bound, outlier_count, outlier_indices
- `QualityAlert` (types/analysis.ts): column, alert_type, message, severity
- `CorrelationMatrix` (types/analysis.ts): columns[], values[][] 구조
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
*Context gathered: 2026-03-29*
