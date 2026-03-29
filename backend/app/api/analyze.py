from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.upload import _datasets
from app.services import (
    correlation_service,
    outlier_service,
    quality_service,
    stats_service,
)
from schemas.analysis import AnalysisResultResponse

router = APIRouter()

_executor = ThreadPoolExecutor(max_workers=4)


class AnalyzeRequest(BaseModel):
    file_id: str


@router.post("/api/analyze", response_model=AnalysisResultResponse)
async def analyze_dataset(body: AnalyzeRequest) -> AnalysisResultResponse:
    """Run all four analysis services on a previously uploaded dataset."""
    df = _datasets.get(body.file_id)
    if df is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found. Please upload a file first.",
        )

    loop = asyncio.get_event_loop()

    # Run all four analysis services in parallel off the event loop
    stats, correlation, outliers, quality = await asyncio.gather(
        loop.run_in_executor(_executor, stats_service.analyze, df),
        loop.run_in_executor(_executor, correlation_service.analyze, df),
        loop.run_in_executor(_executor, outlier_service.analyze, df),
        loop.run_in_executor(_executor, quality_service.analyze, df),
    )

    total_cells = df.size
    missing_cells = int(df.isnull().sum().sum())
    missing_ratio = missing_cells / total_cells if total_cells > 0 else 0.0
    duplicate_count = int(df.duplicated().sum())

    return AnalysisResultResponse(
        summary=stats,
        correlation=correlation,
        outliers=outliers,
        quality_alerts=quality,
        row_count=len(df),
        column_count=len(df.columns),
        missing_ratio=missing_ratio,
        duplicate_count=duplicate_count,
    )
