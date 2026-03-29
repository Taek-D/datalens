# 📊 DataLens — Interactive Dataset Explorer
## 기획서 v1.0 | 2026.03.25

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| **프로젝트명** | DataLens — Interactive Dataset Explorer |
| **한줄설명** | CSV/JSON 데이터를 업로드하면 자동으로 분포·상관관계·이상값을 탐색하는 데이터 플랫폼 |
| **목표** | 네이버랩스 JD 핵심 스택(React + TS + 테스트 + API 연동 + 시각화) 전부 증명 |
| **개발기간** | 3주 (2026.03.25 ~ 04.15) |
| **배포** | Vercel (Frontend) + Render (FastAPI Backend) |

---

## 2. Problem & Motivation

### Why I Built This

- 데이터 분석가는 새 데이터셋을 받으면 가장 먼저 EDA(탐색적 데이터 분석)를 수행한다
- 그런데 Jupyter Notebook은 개발자 전용이고, Tableau는 무겁고 유료다
- **"데이터를 모르는 사람도 브라우저에서 즉시 탐색할 수 있는 인터페이스"** 가 필요하다

### Why This Approach

- FastAPI 백엔드가 pandas로 데이터를 처리 → REST API로 프론트에 전달하는 구조
- 이는 네이버랩스 JD의 *"백엔드(FastAPI)와의 API 연동"* 을 직접 재현한 아키텍처
- React 컴포넌트가 데이터 타입을 감지해 최적 차트를 자동 선택 → 컴포넌트 설계 역량 증명

---

## 3. 기술 스택 — JD 직접 매핑

| JD 요구사항 | 사용 기술 | 선택 이유 |
|---|---|---|
| React 기반 컴포넌트 아키텍처 | React 19 + TypeScript | 타입 안전성 + props interface 명시 |
| 백엔드 API 연동 | FastAPI (Python) | JD에 명시된 기술, pandas 처리 |
| 데이터 시각화 구현 | Recharts | React 친화적, TS 지원 |
| 유닛/통합 테스트 | Vitest + React Testing Library | Focus Valley와 동일 스택 |
| 성능 최적화 (우대) | React.memo + useMemo + 가상화 | 대용량 데이터 렌더링 |
| CI/CD 자동화 (우대) | GitHub Actions | PR마다 테스트 자동 실행 |
| 디자인 시스템 (우대) | Tailwind CSS | DANFLIX, Focus Valley와 동일 |

---

## 4. 시스템 아키텍처

```
[사용자 브라우저]
      │
      │ CSV/JSON 업로드
      ▼
[React 19 + TypeScript SPA]  ─── Vercel 배포
      │
      │ REST API (axios)
      ▼
[FastAPI Backend]  ─── Render 배포
      │
      │ pandas 처리
      ▼
[분석 결과 JSON 반환]
 - 컬럼 메타데이터
 - 분포 데이터
 - 상관관계 행렬
 - 이상값 좌표
```

### State 설계 (Zustand)

```typescript
DatasetStore
 ├── rawData: Row[]
 ├── columns: ColumnMeta[]
 ├── analysisResult: AnalysisResult | null
 └── status: 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'
```

---

## 5. 핵심 기능 정의

### Feature 1: 파일 업로드 & 자동 파싱

- CSV / JSON 드래그앤드롭 업로드
- FastAPI가 pandas로 컬럼 타입 자동 감지 (숫자 / 카테고리 / 날짜 / 텍스트)
- 미리보기 테이블 (첫 50행, 가상화 적용)
- **컴포넌트:** `<DropZone />`, `<DataPreviewTable />`

### Feature 2: 자동 차트 렌더링

- 컬럼 타입에 따라 최적 차트 자동 선택
  - 숫자 → 히스토그램 + 박스플롯
  - 카테고리 → 바차트 (상위 20개)
  - 날짜 → 타임시리즈
- 컬럼 클릭 시 해당 차트로 포커스 이동
- **컴포넌트:** `<ChartRouter />`, `<HistogramChart />`, `<BarChart />`, `<TimeSeriesChart />`

### Feature 3: 상관관계 히트맵

- 수치형 컬럼 간 Pearson 상관계수 시각화
- 셀 클릭 시 해당 두 컬럼의 산점도 모달 표시
- **컴포넌트:** `<CorrelationHeatmap />`, `<ScatterModal />`

### Feature 4: 이상값 탐지

