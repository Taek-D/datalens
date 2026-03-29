# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DataLens — Interactive Dataset Explorer. CSV/JSON 파일을 업로드하면 자동으로 분포, 상관관계, 이상값을 탐색하는 데이터 플랫폼.

**모노레포 구조**: 프론트엔드(`frontend/`)와 백엔드(`backend/`)가 하나의 저장소에 공존한다.

## Architecture

```
[Browser] → CSV/JSON upload → [React 19 SPA (Vercel)]
                                      │ REST API (axios)
                                      ▼
                               [FastAPI (Render)]
                                      │ pandas 처리
                                      ▼
                               [분석 결과 JSON 반환]
```

- **프론트엔드**: React 19 + TypeScript + Vite, Zustand 상태관리, Recharts 시각화, Tailwind CSS
- **백엔드**: FastAPI + pandas + numpy + scipy
- **배포**: Vercel (FE) + Render (BE)

### 기술 선택 이유

| 기술 | 이유 |
|---|---|
| **Recharts** | React 컴포넌트 기반이라 TS 타입 지원이 자연스럽고, 선언적 차트 구성 가능 |
| **Zustand** | 보일러플레이트 최소, 타입 추론 우수, 하나의 DatasetStore로 전역 상태 관리 |
| **FastAPI** | 네이버랩스 JD 명시 기술. pandas와 자연스러운 Python 생태계 활용 |
| **Vitest + RTL** | Vite 네이티브 테스트 러너. React Testing Library로 사용자 관점 테스트 |

## Development Commands

### Frontend (`frontend/`)

```bash
npm run dev          # Vite 개발 서버
npm run build        # 프로덕션 빌드
npm run test         # Vitest 전체 테스트
npx vitest run src/hooks/useFileUpload.test.ts   # 단일 테스트 파일 실행
npx vitest --watch   # 워치 모드
npm run lint         # ESLint
```

### Backend (`backend/`)

```bash
python -m venv venv
venv/Scripts/activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload    # 개발 서버 (기본 8000번)
pytest                       # 백엔드 테스트
```

## Core State Design (Zustand)

`DatasetStore`는 전체 앱의 단일 상태 소스:

```
DatasetStore
 ├── rawData: Row[]
 ├── columns: ColumnMeta[]
 ├── analysisResult: AnalysisResult | null
 └── status: 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'
```

상태 전이: `idle → uploading → analyzing → done` (실패 시 어느 단계에서든 `error`로 전환)

## API Endpoints

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/upload` | 파일 업로드 → 컬럼 메타 + 미리보기 50행 반환 |
| POST | `/api/analyze` | fileId로 분석 요청 → 분포/상관/이상값/요약 반환 |

## Key Component Patterns

- **ChartRouter**: 컬럼의 `ColumnType`(`numeric` | `categorical` | `datetime` | `text`)을 감지하여 적절한 차트 컴포넌트로 분기. 새 차트 타입 추가 시 여기에 분기 추가.
- **커스텀 훅**: 각 훅(`useFileUpload`, `useChartConfig`, `useOutlierFilter`)은 반드시 대응하는 `*.test.ts` 파일을 가진다.
- **성능**: 대용량 데이터 렌더링에 `React.memo`, `useMemo`, `react-window` 가상화 적용.

## Shared Types

프론트엔드/백엔드가 공유하는 핵심 타입은 `frontend/src/types/dataset.ts`에 정의:
- `ColumnType`, `ColumnMeta`, `DistributionData`, `CorrelationMatrix`, `OutlierResult`, `SummaryStats`

백엔드 응답 스키마는 이 타입 정의와 정확히 일치해야 한다.

## Testing Rules

- 테스트 파일명: `*.test.ts` 또는 `*.test.tsx`
- 테스트 도구: Vitest + React Testing Library (프론트), pytest (백엔드)
- API 모킹: msw(Mock Service Worker) 사용
- **모든 커스텀 훅은 테스트 필수** — 테스트 없는 훅 커밋 금지

## Strict Rules

- **`any` 타입 절대 금지** — 반드시 구체적 타입 또는 제네릭 사용
- **테스트 없는 훅 금지** — hooks/ 디렉토리의 모든 파일은 대응 테스트 필요
- **Props는 반드시 interface로 명시** — 인라인 타입 지양
- **Tailwind CSS만 사용** — 인라인 style 객체나 별도 CSS 파일 사용 금지 (예외: Recharts 내부 스타일링)
