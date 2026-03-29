"""Tests for POST /api/scatter endpoint."""
from __future__ import annotations

import pathlib

import pytest
from httpx import AsyncClient

FIXTURES = pathlib.Path(__file__).parent / "fixtures"
SAMPLE_CSV = FIXTURES / "sample.csv"


class TestScatterEndpoint:
    async def _upload_sample(self, client: AsyncClient) -> str:
        """Upload sample.csv and return the file_id."""
        with open(SAMPLE_CSV, "rb") as f:
            response = await client.post(
                "/api/upload",
                files={"file": ("sample.csv", f, "text/csv")},
            )
        assert response.status_code == 200
        return response.json()["file_id"]

    async def test_scatter_valid_returns_200(self, client: AsyncClient) -> None:
        """POST /api/scatter with valid file_id and two numeric columns returns 200."""
        file_id = await self._upload_sample(client)
        response = await client.post(
            "/api/scatter",
            json={"file_id": file_id, "col_x": "age", "col_y": "salary"},
        )
        assert response.status_code == 200

    async def test_scatter_response_shape(self, client: AsyncClient) -> None:
        """Response contains 'points' array and 'total_count' integer."""
        file_id = await self._upload_sample(client)
        response = await client.post(
            "/api/scatter",
            json={"file_id": file_id, "col_x": "age", "col_y": "salary"},
        )
        data = response.json()
        assert "points" in data
        assert "total_count" in data
        assert isinstance(data["points"], list)
        assert isinstance(data["total_count"], int)

    async def test_scatter_points_capped_at_2000(self, client: AsyncClient) -> None:
        """Points array length is at most 2000."""
        file_id = await self._upload_sample(client)
        response = await client.post(
            "/api/scatter",
            json={"file_id": file_id, "col_x": "age", "col_y": "salary"},
        )
        data = response.json()
        assert len(data["points"]) <= 2000

    async def test_scatter_points_have_x_and_y_keys(self, client: AsyncClient) -> None:
        """Each point has 'x' and 'y' numeric keys."""
        file_id = await self._upload_sample(client)
        response = await client.post(
            "/api/scatter",
            json={"file_id": file_id, "col_x": "age", "col_y": "salary"},
        )
        points = response.json()["points"]
        assert len(points) > 0
        for point in points:
            assert "x" in point
            assert "y" in point
            assert isinstance(point["x"], (int, float))
            assert isinstance(point["y"], (int, float))

    async def test_scatter_invalid_file_id_returns_404(self, client: AsyncClient) -> None:
        """Invalid file_id returns 404."""
        response = await client.post(
            "/api/scatter",
            json={"file_id": "nonexistent", "col_x": "age", "col_y": "salary"},
        )
        assert response.status_code == 404

    async def test_scatter_nonexistent_column_returns_400(self, client: AsyncClient) -> None:
        """Non-existent column name returns 400."""
        file_id = await self._upload_sample(client)
        response = await client.post(
            "/api/scatter",
            json={"file_id": file_id, "col_x": "no_such_col", "col_y": "salary"},
        )
        assert response.status_code == 400
