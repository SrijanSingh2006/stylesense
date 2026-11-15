from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.operations import ReturnOverviewResponse
from app.services.returns import get_return_overview

router = APIRouter()

@router.get("/returns/overview", response_model=ReturnOverviewResponse, tags=["Returns"])
def get_overview(db: Session = Depends(get_db)):
    return get_return_overview(db)

@router.get("/returns/insights", tags=["Returns"])
def get_insights(db: Session = Depends(get_db)):
    overview = get_return_overview(db)
    return {
        "overall_return_rate": overview.overall_return_rate,
        "size_related_returns_pct": overview.size_related_returns_pct,
        "recommendations": overview.recommendations,
        "top_problematic_products": overview.top_problematic_products
    }
