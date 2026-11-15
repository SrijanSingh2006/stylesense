import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.api import api_router
from app.db.session import engine, Base
import app.db.base # Ensure all models are registered

# Schema changes are applied explicitly with `alembic upgrade head`.

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="StyleSense: AI-Powered Commerce Intelligence & Personalisation Platform API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads static folder
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

# Keep internal database details out of public API errors.
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
import logging
@app.exception_handler(SQLAlchemyError)
async def database_error(request, exc):
    logging.getLogger(__name__).error("Database request failed", exc_info=exc)
    return JSONResponse(status_code=503, content={"detail":"Database temporarily unavailable. Please retry."})
@app.exception_handler(Exception)
async def unexpected_error(request, exc):
    logging.getLogger(__name__).error("Request failed", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail":"Request could not be completed. Please retry."})
