from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router as health_router
from app.api.upload import router as upload_router
from app.api.analyze import router as analyze_router
from app.api.scatter import router as scatter_router
from app.core.config import ALLOWED_ORIGINS

app = FastAPI(title="DataLens API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,  # No auth in v1 — keep False
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(upload_router)
app.include_router(analyze_router)
app.include_router(scatter_router)
