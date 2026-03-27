from __future__ import annotations

import math

import pandas as pd
from scipy import stats as scipy_stats

from schemas.analysis import QualityAlert


def _safe_skew(series: pd.Series) -> float | None:
    """Compute skewness, returning None on failure."""
    try:
        val = float(scipy_stats.skew(series.dropna().to_numpy()))
        if math.isnan(val) or math.isinf(val):
            return None
        return val
    except Exception:
        return None


def analyze(df: pd.DataFrame) -> list[QualityAlert]:
    """Generate data quality alerts for all columns."""
    alerts: list[QualityAlert] = []
    n = max(len(df), 1)

    for col in df.columns:
        series = df[col]
        nunique = series.nunique()
        null_ratio = series.isnull().sum() / n

        # Constant column — all values identical (or all null)
        if nunique <= 1:
            alerts.append(
                QualityAlert(
                    column=col,
                    alert_type="constant",
                    message=f"Column '{col}' has only one unique value and carries no information.",
                    severity="warning",
                )
            )
            continue  # Skip further checks for constant columns

        # High null ratio
        if null_ratio > 0.5:
            alerts.append(
                QualityAlert(
                    column=col,
                    alert_type="high_null",
                    message=f"Column '{col}' has {null_ratio:.0%} missing values.",
                    severity="warning",
                )
            )

        # High cardinality (categorical columns only)
        if pd.api.types.is_object_dtype(series) or pd.api.types.is_string_dtype(series):
            if nunique / n > 0.9:
                alerts.append(
                    QualityAlert(
                        column=col,
                        alert_type="high_cardinality",
                        message=(
                            f"Column '{col}' has very high cardinality "
                            f"({nunique} unique values / {n} rows)."
                        ),
                        severity="info",
                    )
                )

        # High skewness (numeric columns only)
        if pd.api.types.is_numeric_dtype(series):
            skew = _safe_skew(series)
            if skew is not None and abs(skew) > 2:
                alerts.append(
                    QualityAlert(
                        column=col,
                        alert_type="high_skew",
                        message=f"Column '{col}' has high skewness ({skew:.2f}).",
                        severity="info",
                    )
                )

    return alerts
