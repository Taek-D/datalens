from __future__ import annotations

from pydantic import BaseModel


class SummaryStats(BaseModel):
    mean: float | None = None
    std: float | None = None
    min: float | None = None
    max: float | None = None
    q1: float | None = None
    median: float | None = None
    q3: float | None = None
    skewness: float | None = None


class CorrelationMatrix(BaseModel):
    columns: list[str]
    values: list[list[float | None]]


class OutlierResult(BaseModel):
    column: str
    lower_bound: float
    upper_bound: float
    outlier_count: int
    outlier_indices: list[int]


class QualityAlert(BaseModel):
    column: str
    alert_type: str  # "constant" | "high_cardinality" | "high_null" | "high_skew"
    message: str
    severity: str  # "warning" | "info"


class AnalysisResultResponse(BaseModel):
    summary: dict[str, SummaryStats]
    correlation: CorrelationMatrix
    outliers: list[OutlierResult]
    quality_alerts: list[QualityAlert]
    row_count: int
    column_count: int
    missing_ratio: float
    duplicate_count: int
