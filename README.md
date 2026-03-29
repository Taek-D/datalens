# DataLens — Interactive Dataset Explorer

> "네이버랩스 데이터 플랫폼 팀에서 자율주행 멀티모달 데이터를 탐색할 때, Jupyter 없이도 브라우저에서 즉시 EDA를 수행할 수 있는 도구가 있다면 어떨까?"라는 질문에서 시작했습니다.

CSV/JSON 파일을 드래그앤드롭하면 자동으로 분포, 상관관계, 이상값을 탐색하는 웹 기반 EDA(탐색적 데이터 분석) 플랫폼.

**Live Demo**: [datalens-tau.vercel.app](https://datalens-tau.vercel.app/)

## 주요 기능

- **파일 업로드** — CSV/JSON 드래그앤드롭 + 자동 파싱, 10MB 제한
- **컬럼 타입 자동 감지** — 숫자 / 카테고리 / 날짜 / 텍스트 4종 분류
- **미리보기 테이블** — 첫 50행을 react-window 가상화로 즉시 렌더링
- **분포 차트** — 숫자형은 히스토그램, 카테고리형은 바차트, 날짜형은 타임시리즈 자동 선택
- **상관관계 히트맵** — Pearson 상관계수 매트릭스 + 셀 클릭 시 산점도 모달 (2,000개 다운샘플링)
- **이상값 탐지** — IQR 기반 자동 탐지 + 전체 토글로 실시간 차트 반영
- **요약 대시보드** — 행 수, 컬럼 수, 결측값 비율, 중복 행 수
- **데이터 품질 알림** — 상수 컬럼, 높은 카디널리티, 높은 null 비율, 심한 왜도 감지

## 기술 스택

| 영역 | 기술 |
|------|------|
| **프론트엔드** | React 19 + TypeScript, Vite, Zustand, Recharts, @nivo/heatmap, Tailwind CSS 4 |
| **백엔드** | FastAPI, pandas, numpy, scipy |
| **테스트** | Vitest + React Testing Library, pytest, MSW |
| **배포** | Vercel (FE) + Render (BE) |
| **CI** | GitHub Actions (PR마다 린트 + 테스트 + 빌드) |

## 아키텍처

```
[Browser] → CSV/JSON upload → [React SPA (Vercel)]
                                      │ REST API (axios)
                                      ▼
                               [FastAPI (Render)]
                                      │ pandas 처리
                                      ▼
                               [분석 결과 JSON 반환]
```

**프론트엔드 상태 관리** — Zustand 3-slice 아키텍처:
- `datasetSlice`: 원본 데이터, 컬럼 메타
- `analysisSlice`: 분석 결과 (통계, 상관, 이상값, 품질 알림)
- `uiSlice`: 상태 전이 (idle → uploading → analyzing → done), 이상값 토글

**백엔드 분석 파이프라인** — 4개 서비스가 `run_in_executor`로 병렬 처리:
- `parser_service`: 파일 파싱 + 컬럼 타입 추론
- `stats_service`: 기초통계 (mean, std, Q1~Q3, skewness)
- `correlation_service`: Pearson 상관 매트릭스
- `outlier_service`: IQR 기반 이상값 탐지

## 프로젝트 구조

```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/          # ChartRouter, Histogram, BarChart, Timeseries, Heatmap, ScatterModal
│   │   │   ├── analysis/        # SummaryCard, QualityAlerts, OutlierPanel, AnalysisView
│   │   │   └── upload/          # DropZone, DataTable
│   │   ├── hooks/               # useFileUpload, useChartData (모두 테스트 포함)
│   │   ├── store/               # Zustand 3-slice store
│   │   ├── api/                 # axios 클라이언트 + API 서비스
│   │   ├── types/               # 공유 타입 정의
│   │   └── mocks/               # MSW 핸들러
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── api/                 # upload, analyze, scatter 라우터
│   │   └── services/            # parser, stats, correlation, outlier 서비스
│   ├── tests/                   # pytest 테스트
│   └── main.py
└── .github/workflows/           # CI 파이프라인
```

## 로컬 실행

### 프론트엔드

```bash
cd frontend
pnpm install
pnpm dev          # http://localhost:5173
```

### 백엔드

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000
```

### 테스트

```bash
# 프론트엔드 (48 tests)
cd frontend && pnpm test

# 백엔드 (62 tests)
cd backend && python -m pytest
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/health` | 서버 상태 확인 |
| POST | `/api/upload` | 파일 업로드 → 컬럼 메타 + 미리보기 50행 |
| POST | `/api/analyze` | 분석 요청 → 분포/상관/이상값/요약 |
| POST | `/api/scatter` | 산점도 데이터 → 2,000개 다운샘플링 |

## 자율주행 데이터 플랫폼과의 연결

DataLens는 네이버랩스 데이터 플랫폼 팀의 업무 맥락에서 출발했습니다:

- **데모 데이터셋**: 자율주행 센서 로그 (GPS, IMU, LiDAR 타임스탬프, 카메라 프레임 수) — 실제 멀티모달 데이터 구조 반영
- **시간축 분석**: datetime 컬럼 자동 감지 → 타임시리즈 차트로 센서 수집 패턴 시각화
- **이상값 탐지**: IQR 기반 outlier 감지는 센서 오작동, GPS 드리프트, 캘리브레이션 이상 탐지에 직접 활용 가능
- **상관관계 분석**: 센서 간 상관계수 매트릭스로 멀티모달 데이터 정합성 검증 가능 (e.g., GPS 속도 vs IMU 가속도)

### 확장 가능성

| 현재 구현 | 확장 방향 |
|------|------|
| CSV/JSON 파싱 | ROS bag, HDF5, Parquet 등 자율주행 표준 포맷 지원 |
| 단일 파일 분석 | 다중 센서 시간 동기화(time-sync) 뷰어 |
| 통계 기반 이상값 | ML 기반 이상 탐지 (Isolation Forest, DBSCAN) |
| 2D 시각화 | 3D 포인트 클라우드 / 지도 오버레이 뷰어 |

## 기술적 의사결정

| 결정 | 이유 | 대안 검토 |
|------|------|------|
| **Recharts** (not D3) | React 컴포넌트 기반으로 선언적 차트 구성 가능, TS 타입 지원이 자연스러움 | D3는 저수준 제어에 강하지만 React와 DOM 관리 충돌, 러닝커브 높음 |
| **Zustand** (not Redux) | 보일러플레이트 최소, 타입 추론 우수, 3-slice로 관심사 분리 | Redux Toolkit도 고려했으나 이 규모에서는 과잉 |
| **FastAPI** (not Express) | pandas/numpy/scipy 생태계 직접 활용, 통계 분석에 Python이 자연스러움 | Express + Python microservice도 가능하지만 단일 서버가 운영 복잡도 낮음 |
| **react-window** (not react-virtuoso) | 경량 (12KB), API 단순, 테이블/리스트 가상화에 충분 | react-virtuoso는 기능이 많지만 번들 크기 3배 |
| **@nivo/heatmap** (not Recharts) | Recharts에 히트맵 차트 없음, Nivo는 D3 기반 색상 스케일과 인터랙션 내장 | ECharts도 가능하지만 React 통합이 덜 자연스러움 |
| **분석 로직을 백엔드에** | 브라우저 연산 부담 제거, 일관된 결과 보장, 대용량 데이터 시 서버 스케일링 가능 | 프론트 Web Worker도 고려했으나 pandas 생태계 활용 불가 |

## 성능 최적화

- `React.memo` + `useMemo`로 무관한 상태 변경 시 차트 리렌더링 방지
- `react-window`로 50행 이상 테이블 / 50개 이상 이상값 목록 가상화
- `asyncio.gather` + `run_in_executor`로 4개 분석 서비스 병렬 처리 + 이벤트 루프 블로킹 방지
- 산점도 데이터 서버사이드 2,000개 다운샘플링으로 브라우저 부하 감소

## 코드 품질 규칙

- `any` 타입 절대 금지 — `tsc --strict` zero-error
- 모든 커스텀 훅 테스트 필수
- Props는 반드시 `interface`로 명시
- Tailwind CSS만 사용 (인라인 style 금지, Recharts 예외)
