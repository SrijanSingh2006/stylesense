from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.schemas.event import EventCreate, EventResponse
from app.models.event import Event

router = APIRouter()

@router.post("/events", response_model=EventResponse, tags=["Events"])
def post_event(req: EventCreate, db: Session = Depends(get_db)):
    event = Event(
        customer_id=req.customer_id,
        session_id=req.session_id,
        product_id=req.product_id,
        event_type=req.event_type,
        event_metadata=req.metadata,
        experiment_id=req.experiment_id,
        variant=req.variant,
        occurred_at=datetime.utcnow()
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
