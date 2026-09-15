"""
DroneCare API entry point.

Phase 1 added the application skeleton, configuration, routing structure,
CORS, and a health-check endpoint. Phase 2 adds database access and
authentication (see app/api/v1/auth.py). Phase 6 adds ANN model integration
(see app/services/ml_service.py).
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.services import ml_service

# INFO-level logging is required for app.services.auth_service's provisional
# dev-only password-reset-token log line to be visible; uvicorn's own access
# logs are unaffected either way (they use their own configured loggers).
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Warm the ANN model/scaler/encoders at startup so a broken artifact
    # path fails loudly in the logs immediately, rather than silently on
    # whichever user's request happens to trigger the first prediction.
    # Deliberately non-fatal: the rest of the API (auth, drones, flights)
    # has no dependency on the ML layer and must stay usable even if it's
    # unavailable — /predictions will surface ServiceUnavailableError (503)
    # on demand instead.
    try:
        ml_service.get_ml_assets()
        logger.info("ML assets loaded successfully (model_version=%s).", ml_service.get_model_version())
    except Exception:
        logger.exception("Failed to load ML assets at startup; /predictions will be unavailable.")
    yield


settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="AI-powered drone fleet health & maintenance platform API.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
    return {"message": f"{settings.APP_NAME} is running."}
