from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.session import get_db
from app.models.feature_flag import FeatureFlag
from app.schemas.experiments import FeatureFlagCreate, FeatureFlagUpdate, FeatureFlagResponse

router = APIRouter()

@router.get("/feature-flags", response_model=List[FeatureFlagResponse], tags=["Feature Flags"])
def get_feature_flags(db: Session = Depends(get_db)):
    return db.query(FeatureFlag).order_by(FeatureFlag.id.asc()).all()

@router.post("/feature-flags", response_model=FeatureFlagResponse, tags=["Feature Flags"])
def create_feature_flag(data: FeatureFlagCreate, db: Session = Depends(get_db)):
    existing = db.query(FeatureFlag).filter(FeatureFlag.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Feature flag already exists")
    
    flag = FeatureFlag(
        name=data.name,
        description=data.description,
        enabled=data.enabled,
        rollout_percentage=data.rollout_percentage
    )
    db.add(flag)
    db.commit()
    db.refresh(flag)
    return flag

@router.patch("/feature-flags/{flag_id}", response_model=FeatureFlagResponse, tags=["Feature Flags"])
def update_feature_flag(flag_id: int, data: FeatureFlagUpdate, db: Session = Depends(get_db)):
    flag = db.query(FeatureFlag).filter(FeatureFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    
    if data.enabled is not None:
        flag.enabled = data.enabled
    if data.rollout_percentage is not None:
        flag.rollout_percentage = data.rollout_percentage
    if data.description is not None:
        flag.description = data.description
    
    flag.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(flag)
    return flag

@router.get("/feature-flags/eligibility/{customer_id}", tags=["Feature Flags"])
def eligibility(customer_id: int, db: Session = Depends(get_db)):
    from app.services.flags import feature_enabled
    from app.models.customer import Customer
    if not db.get(Customer, customer_id): raise HTTPException(404, "Customer not found")
    return {f.name:feature_enabled(db,f.name,customer_id) for f in db.query(FeatureFlag).all()}
