from enum import Enum
from pydantic import BaseModel


class ColumnType(str, Enum):
    numeric = "numeric"
    categorical = "categorical"
    datetime = "datetime"
    text = "text"


class ColumnMeta(BaseModel):
    name: str
    type: ColumnType
    nullable: bool
    unique_count: int


class UploadResponse(BaseModel):
    columns: list[ColumnMeta]
    preview: list[dict]    # first 50 rows — typed further in Phase 2
    row_count: int
