from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.operations import PromotionSimulateRequest, PromotionSimulateResponse
from app.services.pricing import simulate_promotion

router = APIRouter()

@router.post("/promotions/simulate", response_model=PromotionSimulateResponse, tags=["Pricing & Promotions"])
def post_simulation(req: PromotionSimulateRequest, db: Session = Depends(get_db)):
    try:
        return simulate_promotion(db, req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
