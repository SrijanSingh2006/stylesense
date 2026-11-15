from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.schemas.recommendations import RecommendationResponse, CompleteLookResponse
from app.services.recommendation import get_recommendations_for_customer, get_complete_look
from app.models.product import Product

router = APIRouter()

@router.get("/recommendations/{customer_id}", response_model=RecommendationResponse, tags=["Recommendations"])
def get_recommendations(
    customer_id: int,
    limit: int = Query(10, ge=1, le=50),
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return get_recommendations_for_customer(db, customer_id, limit=limit, category_filter=category)

@router.get("/recommendations/{customer_id}/complete-look", response_model=CompleteLookResponse, tags=["Recommendations"])
def get_look_recommendation(
    customer_id: int,
    product_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    target_id = product_id
    if not target_id:
        first_prod = db.query(Product).filter(Product.active == True).first()
        if not first_prod:
            raise HTTPException(status_code=404, detail="No active products available")
        target_id = first_prod.id

    try:
        return get_complete_look(db, target_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
