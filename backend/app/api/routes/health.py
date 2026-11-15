from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health", tags=["Health"])
def get_health():
    return {
        "status": "healthy",
        "service": "StyleSense Commerce Intelligence API",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }
