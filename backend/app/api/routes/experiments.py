from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.session import get_db
from app.models.experiment import Experiment
from app.schemas.experiments import (
    ExperimentCreate, ExperimentUpdate, ExperimentResponse, ExperimentResultsResponse
)
from app.services.experimentation import assign_customer_variant, calculate_experiment_results

router = APIRouter()

@router.get("/experiments", response_model=List[ExperimentResponse], tags=["Experiments"])
def list_experiments(db: Session = Depends(get_db)):
    return db.query(Experiment).order_by(Experiment.created_at.desc()).all()

@router.post("/experiments", response_model=ExperimentResponse, tags=["Experiments"])
def create_experiment(data: ExperimentCreate, db: Session = Depends(get_db)):
    existing = db.query(Experiment).filter(Experiment.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Experiment with this name already exists")
    
    exp = Experiment(
        name=data.name,
        hypothesis=data.hypothesis,
        description=data.description,
        primary_metric=data.primary_metric,
        traffic_percentage=data.traffic_percentage,
        status="DRAFT",
        created_at=datetime.utcnow()
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp

@router.get("/experiments/{experiment_id}", response_model=ExperimentResponse, tags=["Experiments"])
def get_experiment(experiment_id: int, db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return exp

@router.patch("/experiments/{experiment_id}", response_model=ExperimentResponse, tags=["Experiments"])
def update_experiment(experiment_id: int, data: ExperimentUpdate, db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    if data.status is not None:
        if exp.status == "CONCLUDED" and data.status != "CONCLUDED":
            raise HTTPException(409, "Concluded experiments cannot be restarted")
        exp.status = data.status
        if data.status == "RUNNING":
            if not exp.start_date: exp.start_date = datetime.utcnow()
            exp.end_date = None
        elif data.status in ["CONCLUDED", "PAUSED"] and not exp.end_date:
            exp.end_date = datetime.utcnow()

    if data.traffic_percentage is not None:
        exp.traffic_percentage = data.traffic_percentage
    if data.description is not None:
        exp.description = data.description

    db.commit()
    db.refresh(exp)
    return exp

@router.post("/experiments/{experiment_id}/assign", tags=["Experiments"])
def assign_variant(experiment_id: int, customer_id: int = Query(...), db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    variant = assign_customer_variant(db, experiment_id, customer_id)
    return {"experiment_id": experiment_id, "customer_id": customer_id, "variant": variant}

@router.get("/experiments/{experiment_id}/results", response_model=ExperimentResultsResponse, tags=["Experiments"])
def get_results(experiment_id: int, db: Session = Depends(get_db)):
    try:
        return calculate_experiment_results(db, experiment_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
