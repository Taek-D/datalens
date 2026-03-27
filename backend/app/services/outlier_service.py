from __future__ import annotations

import pandas as pd

from schemas.analysis import OutlierResult


def analyze(df: pd.DataFrame) -> list[OutlierResult]:
    """IQR-based outlier detection for each numeric column."""
    results: list[OutlierResult] = []

    numeric_cols = df.select_dtypes(include="number").columns

    for col in numeric_cols:
        series = df[col].dropna()

        if len(series) == 0:
            continue

        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        iqr = q3 - q1

        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr

        full_series = df[col]
        mask = (full_series < lower) | (full_series > upper)
        # Exclude NaN rows from the mask
        mask = mask & full_series.notna()

        outlier_indices = df.index[mask].tolist()

        results.append(
            OutlierResult(
                column=col,
                lower_bound=lower,
                upper_bound=upper,
                outlier_count=len(outlier_indices),
                outlier_indices=[int(i) for i in outlier_indices],
            )
        )

    return results
