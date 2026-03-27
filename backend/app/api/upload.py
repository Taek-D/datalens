from __future__ import annotations

import uuid

import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile

from app.services import parser_service
from schemas.upload import UploadResponse

router = APIRouter()

# In-memory dataset store: file_id -> DataFrame
# NOTE: This is intentionally module-level so analyze.py can import and access it.
_datasets: dict[str, pd.DataFrame] = {}

_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
_ALLOWED_EXTENSIONS = {".csv", ".json"}


@router.post("/api/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile) -> UploadResponse:
    """Accept a CSV or JSON file, parse it, and return column metadata + 50-row preview."""
    contents = await file.read()

    # Size check
    if len(contents) > _MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds 10MB limit")

    # Extension check
    filename = file.filename or ""
    dot_index = filename.rfind(".")
    ext = filename[dot_index:].lower() if dot_index != -1 else ""

    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Only .csv and .json files are accepted.",
        )

    # Parse file
    try:
        df, columns = parser_service.parse_file(contents, filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Store dataset
    file_id = uuid.uuid4().hex[:8]
    _datasets[file_id] = df

    # Build preview — convert NaN/NA to None for JSON serialisation
    preview_records = df.head(50).where(df.head(50).notna(), other=None).to_dict(
        orient="records"
    )

    return UploadResponse(
        file_id=file_id,
        columns=columns,
        preview=preview_records,
        row_count=len(df),
    )
