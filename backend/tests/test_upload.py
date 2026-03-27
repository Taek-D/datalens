"""Integration tests for POST /api/upload and POST /api/analyze endpoints."""
from __future__ import annotations

import pathlib

import pytest
from httpx import AsyncClient

FIXTURES = pathlib.Path(__file__).parent / "fixtures"
SAMPLE_CSV = FIXTURES / "sample.csv"
SAMPLE_JSON = FIXTURES / "sample.json"


# ---------------------------------------------------------------------------
# POST /api/upload tests
# ---------------------------------------------------------------------------


class TestUploadEndpoint:
    async def test_upload_csv_returns_200(self, client: AsyncClient) -> None:
        with open(SAMPLE_CSV, "rb") as f:
            response = await client.post(
                "/api/upload",
                files={"file": ("sample.csv", f, "text/csv")},
            )
        assert response.status_code == 200

    async def test_upload_csv_response_shape(self, client: AsyncClient) -> None:
        with open(SAMPLE_CSV, "rb") as f:
            response = await client.post(
                "/api/upload",
                files={"file": ("sample.csv", f, "text/csv")},
            )
        data = response.json()
        assert "file_id" in data
        assert "columns" in data
        assert "preview" in data
        assert "row_count" in data

    async def test_upload_csv_row_count(self, client: AsyncClient) -> None:
        with open(SAMPLE_CSV, "rb") as f:
            response = await client.post(
                "/api/upload",
                files={"file": ("sample.csv", f, "text/csv")},
            )
        data = response.json()
        assert data["row_count"] == 12

    async def test_upload_csv_preview_max_50_rows(self, client: AsyncClient) -> None:
        with open(SAMPLE_CSV, "rb") as f:
            response = await client.post(
                "/api/upload",
                files={"file": ("sample.csv", f, "text/csv")},
            )
        data = response.json()
        assert len(data["preview"]) <= 50

    async def test_upload_csv_columns_have_metadata(self, client: AsyncClient) -> None:
        with open(SAMPLE_CSV, "rb") as f:
            response = await client.post(
                "/api/upload",
                files={"file": ("sample.csv", f, "text/csv")},
            )
        columns = response.json()["columns"]
        assert len(columns) == 7
        for col in columns:
            assert "name" in col
            assert "type" in col
            assert "nullable" in col
            assert "unique_count" in col

    async def test_upload_json_returns_200(self, client: AsyncClient) -> None:
        with open(SAMPLE_JSON, "rb") as f:
            response = await client.post(
                "/api/upload",
                files={"file": ("sample.json", f, "application/json")},
            )
        assert response.status_code == 200

    async def test_upload_json_response_shape(self, client: AsyncClient) -> None:
        with open(SAMPLE_JSON, "rb") as f:
            response = await client.post(
                "/api/upload",
                files={"file": ("sample.json", f, "application/json")},
            )
        data = response.json()
        assert "file_id" in data
        assert "columns" in data
        assert "preview" in data

    async def test_unsupported_file_type_returns_400(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/upload",
            files={"file": ("data.txt", b"hello world", "text/plain")},
        )
        assert response.status_code == 400

    async def test_oversized_file_returns_413(self, client: AsyncClient) -> None:
        # Create a mock 11MB payload
        large_content = b"col1,col2\n" + b"a,b\n" * (11 * 1024 * 1024 // 4)
        response = await client.post(
            "/api/upload",
            files={"file": ("big.csv", large_content, "text/csv")},
        )
        assert response.status_code == 413

    async def test_empty_csv_returns_400(self, client: AsyncClient) -> None:
        # Header-only CSV — 0 data rows
        response = await client.post(
            "/api/upload",
            files={"file": ("empty.csv", b"col1,col2\n", "text/csv")},
        )
        assert response.status_code == 400

    async def test_file_id_is_8_chars(self, client: AsyncClient) -> None:
        with open(SAMPLE_CSV, "rb") as f:
            response = await client.post(
                "/api/upload",
                files={"file": ("sample.csv", f, "text/csv")},
            )
        file_id = response.json()["file_id"]
        assert len(file_id) == 8
        assert file_id.isalnum()


# ---------------------------------------------------------------------------
# POST /api/analyze tests
# ---------------------------------------------------------------------------


class TestAnalyzeEndpoint:
    async def _upload_sample(self, client: AsyncClient) -> str:
        """Upload sample.csv and return the file_id."""
        with open(SAMPLE_CSV, "rb") as f:
            response = await client.post(
                "/api/upload",
                files={"file": ("sample.csv", f, "text/csv")},
            )
        assert response.status_code == 200
        return response.json()["file_id"]

    async def test_analyze_returns_200(self, client: AsyncClient) -> None:
        file_id = await self._upload_sample(client)
        response = await client.post("/api/analyze", json={"file_id": file_id})
        assert response.status_code == 200

    async def test_analyze_response_has_all_sections(self, client: AsyncClient) -> None:
        file_id = await self._upload_sample(client)
        response = await client.post("/api/analyze", json={"file_id": file_id})
        data = response.json()
        assert "summary" in data
        assert "correlation" in data
        assert "outliers" in data
        assert "quality_alerts" in data

    async def test_analyze_response_has_dataset_metrics(self, client: AsyncClient) -> None:
        file_id = await self._upload_sample(client)
        response = await client.post("/api/analyze", json={"file_id": file_id})
        data = response.json()
        assert "row_count" in data
        assert "column_count" in data
        assert "missing_ratio" in data
        assert "duplicate_count" in data

    async def test_analyze_row_count_matches_upload(self, client: AsyncClient) -> None:
        file_id = await self._upload_sample(client)
        response = await client.post("/api/analyze", json={"file_id": file_id})
        data = response.json()
        assert data["row_count"] == 12

    async def test_analyze_correlation_has_columns_and_values(
        self, client: AsyncClient
    ) -> None:
        file_id = await self._upload_sample(client)
        response = await client.post("/api/analyze", json={"file_id": file_id})
        corr = response.json()["correlation"]
        assert "columns" in corr
        assert "values" in corr
        assert len(corr["columns"]) == len(corr["values"])

    async def test_analyze_unknown_file_id_returns_404(self, client: AsyncClient) -> None:
        response = await client.post("/api/analyze", json={"file_id": "notexist"})
        assert response.status_code == 404

    async def test_analyze_summary_contains_numeric_columns(
        self, client: AsyncClient
    ) -> None:
        file_id = await self._upload_sample(client)
        response = await client.post("/api/analyze", json={"file_id": file_id})
        summary = response.json()["summary"]
        assert "age" in summary
        assert "salary" in summary