- IQR 방식으로 이상값 자동 탐지
- 각 컬럼별 이상값 개수 표시 + 행 하이라이팅
- 이상값 포함/제외 토글 후 차트 실시간 반영
- **컴포넌트:** `<OutlierPanel />`, `<OutlierToggle />`

### Feature 5: 요약 리포트 카드

- 전체 데이터셋 개요 (행 수, 컬럼 수, 결측값 비율)
- 수치형 컬럼 기초통계 (mean, std, min, max, 25/75 percentile)
- **컴포넌트:** `<SummaryCard />`, `<StatsTable />`

---

## 6. 컴포넌트 아키텍처

```
src/
├── components/
│   ├── upload/
│   │   ├── DropZone.tsx
│   │   └── DataPreviewTable.tsx
│   ├── charts/
│   │   ├── ChartRouter.tsx          ← 타입 감지 후 차트 분기
│   │   ├── HistogramChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── TimeSeriesChart.tsx
│   │   ├── CorrelationHeatmap.tsx
│   │   └── ScatterModal.tsx
│   ├── analysis/
│   │   ├── OutlierPanel.tsx
│   │   ├── SummaryCard.tsx
│   │   └── StatsTable.tsx
│   └── common/
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── hooks/
│   ├── useFileUpload.ts             ← 업로드 + API 호출
│   ├── useChartConfig.ts            ← 컬럼 타입 → 차트 설정 변환
│   └── useOutlierFilter.ts          ← 이상값 필터 상태 관리
├── store/
│   └── datasetStore.ts              ← Zustand
├── api/
│   └── analysisApi.ts               ← FastAPI 호출 레이어
└── types/
    └── dataset.ts                   ← 공유 타입 정의
```

---

## 7. FastAPI 엔드포인트 설계

```
POST /api/upload
  Body: multipart/form-data (file)
  Response: { columns: ColumnMeta[], preview: Row[], rowCount: number }

POST /api/analyze
  Body: { fileId: string }
  Response: {
    distributions: DistributionData[],
    correlations: CorrelationMatrix,
    outliers: OutlierResult[],
    summary: SummaryStats
  }
```

### 타입 정의 (공유)

```typescript
// types/dataset.ts

export type ColumnType = 'numeric' | 'categorical' | 'datetime' | 'text'

export interface ColumnMeta {
  name: string
  type: ColumnType
  nullCount: number
  uniqueCount: number
}

export interface DistributionData {
  column: string
  type: ColumnType
  bins?: { x: number; count: number }[]       // 숫자형
  categories?: { label: string; count: number }[] // 카테고리형
  timeseries?: { date: string; value: number }[]  // 날짜형
}

export interface CorrelationMatrix {
  columns: string[]
  matrix: number[][]
}

export interface OutlierResult {
  column: string
  count: number
  indices: number[]
  bounds: { lower: number; upper: number }
}

export interface SummaryStats {
  rowCount: number
  columnCount: number
  nullRatio: number
  numericStats: {
    column: string
    mean: number
    std: number
    min: number
    q25: number
    median: number
    q75: number
    max: number
  }[]
}
```

---

## 8. 테스트 전략

```
테스트 대상                타입         도구
──────────────────────────────────────────────────
ChartRouter.tsx           유닛         Vitest + RTL
useFileUpload.ts          훅 테스트    Vitest
useChartConfig.ts         유닛         Vitest
analysisApi.ts            모킹 테스트  Vitest (msw)
업로드 → 차트 렌더링 흐름   통합         React Testing Library
```

### GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test
      - run: npm run build
