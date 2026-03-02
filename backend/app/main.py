"""
E-commerce API main application.
FastAPI app with CORS, logging, global exception handling, and route registration.
"""
import logging
import os
import sys
import time
import traceback
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings
from .database import Base, engine
from .routers import (
    addresses_router,
    auth_router,
    delivery_router,
    orders_router,
    products_router,
)

# Console logging when run under uvicorn
if not logging.root.handlers:
    _log_handler = logging.StreamHandler(sys.stdout)
    _log_handler.setFormatter(
        logging.Formatter("%(asctime)s [%(name)s] %(levelname)s: %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    )
    logging.root.addHandler(_log_handler)
    logging.root.setLevel(logging.INFO)
logger = logging.getLogger(__name__)

# Create DB tables on startup (MySQL)
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ready (create_all ok)")
except Exception as e:
    logger.warning("Database create_all: %s", e)

app = FastAPI(title="E-commerce API", version="1.0.0")

_DEBUG = os.environ.get("DEBUG", "").lower() in ("1", "true", "yes")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Return 500 with error detail when DEBUG is set, else generic message."""
    logger.error(
        "%s %s -> 500: %s",
        request.method,
        request.url.path,
        exc,
        exc_info=True,
    )
    content = {"detail": str(exc) if _DEBUG else "Internal server error"}
    if _DEBUG:
        content["type"] = type(exc).__name__
        content["traceback"] = traceback.format_exc()
    return JSONResponse(status_code=500, content=content)


# Log every request (method, path, status, duration)
class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "%s %s -> %s (%.0f ms)",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response


# Catch any exception in middleware (e.g. CORS) so we always return JSON 500
class CatchAllMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        try:
            return await call_next(request)
        except Exception as exc:
            logger.error(
                "%s %s -> 500 (middleware): %s",
                request.method,
                request.url.path,
                exc,
                exc_info=True,
            )
            content = {"detail": str(exc) if _DEBUG else "Internal server error"}
            if _DEBUG:
                content["type"] = type(exc).__name__
                content["traceback"] = traceback.format_exc()
            return JSONResponse(status_code=500, content=content)


# CORS: allow all origins (*). With "*" we must use allow_credentials=False per CORS spec.
app.add_middleware(LoggingMiddleware)
app.add_middleware(CatchAllMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "E-commerce API", "docs": "/docs"}


app.include_router(auth_router.router)
app.include_router(products_router.router)
app.include_router(orders_router.router)
app.include_router(addresses_router.router)
app.include_router(delivery_router.router)

# Serve uploaded product images (path stored in DB as filename only)
_upload_dir = Path(__file__).resolve().parent.parent / settings.upload_dir
_upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_upload_dir)), name="uploads")
