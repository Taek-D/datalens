from __future__ import annotations

import math

import pandas as pd
from scipy import stats as scipy_stats

from schemas.analysis import SummaryStats


def _safe_float(value: object) -> float | None:
    """Convert a value to float, returning None for NaN/NA/inf."""
    try:
        f = float(value)  # type: ignore[arg-type]
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (TypeError, ValueError):
        return None


def analyze(df: pd.DataFrame) -> dict[str, SummaryStats]:
    """Compute per-column summary statistics for all numeric columns."""
    result: dict[str, SummaryStats] = {}

    numeric_cols = df.select_dtypes(include="number").columns

    for col in numeric_cols:
        series = df[col].dropna()

        if len(series) == 0:
            result[col] = SummaryStats()
            continue

        skewness = _safe_float(scipy_stats.skew(series.to_numpy()))

        result[col] = SummaryStats(
            mean=_safe_float(series.mean()),
            std=_safe_float(series.std()),
            min=_safe_float(series.min()),
            max=_safe_float(series.max()),
            q1=_safe_float(series.quantile(0.25)),
            median=_safe_float(series.median()),
            q3=_safe_float(series.quantile(0.75)),
            skewness=skewness,
        )

    return result
