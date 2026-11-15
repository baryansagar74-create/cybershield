"""
ProfileGuard — Fake Social Media Account Detection & Takedown Framework
========================================================================

FastAPI application entrypoint.
Developed for Indo-Tibetan Border Police (ITBP, MHA) 2024 problem statement.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv

# Ensure environment variables are loaded from .env
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.audit_routes import router as audit_router
from app.api.auth_routes import router as auth_router
from app.api.case_routes import router as case_router
from app.api.dashboard_routes import router as dashboard_router
from app.api.report_routes import router as report_router
from app.api.scan_routes import router as scan_router
from app.config import settings
from app.database import Base, engine

logging.basicConfig(
    level=logging.INFO if settings.is_production else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("profileguard")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ProfileGuard (Env: %s)", settings.app_env)
    # Ensure tables exist in dev environment
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schemas verified.")
    except Exception as e:
        logger.warning("Auto-migration check skipped or failed (production uses Alembic): %s", e)
    yield
    logger.info("Shutting down ProfileGuard.")


app = FastAPI(
    title="ProfileGuard API",
    description=(
        "Fake social media account detection, reporting and takedown framework "
        "for the Indo-Tibetan Border Police (ITBP, MHA). "
        "Provides multi-signal risk scoring, I4C Sahyog / Section 79(3)(b) notice generation, "
        "SLA monitoring under IT Rules 2026, and cryptographic hash-chained audit trails."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration for Analyst Dashboard and Extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.dashboard_url,
        "http://localhost:3000",
        "chrome-extension://*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router)
app.include_router(scan_router)
app.include_router(case_router)
app.include_router(report_router)
app.include_router(audit_router)
app.include_router(dashboard_router)

# Mount static asset routes
_ROOT_DIR = Path(__file__).resolve().parent.parent
_ASSETS_DIR = _ROOT_DIR / "assets"
_STATIC_DIR = _ROOT_DIR / "app" / "static"

if _ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(_ASSETS_DIR)), name="assets")

if _STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(_STATIC_DIR)), name="static")


@app.get("/", response_class=FileResponse, tags=["Dashboard"])
def serve_dashboard():
    """Serve the ProfileGuard interactive analyst console."""
    index_file = _STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "ProfileGuard API is running. Visit /docs for OpenAPI console."}


@app.get("/health", tags=["System"])
def health_check():
    """System health and readiness check."""
    return {
        "status": "healthy",
        "service": "ProfileGuard",
        "version": "1.0.0",
        "environment": settings.app_env,
    }
