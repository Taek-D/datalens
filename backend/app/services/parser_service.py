from __future__ import annotations

import io

import pandas as pd

from schemas.upload import ColumnMeta, ColumnType

_SUPPORTED_EXTENSIONS = {".csv", ".json"}


def detect_column_type(series: pd.Series) -> ColumnType:
    """Detect the semantic type of a pandas Series."""
    if pd.api.types.is_numeric_dtype(series):
        return ColumnType.numeric

    if pd.api.types.is_datetime64_any_dtype(series):
        return ColumnType.datetime

    # Try parsing as datetime (mixed formats)
    try:
        pd.to_datetime(series.dropna(), format="mixed")
        return ColumnType.datetime
    except (ValueError, TypeError):
        pass

    # Categorical heuristic: fewer than 50% unique values
    n = max(len(series), 1)
    if series.nunique() / n < 0.5:
        return ColumnType.categorical

    return ColumnType.text


def parse_file(contents: bytes, filename: str) -> tuple[pd.DataFrame, list[ColumnMeta]]:
    """Parse CSV or JSON file bytes into a DataFrame with column metadata.

    Raises:
        ValueError: For unsupported extensions, empty files, or DataFrames with 0 rows.
    """
    if not filename:
        raise ValueError("Filename is required to determine file type.")

    dot_index = filename.rfind(".")
    ext = filename[dot_index:].lower() if dot_index != -1 else ""

    if ext not in _SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type '{ext}'. Only CSV and JSON files are accepted."
        )

    if not contents:
        raise ValueError("File is empty.")

    if ext == ".csv":
        df = pd.read_csv(io.BytesIO(contents), low_memory=False)
    else:  # .json
        df = pd.read_json(io.BytesIO(contents))

    # Secondary type inference
    df = df.infer_objects()

    if len(df) == 0:
        raise ValueError("File contains no data rows (header-only or empty dataset).")

    columns: list[ColumnMeta] = []
    for col in df.columns:
        series = df[col]
        col_type = detect_column_type(series)
        columns.append(
            ColumnMeta(
                name=str(col),
                type=col_type,
                nullable=bool(series.isnull().any()),
                unique_count=int(series.nunique()),
            )
        )

    return df, columns
