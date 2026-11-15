from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.operations import (
    CatalogueQualityResponse, CatalogueIssueResponse, CatalogueIssueUpdate
)
from app.services.catalogue import audit_catalogue, resolve_issue

router = APIRouter()

@router.get("/catalogue/quality", response_model=CatalogueQualityResponse, tags=["Catalogue"])
def get_quality(db: Session = Depends(get_db)):
    return audit_catalogue(db)

@router.get("/catalogue/issues", response_model=List[CatalogueIssueResponse], tags=["Catalogue"])
def get_issues(db: Session = Depends(get_db)):
    audit = audit_catalogue(db)
    return audit.issues

@router.patch("/catalogue/issues/{issue_id}", response_model=CatalogueIssueResponse, tags=["Catalogue"])
def patch_issue(issue_id: int, data: CatalogueIssueUpdate, db: Session = Depends(get_db)):
    try:
        resolved = resolve_issue(db, issue_id)
        return CatalogueIssueResponse.from_orm(resolved)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
