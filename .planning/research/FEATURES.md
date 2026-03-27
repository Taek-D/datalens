# Feature Research

**Domain:** Browser-based EDA / Interactive Data Exploration Platform
**Researched:** 2026-03-27
**Confidence:** HIGH (multiple sources: ydata-profiling docs, D-Tale, Sweetviz, PyGWalker, Polymer, Rows, Observable)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that every EDA tool ships. Missing any of these makes the product feel broken or incomplete. Users do not give credit for having them, but they leave without them.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| File upload (CSV, JSON) | Entry point — tool is useless without it | LOW | Drag-and-drop is the baseline UX; file picker as fallback |
| Column type auto-detection | Users expect the tool to "understand" their data | MEDIUM | Numeric / categorical / date / text — must infer from content, not just dtype |
| Dataset overview card | Every profiling tool (ydata, sweetviz, D-Tale) shows this first | LOW | Row count, column count, missing value %, memory usage |
| Data preview table | Users need to see raw data before trusting any analysis | LOW | First 50–100 rows; virtualization required for large datasets |
| Basic summary statistics | Mean, median, std, min, max, quartiles per numeric column | LOW | Universally expected since pandas .describe() era |
| Distribution visualization | Histograms for numeric, bar charts for categorical | MEDIUM | Must be per-column; auto-selected based on type |
| Missing value analysis | Identifying nulls is step 1 of any real-world dataset | LOW | Count + % per column; ideally a visual heatmap |
| Correlation matrix / heatmap | Every profiling tool ships this; users rely on it for feature selection | MEDIUM | Pearson for numeric pairs; color-coded heat cells |
| Data quality alerts / warnings | ydata-profiling pioneered this; now it's expected | MEDIUM | Flag high-cardinality, constant columns, heavy skew, duplicates |
| Responsive / fast rendering | Users abandon slow tools immediately | MEDIUM | Perceived performance matters as much as actual speed; no full-page spinners |

### Differentiators (Competitive Advantage)

Features that are not required to feel complete, but create competitive separation and delight. DataLens should pick 2–3 to develop deeply rather than implementing all superficially.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| IQR-based outlier detection with toggle filter | Most tools show outliers statistically but don't let you interactively isolate them in the view | MEDIUM | Show outlier rows highlighted; toggle to exclude and see how stats change — this is a concrete differentiator vs static report tools |
| Scatter plot modal on correlation cell click | Observable, D-Tale do this; static-report tools (ydata, sweetviz) don't | MEDIUM | Clicking a heatmap cell drills down to the bivariate scatter — bridges overview and detail |
| Column-type-aware "best chart" selection | Removes ambiguity for non-data-scientists; competitors require manual chart selection | LOW | Histogram for continuous numeric, bar for low-cardinality categorical, line for datetime — simple rules with high user value |
| Per-column detail panel | D-Tale's "Describe" panel pattern: click a column to expand full stats + viz | LOW | Declutters the main view while keeping depth accessible on demand |
| Zero-config flow (upload → insights in < 3s) | Tableau and Power BI require data modeling; Jupyter requires code; DataLens should be instant | HIGH | This is the core value proposition — every design decision must protect this |
| Skewness / kurtosis display | Shows in ydata-profiling but not highlighted prominently in simpler tools | LOW | One extra row in the stats card; high value for data-literate users without extra complexity |
| Dataset comparison (two files) | Sweetviz's standout feature — train vs test, before vs after | HIGH | Useful but high effort; best deferred to v1.x unless timeline allows |
| Duplicate row detection and count | ydata-profiling flags this; valuable for dirty real-world data | LOW | Single metric in overview card; trivial to add but visible to experienced users |

### Anti-Features (Commonly Requested, Often Problematic)

Features that appear on every wishlist but consistently create scope creep, complexity, or architectural regret in tools of this type.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| In-browser data editing (spreadsheet-style) | D-Tale supports this; users want to fix dirty data | Turns an EDA tool into a data editor — completely different product. Requires versioning, undo/redo, conflict handling, and data persistence | Show outlier/null highlights so user fixes the source file, then re-uploads |
| User authentication + saved sessions | "I want to come back to my analysis" | Auth is a full product vertical (session management, tokens, password reset, email flows). v1 goal is portfolio proof-of-concept with no DB persistence | Use URL-safe state encoding or localStorage for lightweight session restore if needed |
| Real-time data connectors (DB, API, S3) | Users want to skip the download step | Requires credential management, connection pooling, schema introspection — weeks of work orthogonal to EDA core | Accept file upload only; add connector in v2+ after core EDA is validated |
| Natural language / AI query interface | "Ask a question about your data" | LLM integration requires API keys, cost management, latency handling, prompt engineering. Can distract from building solid statistical foundation | Provide well-labeled stats that answer common questions automatically |
| Full ETL / data transformation pipeline | Data wrangling before analysis | This is a separate product (dbt, Trifacta). Adding transforms blurs the read-only EDA contract and requires rollback/lineage logic | Document transformation steps needed, but keep DataLens read-only |
| Collaborative multi-user editing | "Share with my team" | Requires WebSocket/CRDT infrastructure, presence indicators, conflict resolution | Generate a shareable static report export (HTML/PNG) for async sharing |
| Unlimited file size support | Users have 5GB CSVs | Browser memory limits make > ~200MB files unreliable without chunked streaming and worker threads | Set a clear 50MB limit with an error message; chunked streaming is a v2 feature |

---

## Feature Dependencies

```
[File Upload + Parsing]
    └──requires──> [Column Type Detection]
                       └──requires──> [Summary Statistics]
                       └──requires──> [Distribution Charts]
                       └──requires──> [Missing Value Analysis]

[Summary Statistics] ──requires──> [Dataset Overview Card]

[Correlation Heatmap]
    └──requires──> [Column Type Detection] (numeric columns only)
    └──enhances──> [Scatter Plot Modal] (click-to-drill)

[Outlier Detection]
    └──requires──> [Summary Statistics] (IQR = Q3 - Q1 from stats)
    └──enhances──> [Distribution Charts] (outliers highlighted on histogram)

[Data Quality Alerts]
    └──requires──> [Column Type Detection]
    └──requires──> [Missing Value Analysis]
    └──requires──> [Summary Statistics]

[Per-Column Detail Panel] ──enhances──> [Distribution Charts]
[Per-Column Detail Panel] ──enhances──> [Summary Statistics]

[Data Preview Table] ──independent──> all other features (can render before analysis completes)
```

### Dependency Notes

- **File Upload requires Column Type Detection:** All downstream analysis depends on knowing what kind of data each column holds. Type detection must run before any chart or stat is shown.
- **Correlation Heatmap requires numeric columns only:** At least 2 numeric columns must exist; the heatmap should gracefully degrade (show empty state) for datasets with only categorical data.
- **Outlier Detection requires Summary Statistics:** IQR-based detection uses Q1 and Q3 computed during the summary stats pass — no extra backend call needed if stats are computed first.
- **Data Preview Table is independent:** Can render immediately after upload parse, before the analysis API call returns. This prevents perceived loading time from feeling long.
- **Scatter Plot Modal enhances Correlation Heatmap:** Optional drill-down; the heatmap must exist first. Modal is stateless (reads from already-computed data).

---

## MVP Definition

### Launch With (v1)

Minimum product to validate the core concept and demonstrate full-stack EDA capability for the portfolio.

- [x] Drag-and-drop CSV/JSON file upload with auto-parsing
- [x] Column type auto-detection (numeric / categorical / date / text)
- [x] Dataset overview card (rows, columns, missing %, duplicate count)
- [x] Data preview table — first 50 rows, virtualized
- [x] Per-type distribution charts (histogram for numeric, bar for categorical, line for datetime)
- [x] Summary statistics card per column (mean, median, std, min, max, Q1, Q3, skewness)
- [x] Missing value heatmap (column-level null visualization)
- [x] Pearson correlation heatmap for numeric columns
- [x] IQR-based outlier detection with toggle to include/exclude outlier rows
- [x] Data quality alerts (constant column, high cardinality, high null %, skewed distribution)
- [x] Scatter plot modal on correlation heatmap cell click

### Add After Validation (v1.x)

Features to add once the core EDA flow is confirmed working end-to-end.

- [ ] Per-column detail panel (click column header → full stats + viz drawer) — trigger: users need more depth without leaving the main view
- [ ] Excel/XLSX upload support — trigger: user feedback that CSV-only is limiting
- [ ] Static report export (HTML download of current analysis) — trigger: users want to share or archive results
- [ ] Duplicate row viewer (expand to see which rows are duplicates) — trigger: overview count exists but detail drill-down adds disproportionate value

### Future Consideration (v2+)

Features that require significant architectural work or are out of scope for a 3-week portfolio sprint.

- [ ] Dataset comparison (two files side-by-side, train vs test split view) — defer: high complexity, sweetviz parity takes weeks
- [ ] Chunked streaming for files > 50MB — defer: requires Web Workers + streaming parser architecture
- [ ] Time-series specific analysis (ACF, PACF, stationarity tests) — defer: niche audience, high statistical complexity
- [ ] Natural language query — defer: LLM integration out of scope for current timeline and portfolio goal

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| File upload + parsing | HIGH | LOW | P1 |
| Column type detection | HIGH | MEDIUM | P1 |
| Dataset overview card | HIGH | LOW | P1 |
| Data preview table | HIGH | LOW | P1 |
| Distribution charts | HIGH | MEDIUM | P1 |
| Summary statistics | HIGH | LOW | P1 |
| Missing value analysis | HIGH | LOW | P1 |
| Correlation heatmap | HIGH | MEDIUM | P1 |
| IQR outlier detection + toggle | HIGH | MEDIUM | P1 |
| Data quality alerts | MEDIUM | MEDIUM | P1 |
| Scatter plot modal (drill-down) | MEDIUM | LOW | P1 |
| Per-column detail panel | MEDIUM | LOW | P2 |
| Export to HTML | MEDIUM | LOW | P2 |
| Duplicate row viewer | LOW | LOW | P2 |
| Dataset comparison | HIGH | HIGH | P3 |
| Time-series analysis | MEDIUM | HIGH | P3 |
| NLP / AI query | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch — directly demonstrates core value and portfolio skills
- P2: Should have — adds polish and depth, include if timeline permits
- P3: Future consideration — substantial work with unclear portfolio ROI in 3-week window

---

## Competitor Feature Analysis

| Feature | ydata-profiling | D-Tale | Sweetviz | DataLens Approach |
|---------|----------------|--------|----------|-------------------|
| Upload interface | None (Python API) | Flask server GUI | None (Python API) | Browser-first drag-and-drop — primary differentiator |
| Data preview | No | Yes (spreadsheet) | No | Yes (read-only, virtualized) |
| Overview stats | Yes (detailed) | Yes | Yes | Yes, card-based layout |
| Type detection | Yes | Yes | Yes | Yes, auto-inferred |
| Distributions | Yes (per-column) | Yes (interactive) | Yes (compact) | Yes, auto-selected by type |
| Correlation matrix | Yes | Yes | Yes | Yes + click-to-scatter |
| Missing value viz | Yes (matrix + bar) | Yes | Yes | Yes, heatmap |
| Outlier detection | Partial (alerts) | No dedicated view | No | Yes, IQR + toggle filter — differentiator |
| Data quality alerts | Yes (extensive) | No | No | Yes (simplified subset) |
| Interactivity | Low (static HTML) | High (live edits) | Medium (hover) | Medium (filter toggles, modals) |
| No-install access | No (pip required) | No (pip required) | No (pip required) | Yes — browser-only, zero install — key advantage |
| Export | HTML / JSON | CSV / charts | HTML | PNG / summary card (v1.x) |
| Performance on large data | Poor (> 100k rows) | Moderate | Poor | Target: usable to ~50MB / ~500k rows |

---

## Sources

- [Comparing Five Most Popular EDA Tools — Towards Data Science](https://towardsdatascience.com/comparing-five-most-popular-eda-tools-dccdef05aa4c/)
- [YData Profiling (formerly pandas-profiling) — Real Python](https://realpython.com/ydata-profiling-eda/)
- [YData Profiling GitHub](https://github.com/ydataai/ydata-profiling)
- [Sweetviz vs YData vs Skyulf comparison](https://www.skyulf.com/site/guides/profiling_comparison.html)
- [D-Tale: Visualizer for pandas data structures](https://github.com/man-group/dtale)
- [D-Tale EDA features — 33rd Square](https://www.33rdsquare.com/data-exploration-dtale/)
- [PyGWalker — Kanaries GitHub](https://github.com/Kanaries/pygwalker)
- [Observable 2025 Year in Review](https://observablehq.com/blog/observable-2025-year-in-review)
- [Top 10 Data Exploration Software Features — Jaspersoft](https://www.jaspersoft.com/articles/top-10-data-exploration-software-tools)
- [EDA Tools Comparison — bitrook.com](https://www.bitrook.com/exploratory-data-analysis-comparison)
- [Rows.com EDA tools overview](https://rows.com/blog/post/exploratory-data-analysis-tools)
- [9 EDA Tools — Polymer Search](https://www.polymersearch.com/blog/exploratory-data-analysis-tools)
- [8 Automated EDA Tools — Daily Dose of Data Science](https://blog.dailydoseofds.com/p/8-automated-eda-tools-that-reduce)

---

*Feature research for: Browser-based EDA / Interactive Data Exploration Platform (DataLens)*
*Researched: 2026-03-27*
