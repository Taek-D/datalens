# Phase 2: Upload + API + State - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

CSV/JSON 파일을 업로드하면 파싱 → 4개 분석 서비스(stats, correlation, outlier, quality) 실행 → Zustand 스토어에 타입된 결과 저장. 모든 커스텀 훅과 백엔드 서비스에 테스트 커버리지 확보. 시각화(차트)는 Phase 3 범위.

</domain>

<decisions>
## Implementation Decisions

### 업로드 영역 UX
- 중앙 카드형 드롭존 — 페이지 중앙에 점선 테두리 + 아이콘의 컴팩트한 드롭 영역
- 드래그 호버 시 테두리 강조 + 색상 변경 (점선→파란 실선, 배경 연한 파란색)
- 업로드 진행 상태는 드롭존 카드 내부에 파일명 + 프로그레스 바로 표시
- 업로드 완료 후 드롭존 사라지고 미리보기 테이블 + 분석 결과로 대체
- 새 파일 업로드는 상단 "새 파일" 버튼으로 가능 (Zustand resetStore() 호출 후 드롭존 복귀)

### 분석 트리거 & 진행 표시
- 업로드 완료 즉시 자동 분석 — POST /api/upload 응답 후 자동으로 POST /api/analyze 호출
- 분석 중 단계별 프로그레스 표시: "파싱 중..." → "통계 분석 중..." → "상관관계 계산 중..." → "이상값 탐지 중..."
- 분석 완료 후 미리보기 테이블 + 요약 카드 표시 (Phase 3에서 차트가 아래에 추가될 예정)

### 미리보기 테이블
- 읽기 전용 — 정렬/필터 없이 50행 그대로 표시
- 컴팩트 테이블 — 셀 패딩 최소화, 작은 폰트, 긴 텍스트는 말줄임표(…)로 잘라냄
- 컬럼 헤더 옆 색상 뱃지로 타입 표시 (numeric=파랑, categorical=보라, datetime=초록, text=회색)
- null/결측값은 회색 이탤릭체 "null"로 표시

### 에러 & 엣지케이스
- 10MB 초과: 드롭존 내부에 빨간색 에러 메시지 + 실제 파일 크기 표시, 드롭존 유지
- 잘못된 파일 형식: 클라이언트에서 확장자(.csv, .json) 먼저 검증, 지원하지 않는 형식이면 드롭존에 에러 표시
- 빈 파일/헤더만 있는 CSV: 서버에서 0행 감지 시 에러 반환, "데이터가 없는 파일입니다" 표시
- 서버 분석 에러: 인라인 에러 메시지 + "다시 시도" 버튼, 업로드된 데이터는 유지되어 재업로드 불필요

### Claude's Discretion
- 드롭존 아이콘 및 세부 레이아웃
- 프로그레스 바 디자인 (선형 vs 원형)
- 요약 카드의 정보 배치 및 스타일링
- 에러 메시지의 정확한 문구
- react-window 행 높이 및 가상화 세부 설정

</decisions>

<specifics>
## Specific Ideas

- 핵심 가치 제안 "드롭하면 즉시 인사이트" — 업로드에서 분석까지 사용자 추가 조작 없이 자동 진행
- 분석 단계별 프로그레스는 실제 백엔드 서비스 단계(parser → stats → correlation → outlier)와 매칭되어야 함
- 컬럼 타입 색상 체계 (파랑/보라/초록/회색)는 Phase 3 차트에서도 일관되게 사용할 것

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apiClient` (frontend/src/api/client.ts): axios 인스턴스, baseURL + 30s timeout 설정 완료 — upload/analyze API 호출에 그대로 사용
- `ColumnType`, `ColumnMeta`, `UploadResponse` (frontend/src/types/dataset.ts): 데이터 계약 정의 완료 — 백엔드 스키마와 동기화됨
- `AnalysisResultResponse` (frontend/src/types/analysis.ts): Phase 2에서 완전 타입 정의 필요 (현재 placeholder)
- Pydantic 스키마 (backend/schemas/): upload.py 완성, analysis.py는 스텁 — Phase 2에서 확장

### Established Patterns
- snake_case 유지 (camelCase 변환 없음) — 프론트/백 동일 키 이름
- App.tsx에 서버 상태 체크 패턴 존재 (warming UI) — 동일한 패턴으로 업로드/분석 상태 관리 가능
- Tailwind CSS 4 커스텀 테마 토큰 (bg-surface, text-primary 등) 사용 중

### Integration Points
- App.tsx의 `<main>` 영역에 드롭존/테이블/결과 컴포넌트를 렌더링
- Zustand 스토어는 아직 없음 — Phase 2에서 생성 (datasetSlice, analysisSlice, uiSlice)
- 백엔드 app/api/ 디렉토리에 health.py 패턴 참고하여 upload/analyze 라우터 추가
- python-multipart 이미 설치됨 — FastAPI 파일 업로드에 필요

</code_context>

<deferred>
## Deferred Ideas

None — 논의가 Phase 2 범위 내에서 유지됨

</deferred>

---

*Phase: 02-upload-api-state*
*Context gathered: 2026-03-27*