```

---

## 9. 개발 로드맵 (3주)

### Week 1 (03.25 ~ 03.31) — 기반 & 업로드

- [ ] Vite + React 19 + TypeScript 프로젝트 세팅
- [ ] Tailwind CSS, Zustand, Recharts, axios 설치
- [ ] FastAPI 프로젝트 세팅 + pandas, python-multipart 환경
- [ ] `POST /api/upload` 엔드포인트 구현 (컬럼 타입 감지 포함)
- [ ] `<DropZone />` 컴포넌트 (드래그앤드롭 + 파일 유효성 검사)
- [ ] `<DataPreviewTable />` 컴포넌트 (가상화 적용)
- [ ] `useFileUpload` 훅 구현 + Vitest 테스트
- [ ] Zustand DatasetStore 설계

### Week 2 (04.01 ~ 04.07) — 시각화 핵심

- [ ] `POST /api/analyze` 엔드포인트 구현
  - 분포 계산 (히스토그램 bins, 카테고리 카운트)
  - Pearson 상관계수 행렬
  - IQR 기반 이상값 탐지
  - 기초통계 (mean, std, min, max, percentile)
- [ ] `<ChartRouter />` 타입 분기 로직 + Vitest 테스트
- [ ] `<HistogramChart />`, `<BarChart />`, `<TimeSeriesChart />`
- [ ] `<CorrelationHeatmap />` + `<ScatterModal />`
- [ ] `<OutlierPanel />` + 토글 기능 (`useOutlierFilter` 훅)
- [ ] `<SummaryCard />` + `<StatsTable />`

### Week 3 (04.08 ~ 04.15) — 품질 & 배포

- [ ] React.memo + useMemo 성능 최적화
- [ ] react-window로 대용량 테이블 가상화
- [ ] `<ErrorBoundary />` + 에러 상태 UX
- [ ] GitHub Actions CI 파이프라인 세팅
- [ ] Vitest 통합 테스트 (업로드 → 분석 → 차트 렌더링 플로우)
- [ ] Vercel 배포 (Frontend)
- [ ] Render 배포 (FastAPI Backend)
- [ ] README 작성
  - 아키텍처 다이어그램
  - 기술 결정 이유 (Why FastAPI, Why Recharts 등)
  - 스크린샷
  - 로컬 실행 방법

---

## 10. 포트폴리오 제출 전략

### 5개 프로젝트 제출 순서

| 순서 | 프로젝트 | 강조 포인트 |
|---|---|---|
| 1 | **Focus Valley** | React 19 + TS + Vitest + Playwright — JD 필수 요건 전부 커버 |
| 2 | **DataLens** (신규) | 데이터 플랫폼 FE + FastAPI 연동 — JD 도메인 직접 매핑 |
| 3 | **DANFLIX** | Production 배포 + API 연동 + 실제 운영 |
| 4 | **ExperimentOS** | 데이터 분석 백그라운드 증명 |
| 5 | **Funnel & Retention Explorer** | DA 역량 깊이 |

### JD 커버리지 체크

| JD 요구사항 | 증명 프로젝트 |
|---|---|
| React + TypeScript | Focus Valley, DataLens, DANFLIX |
| 유닛/통합 테스트 | Focus Valley (Vitest + Playwright), DataLens (Vitest + RTL) |
| 백엔드 API 연동 | DataLens (FastAPI), DANFLIX (Supabase RPC) |
| 데이터 시각화 | DataLens, ExperimentOS, Funnel Explorer |
| 성능 최적화 | Focus Valley (Web Worker), DataLens (가상화, memo) |
| CI/CD 자동화 | DataLens (GitHub Actions) |
| 디자인 시스템 (Tailwind) | Focus Valley, DataLens, DANFLIX |

### 자기소개서 핵심 문장

> *"기존에 Python으로 데이터를 분석해왔지만, 분석 결과를 누구나 탐색할 수 있는 인터페이스가 필요하다는 것을 느꼈습니다. DataLens를 통해 FastAPI 백엔드 설계부터 React/TypeScript 컴포넌트 아키텍처, 테스트 자동화까지 직접 구축하며 데이터 플랫폼 프론트엔드 개발의 전체 흐름을 익혔습니다."*

---

## 11. Claude Code 시작 명령어

```bash
# 프론트엔드 세팅
npm create vite@latest datalens-frontend -- --template react-ts
cd datalens-frontend
npm install
npm install recharts zustand axios tailwindcss @vitejs/plugin-react
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npx tailwindcss init -p

# 백엔드 세팅
mkdir datalens-backend && cd datalens-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn pandas python-multipart numpy scipy
uvicorn main:app --reload
```

### Claude Code 첫 프롬프트 예시

```
DataLens 프로젝트를 시작합니다.
기획서의 Week 1 태스크를 순서대로 진행해주세요.

1. Vite + React 19 + TypeScript 프로젝트 세팅
2. tailwind.config.ts 설정
3. Zustand DatasetStore 구현 (types/dataset.ts 타입 포함)
4. FastAPI POST /api/upload 엔드포인트 (pandas 컬럼 타입 감지)
5. DropZone 컴포넌트 + useFileUpload 훅

CLAUDE.md에 기술 결정 이유와 아키텍처 개요를 먼저 작성해주세요.
```

---

*기획서 버전: v1.0 | 작성일: 2026.03.25*
