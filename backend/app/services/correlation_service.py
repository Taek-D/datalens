from __future__ import annotations

import math

import pandas as pd

from schemas.analysis import CorrelationMatrix


def _nan_to_none(value: float) -> float | None:
    """Return None if value is NaN or infinite, otherwise return the float."""
    if math.isnan(value) or math.isinf(value):
        return None
    return value


def analyze(df: pd.DataFrame) -> CorrelationMatrix:
    """Compute Pearson correlation matrix for all numeric columns.

    Returns an empty matrix when fewer than 2 numeric columns are present.
    """
    numeric_df = df.select_dtypes(include="number")

    if numeric_df.shape[1] < 2:
        return CorrelationMatrix(columns=[], values=[])

    corr = numeric_df.corr(method="pearson")
    columns = list(corr.columns)

    values: list[list[float | None]] = []
    for row_label in corr.index:
        row: list[float | None] = []
        for col_label in corr.columns:
            row.append(_nan_to_none(float(corr.loc[row_label, col_label])))
        values.append(row)

    return CorrelationMatrix(columns=columns, values=values)
