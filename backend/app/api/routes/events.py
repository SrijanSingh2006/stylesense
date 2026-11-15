from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.schemas.event import EventCreate, EventResponse
from app.models.event import Event
from sqlalchemy.exc import IntegrityError

router = APIRouter()

@router.post("/events", response_model=EventResponse, tags=["Events"])
def post_event(req: EventCreate, db: Session = Depends(get_db)):
    from app.models.customer import Customer
    from app.models.product import Product
    from app.models.experiment import ExperimentAssignment, Experiment
    if req.customer_id and not db.get(Customer, req.customer_id): raise HTTPException(404, "Customer not found")
    if req.product_id and not db.get(Product, req.product_id): raise HTTPException(404, "Product not found")
    if req.experiment_id is not None:
        assignment = db.query(ExperimentAssignment).filter_by(experiment_id=req.experiment_id, customer_id=req.customer_id).first()
        exp = db.get(Experiment, req.experiment_id)
        now = datetime.utcnow()
        if not exp or not assignment: raise HTTPException(409, "Assign customer before recording experiment events")
        if req.variant != assignment.variant: raise HTTPException(409, "Variant does not match persisted assignment")
        if exp.status != "RUNNING" or (exp.end_date and now > exp.end_date) or (exp.start_date and now < exp.start_date):
            raise HTTPException(409, "Experiment observation window is closed")
    elif req.variant is not None or req.event_type == "experiment_exposure":
        raise HTTPException(422, "Experiment and assigned variant are required")
    if req.event_key:
        existing = db.query(Event).filter_by(event_key=req.event_key).first()
        if existing:
            if (existing.customer_id,existing.session_id,existing.event_type,existing.product_id,existing.experiment_id,existing.variant) != (req.customer_id,req.session_id,req.event_type,req.product_id,req.experiment_id,req.variant):
                raise HTTPException(409, "Event key already used for different data")
            return existing
    event = Event(
        event_key=req.event_key,
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
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.query(Event).filter_by(event_key=req.event_key).first() if req.event_key else None
        if existing and (existing.customer_id, existing.session_id, existing.event_type, existing.product_id, existing.experiment_id, existing.variant) == (req.customer_id, req.session_id, req.event_type, req.product_id, req.experiment_id, req.variant):
            return existing
        raise HTTPException(409, "Event conflicts with stored data")
    db.refresh(event)
    return event
