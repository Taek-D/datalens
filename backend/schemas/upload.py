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
    file_id: str
    columns: list[ColumnMeta]
    preview: list[dict]    # first 50 rows
    row_count: int
