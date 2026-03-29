from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.upload import _datasets

router = APIRouter()


class ScatterRequest(BaseModel):
    file_id: str
    col_x: str
    col_y: str


class ScatterResponse(BaseModel):
    points: list[dict[str, float]]
    total_count: int


@router.post("/api/scatter", response_model=ScatterResponse)
async def scatter_data(body: ScatterRequest) -> ScatterResponse:
    """Return downsampled scatter points for two numeric columns (max 2000 points)."""
    df = _datasets.get(body.file_id)
    if df is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found. Please upload a file first.",
        )

    if body.col_x not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"Column '{body.col_x}' not found in dataset.",
        )
    if body.col_y not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"Column '{body.col_y}' not found in dataset.",
        )

    # Select only the two columns and drop rows where either is null
    filtered = df[[body.col_x, body.col_y]].dropna()
    total_count = len(filtered)

    # Downsample to at most 2000 points for rendering performance
    if total_count > 2000:
        filtered = filtered.sample(n=2000, random_state=42)

    points = [
        {"x": float(row[body.col_x]), "y": float(row[body.col_y])}
        for _, row in filtered.iterrows()
    ]

    return ScatterResponse(points=points, total_count=total_count)
