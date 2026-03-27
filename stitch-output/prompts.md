# Stitch 수동 생성 가이드

## 디자인 시스템 컨텍스트
- **Theme:** Dark mode minimalist analytics dashboard
- **Colors:** Background #0F172A, Surface #1E293B, Primary #3B82F6, CTA #F59E0B, Text #F8FAFC
- **Fonts:** Space Grotesk (headings), Archivo (body)
- **Border radius:** 12px cards, 8px buttons
- **Stack:** React 18 + TypeScript + Tailwind CSS + Recharts

---

## 화면 1 — Upload Screen

```
DataLens file upload screen — dark mode minimalist analytics platform.
Full-height centered layout with a single upload card as the focal point.

Style: Dark mode, minimalist, data analytics
Colors: background=#0F172A, surface=#1E293B, primary=#3B82F6, text=#F8FAFC, text-secondary=#94A3B8, border=#334155
Typography: heading=Space Grotesk 600, body=Archivo 400
Border radius: cards=12px

Layout:
- Top-left: "DataLens" logo text in Space Grotesk 600, #F8FAFC, with a small blue dot accent
- Subtitle below logo: "데이터 파일을 드롭하면 즉시 인사이트를 제공합니다" in #94A3B8
- Center: Large upload card (max-w-lg) with:
  - Dashed border 2px #334155, rounded-xl, bg-slate-800/50
  - Upload cloud icon (outline style, #94A3B8)
  - "CSV 또는 JSON 파일을 여기에 드래그하세요" in #F8FAFC
  - "또는" divider
  - "파일 선택" button: bg-blue-600 hover:bg-blue-700, rounded-lg, px-6 py-2
  - "최대 10MB" small text in #64748B
- Bottom: minimal footer with version text

Drag hover state preview (subtle): border becomes solid #3B82F6, bg becomes blue-500/5
```

---

## 화면 2 — Dashboard (차트 + 히트맵)

```
DataLens analytics dashboard — dark mode minimalist data exploration view.
Dense data layout showing uploaded dataset analysis results.

Style: Dark mode, minimalist, data-dense analytics
Colors: background=#0F172A, surface=#1E293B, primary=#3B82F6, secondary=#6366F1, CTA=#F59E0B, text=#F8FAFC, text-secondary=#94A3B8, border=#334155, success=#22C55E, error=#EF4444
Typography: heading=Space Grotesk 600, body=Archivo 400, data=JetBrains Mono 400
Border radius: cards=12px

Layout (top to bottom):
- Header bar: "DataLens" logo left, "새 파일 업로드" outlined button right (border-blue-500, text-blue-400)
- Summary cards row (4 cards, equal width):
  - Card 1: "행" count (large number), small label
  - Card 2: "열" count
  - Card 3: "결측값 비율" percentage
  - Card 4: "중복 행" count
  Each card: bg-slate-800, rounded-xl, p-4, number in 1.5rem Space Grotesk 600

- Data preview section:
  - Section title: "데이터 미리보기" with row count badge
  - Compact table with colored type badges in header:
    - numeric=blue badge, categorical=purple badge, datetime=green badge, text=gray badge
  - Table: bg-slate-800, header bg-slate-700/50, rows alternate slate-800/slate-850
  - Null values: italic gray "null"
  - Horizontal scroll, monospace font for data cells

- Charts grid (2 columns):
  - Left: Histogram (Recharts BarChart) for numeric column — blue bars on dark bg
  - Right: Bar chart for categorical column — horizontal bars, purple accent
  - Below: Timeseries line chart full width — blue line with gradient fill

- Correlation heatmap (full width):
  - Title: "상관관계 히트맵"
  - Color scale: blue (#3B82F6) to red (#EF4444) through neutral
  - Cell values visible, column/row labels
  - Hover: glow effect, tooltip with exact value

- Quality alerts section:
  - Alert cards: left colored border (amber for warning, blue for info)
  - Icon + column name + message
```

---

## 화면 3 — Outlier Panel

```
DataLens outlier detection panel — dark mode minimalist analysis view.
Focused panel showing IQR-based outlier analysis per column.

Style: Dark mode, minimalist, data analytics
Colors: background=#0F172A, surface=#1E293B, primary=#3B82F6, CTA=#F59E0B, text=#F8FAFC, text-secondary=#94A3B8, border=#334155, error=#EF4444, success=#22C55E
Typography: heading=Space Grotesk 600, body=Archivo 400, data=JetBrains Mono 400
Border radius: cards=12px

Layout:
- Header: "이상값 탐지" title + global toggle "이상값 제외" switch (blue when active)

- Column cards (vertical stack, one per numeric column):
  Each card (bg-slate-800, rounded-xl, p-5):
  - Top row: Column name (Space Grotesk 600) + outlier count badge (red bg if >0, green if 0)
  - IQR visualization:
    - Horizontal bar showing Q1—Q3 range in blue
    - Whiskers extending to lower/upper bounds in gray
    - Red dots for outlier positions
  - Stats row (monospace, small):
    - "하한: [value]" | "Q1: [value]" | "Q3: [value]" | "상한: [value]"
  - Per-column toggle: "이 컬럼 이상값 제외" smaller toggle

- Side effect note:
  - Small info card at bottom: "이상값을 제외하면 차트와 통계가 실시간으로 업데이트됩니다"
  - Info icon + #94A3B8 text
```

---

## 완료 후 진행
1. 위 프롬프트를 stitch.withgoogle.com 에 붙여넣고 생성
2. 각 화면 → More → Download → .zip
3. HTML 파일을 stitch-output/ 에 복사
4. /ui-flow-resume 입력
