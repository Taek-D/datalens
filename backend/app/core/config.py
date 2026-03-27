import os

ALLOWED_ORIGINS: list[str] = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173"  # dev default only — never hardcode prod URL
).split(",")
