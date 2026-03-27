"""Unit tests for all analysis services and the parser service."""
from __future__ import annotations

import pathlib

import pandas as pd
import pytest

from app.services import (
    correlation_service,
    outlier_service,
    parser_service,
    quality_service,
    stats_service,
)
from schemas.upload import ColumnType

FIXTURES = pathlib.Path(__file__).parent / "fixtures"
SAMPLE_CSV = FIXTURES / "sample.csv"
SAMPLE_JSON = FIXTURES / "sample.json"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def sample_df() -> pd.DataFrame:
    """Load sample.csv into a DataFrame once per test session."""
    df, _ = parser_service.parse_file(SAMPLE_CSV.read_bytes(), "sample.csv")
    return df


# ---------------------------------------------------------------------------
# parser_service tests
# ---------------------------------------------------------------------------


class TestParseFile:
    def test_csv_returns_dataframe_and_columns(self) -> None:
        df, columns = parser_service.parse_file(SAMPLE_CSV.read_bytes(), "sample.csv")
        assert len(df) == 12
        assert len(columns) == 7  # id, age, salary, category, created_at, description, score

    def test_json_returns_correct_shape(self) -> None:
        df, columns = parser_service.parse_file(SAMPLE_JSON.read_bytes(), "sample.json")
        assert len(df) == 12
        assert len(columns) == 7

    def test_csv_detects_numeric_column(self) -> None:
        _, columns = parser_service.parse_file(SAMPLE_CSV.read_bytes(), "sample.csv")
        col_map = {c.name: c for c in columns}
        assert col_map["age"].type == ColumnType.numeric
        assert col_map["salary"].type == ColumnType.numeric

    def test_csv_detects_categorical_column(self) -> None:
        _, columns = parser_service.parse_file(SAMPLE_CSV.read_bytes(), "sample.csv")
        col_map = {c.name: c for c in columns}
        assert col_map["category"].type == ColumnType.categorical

    def test_csv_nullable_column(self) -> None:
        _, columns = parser_service.parse_file(SAMPLE_CSV.read_bytes(), "sample.csv")
        col_map = {c.name: c for c in columns}
        assert col_map["salary"].nullable is True

    def test_csv_non_nullable_column(self) -> None:
        _, columns = parser_service.parse_file(SAMPLE_CSV.read_bytes(), "sample.csv")
        col_map = {c.name: c for c in columns}
        assert col_map["age"].nullable is False

    def test_unique_count_populated(self) -> None:
        _, columns = parser_service.parse_file(SAMPLE_CSV.read_bytes(), "sample.csv")
        col_map = {c.name: c for c in columns}
        assert col_map["category"].unique_count == 3

    def test_empty_bytes_raises(self) -> None:
        with pytest.raises(ValueError, match="empty"):
            parser_service.parse_file(b"", "sample.csv")

    def test_header_only_csv_raises(self) -> None:
        with pytest.raises(ValueError):
            parser_service.parse_file(b"col1,col2\n", "sample.csv")

    def test_unsupported_extension_raises(self) -> None:
        with pytest.raises(ValueError, match="Unsupported"):
            parser_service.parse_file(b"data", "file.txt")


class TestDetectColumnType:
    def test_numeric_series(self) -> None:
        s = pd.Series([1.0, 2.0, 3.0])
        assert parser_service.detect_column_type(s) == ColumnType.numeric

    def test_datetime_series(self) -> None:
        s = pd.to_datetime(["2023-01-01", "2023-02-01", "2023-03-01"])
        assert parser_service.detect_column_type(s) == ColumnType.datetime

    def test_categorical_series(self) -> None:
        s = pd.Series(["A", "B", "A", "C", "B", "A", "A", "B"])
        assert parser_service.detect_column_type(s) == ColumnType.categorical

    def test_text_series(self) -> None:
        # All unique strings -> text
        s = pd.Series([f"unique text item {i}" for i in range(20)])
        assert parser_service.detect_column_type(s) == ColumnType.text


# ---------------------------------------------------------------------------
# stats_service tests
# ---------------------------------------------------------------------------


class TestStatsService:
    def test_returns_entry_for_numeric_columns(self, sample_df: pd.DataFrame) -> None:
        result = stats_service.analyze(sample_df)
        assert "age" in result
        assert "salary" in result
        assert "score" in result

    def test_mean_matches_known_value(self, sample_df: pd.DataFrame) -> None:
        result = stats_service.analyze(sample_df)
        # age mean computed from fixture: (25+30+35+28+42+31+27+38+33+999+29+45)/12
        expected_mean = (25 + 30 + 35 + 28 + 42 + 31 + 27 + 38 + 33 + 999 + 29 + 45) / 12
        assert result["age"].mean is not None
        assert abs(result["age"].mean - expected_mean) < 0.01

    def test_median_matches_known_value(self, sample_df: pd.DataFrame) -> None:
        result = stats_service.analyze(sample_df)
        # score column: 1..12, median = 6.5
        assert result["score"].median is not None
        assert abs(result["score"].median - 6.5) < 0.01

    def test_all_stat_fields_present(self, sample_df: pd.DataFrame) -> None:
        result = stats_service.analyze(sample_df)
        stats = result["score"]
        assert stats.mean is not None
        assert stats.std is not None
        assert stats.min is not None
        assert stats.max is not None
        assert stats.q1 is not None
        assert stats.median is not None
        assert stats.q3 is not None

    def test_no_entry_for_non_numeric_columns(self, sample_df: pd.DataFrame) -> None:
        result = stats_service.analyze(sample_df)
        assert "category" not in result
        assert "description" not in result

    def test_nullable_column_skips_nan(self, sample_df: pd.DataFrame) -> None:
        # salary has one null — stats should still be computed on non-null values
        result = stats_service.analyze(sample_df)
        assert result["salary"].mean is not None


