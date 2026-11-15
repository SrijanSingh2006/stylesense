from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.session import get_db
from app.models.feedback import Feedback
from app.schemas.operations import FeedbackCreate, FeedbackUpdate, FeedbackResponse

router = APIRouter()

@router.get("/feedback", response_model=List[FeedbackResponse], tags=["Feedback"])
def list_feedback(db: Session = Depends(get_db)):
    items = db.query(Feedback).order_by(Feedback.created_at.desc()).all()
    return [FeedbackResponse.model_validate(f) for f in items]

@router.post("/feedback", response_model=FeedbackResponse, tags=["Feedback"])
def add_feedback(data: FeedbackCreate, db: Session = Depends(get_db)):
    sentiment = "POSITIVE" if data.rating >= 4.0 else ("NEUTRAL" if data.rating == 3.0 else "NEGATIVE")
    fb = Feedback(
        customer_id=data.customer_id,
        product_id=data.product_id,
        feedback_type=data.feedback_type,
        rating=data.rating,
        comment=data.comment,
        source=data.source,
        priority=data.priority,
        sentiment=sentiment,
        status="NEW",
        created_at=datetime.utcnow()
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return FeedbackResponse.model_validate(fb)

@router.patch("/feedback/{feedback_id}", response_model=FeedbackResponse, tags=["Feedback"])
def modify_feedback(feedback_id: int, data: FeedbackUpdate, db: Session = Depends(get_db)):
    fb = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    if data.status is not None:
        fb.status = data.status
    if data.owner is not None:
        fb.owner = data.owner
    if data.priority is not None:
        fb.priority = data.priority

    db.commit()
    db.refresh(fb)
    return FeedbackResponse.model_validate(fb)
