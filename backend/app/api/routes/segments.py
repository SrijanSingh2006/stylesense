from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.analytics import SegmentationResponse, SegmentCustomer
from app.services.segmentation import calculate_customer_segments
from typing import List

router = APIRouter()

@router.get("/segments", response_model=SegmentationResponse, tags=["Customer Segmentation"])
def get_segments(db: Session = Depends(get_db)):
    return calculate_customer_segments(db)

@router.get("/segments/{segment_name}", response_model=List[SegmentCustomer], tags=["Customer Segmentation"])
def get_segment_detail(segment_name: str, db: Session = Depends(get_db)):
    data = calculate_customer_segments(db)
    matching = [c for c in data.customers if c.segment.lower() == segment_name.lower()]
    if not matching:
        raise HTTPException(status_code=404, detail=f"No customers found in segment '{segment_name}'")
    return matching