# ---------------------------------------------------------------------------
# correlation_service tests
# ---------------------------------------------------------------------------


class TestCorrelationService:
    def test_returns_correlation_matrix(self, sample_df: pd.DataFrame) -> None:
        result = correlation_service.analyze(sample_df)
        assert len(result.columns) > 0
        assert len(result.values) == len(result.columns)

    def test_diagonal_is_one(self, sample_df: pd.DataFrame) -> None:
        result = correlation_service.analyze(sample_df)
        for i, row in enumerate(result.values):
            assert row[i] is not None
            assert abs(row[i] - 1.0) < 1e-6  # type: ignore[operator]

    def test_matrix_is_symmetric(self, sample_df: pd.DataFrame) -> None:
        result = correlation_service.analyze(sample_df)
        for i, row in enumerate(result.values):
            for j, val in enumerate(row):
                if val is not None and result.values[j][i] is not None:
                    assert abs(val - result.values[j][i]) < 1e-6  # type: ignore[operator]

    def test_empty_matrix_for_no_numeric_columns(self) -> None:
        df = pd.DataFrame({"cat": ["A", "B", "C"]})
        result = correlation_service.analyze(df)
        assert result.columns == []
        assert result.values == []

    def test_empty_matrix_for_single_numeric_column(self) -> None:
        df = pd.DataFrame({"x": [1.0, 2.0, 3.0]})
        result = correlation_service.analyze(df)
        assert result.columns == []
        assert result.values == []


# ---------------------------------------------------------------------------
# outlier_service tests
# ---------------------------------------------------------------------------


class TestOutlierService:
    def test_known_outlier_is_flagged(self, sample_df: pd.DataFrame) -> None:
        results = outlier_service.analyze(sample_df)
        age_result = next((r for r in results if r.column == "age"), None)
        assert age_result is not None
        # Row index 9 (0-based) has age=999, which is clearly an outlier
        assert age_result.outlier_count > 0
        assert 9 in age_result.outlier_indices

    def test_outlier_bounds_are_correct_type(self, sample_df: pd.DataFrame) -> None:
        results = outlier_service.analyze(sample_df)
        for r in results:
            assert isinstance(r.lower_bound, float)
            assert isinstance(r.upper_bound, float)
            assert r.lower_bound <= r.upper_bound

    def test_returns_entry_per_numeric_column(self, sample_df: pd.DataFrame) -> None:
        results = outlier_service.analyze(sample_df)
        column_names = {r.column for r in results}
        assert "age" in column_names
        assert "score" in column_names

    def test_outlier_indices_are_ints(self, sample_df: pd.DataFrame) -> None:
        results = outlier_service.analyze(sample_df)
        for r in results:
            for idx in r.outlier_indices:
                assert isinstance(idx, int)


# ---------------------------------------------------------------------------
# quality_service tests
# ---------------------------------------------------------------------------


class TestQualityService:
    def test_returns_list(self, sample_df: pd.DataFrame) -> None:
        alerts = quality_service.analyze(sample_df)
        assert isinstance(alerts, list)

    def test_constant_column_triggers_warning(self) -> None:
        df = pd.DataFrame({"x": [1, 1, 1, 1], "y": [1.0, 2.0, 3.0, 4.0]})
        alerts = quality_service.analyze(df)
        constant_alerts = [a for a in alerts if a.alert_type == "constant"]
        assert len(constant_alerts) == 1
        assert constant_alerts[0].column == "x"
        assert constant_alerts[0].severity == "warning"

    def test_high_null_triggers_warning(self) -> None:
        df = pd.DataFrame({"x": [1.0, None, None, None, None, None, 2.0, None, None, None]})
        alerts = quality_service.analyze(df)
        null_alerts = [a for a in alerts if a.alert_type == "high_null"]
        assert len(null_alerts) == 1
        assert null_alerts[0].severity == "warning"

    def test_high_skew_triggers_info(self) -> None:
        # Create a strongly skewed column
        values = [1.0] * 90 + [1000.0] * 10
        df = pd.DataFrame({"skewed": values})
        alerts = quality_service.analyze(df)
        skew_alerts = [a for a in alerts if a.alert_type == "high_skew"]
        assert len(skew_alerts) == 1
        assert skew_alerts[0].severity == "info"

    def test_high_cardinality_triggers_info(self) -> None:
        # All unique strings -> high cardinality
        df = pd.DataFrame({"names": [f"person_{i}" for i in range(100)]})
        alerts = quality_service.analyze(df)
        card_alerts = [a for a in alerts if a.alert_type == "high_cardinality"]
        assert len(card_alerts) == 1
        assert card_alerts[0].severity == "info"

    def test_no_alerts_for_clean_data(self) -> None:
        df = pd.DataFrame(
            {
                "normal": [1.0, 2.0, 3.0, 2.5, 1.8, 2.2, 2.7, 1.9, 2.1, 2.4],
                "cat": ["A", "B", "C", "A", "B", "C", "A", "B", "C", "A"],
            }
        )
        alerts = quality_service.analyze(df)
        assert len(alerts) == 0
