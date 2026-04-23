"""
FastAPI application entry point.
"""

import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.models import init_db
from app.routers import admin_router, chat_router, feedback_router, recommend_router

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Crop Recommendation System API",
    version="1.0.0",
    description=(
        "AI-powered crop recommendation API. "
        "Accepts location data and returns ranked crop suggestions "
        "based on soil and weather conditions."
    ),
)

# ─── CORS ────────────────────────────────────────────────────────────────────
# In production, ALLOWED_ORIGINS env var should list exact frontend URLs.
# e.g.  ALLOWED_ORIGINS=["https://your-app.vercel.app"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # any Vercel preview URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(recommend_router)
app.include_router(feedback_router)
app.include_router(admin_router)
app.include_router(chat_router)


# ─── Startup ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    init_db()
    _ensure_model()


def _ensure_model() -> None:
    """Train and persist the ML model if the artifact is missing."""
    artifact = Path(settings.model_artifact_path)
    if not artifact.is_absolute():
        # Resolve relative paths from the current working directory.
        # On Render, the service runs with cwd == apps/api (rootDir), and the
        # artifact is at apps/api/ml_artifacts/model.joblib.
        artifact = (Path.cwd() / artifact).resolve()

    if artifact.exists():
        logger.info("ML model found at %s — skipping training.", artifact)
        return

    logger.warning("ML model not found at %s.", artifact)
    # Avoid unexpected heavy work in memory-constrained runtimes.
    # In production, the model artifact should be shipped with the deployment.
    if os.getenv("RENDER"):
        logger.error("Auto-training skipped on Render. Using rule-based fallback.")
        return

    logger.warning("Training now (takes ~30 s) …")
    try:
        # train.py lives two levels up from apps/api
        import sys
        repo_root = Path(__file__).resolve().parents[3]
        sys.path.insert(0, str(repo_root))
        from ml.scripts.train import train
        train(save=True)
        logger.info("ML model trained and saved successfully.")
    except Exception as e:
        logger.error("Auto-training failed: %s. Rule-based fallback will be used.", e)


# ─── Health ──────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}
