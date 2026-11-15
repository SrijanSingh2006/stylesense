from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.operations import ReleaseCreate, ReleaseUpdate, ReleaseResponse
from app.services.release import get_releases, create_release, update_release

router = APIRouter()

@router.get("/releases", response_model=List[ReleaseResponse], tags=["Releases"])
def list_releases(db: Session = Depends(get_db)):
    releases = get_releases(db)
    return [ReleaseResponse.model_validate(r) for r in releases]

@router.post("/releases", response_model=ReleaseResponse, tags=["Releases"])
def add_release(data: ReleaseCreate, db: Session = Depends(get_db)):
    rel = create_release(db, data)
    return ReleaseResponse.model_validate(rel)

@router.patch("/releases/{release_id}", response_model=ReleaseResponse, tags=["Releases"])
def modify_release(release_id: int, data: ReleaseUpdate, db: Session = Depends(get_db)):
    try:
        rel = update_release(db, release_id, data)
        return ReleaseResponse.model_validate(rel)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
