from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.release import Release
from app.schemas.operations import ReleaseCreate, ReleaseUpdate

DEFAULT_CHECKLIST = {
    "engineering_completed": True,
    "design_approved": True,
    "qa_testing_passed": False,
    "analytics_instrumented": True,
    "documentation_ready": True,
    "stakeholder_signoff": False,
    "release_notes_published": False,
}

def calculate_readiness(checklist: Dict[str, bool]) -> int:
    if not checklist:
        return 0
    completed = sum(1 for v in checklist.values() if v is True)
    total = len(checklist)
    return int((completed / total) * 100)

def get_releases(db: Session) -> List[Release]:
    return db.query(Release).order_by(Release.created_at.desc()).all()

def create_release(db: Session, data: ReleaseCreate) -> Release:
    cl = data.checklist if data.checklist else DEFAULT_CHECKLIST.copy()
    pct = calculate_readiness(cl)
    rel = Release(
        version=data.version,
        name=data.name,
        target_date=data.target_date,
        release_notes=data.release_notes,
        checklist=cl,
        readiness_percentage=pct,
        status="IN_PREPARATION"
    )
    db.add(rel)
    db.commit()
    db.refresh(rel)
    return rel

def update_release(db: Session, release_id: int, data: ReleaseUpdate) -> Release:
    rel = db.query(Release).filter(Release.id == release_id).first()
    if not rel:
        raise ValueError(f"Release {release_id} not found")

    if data.checklist is not None:
        merged = dict(rel.checklist or {})
        merged.update(data.checklist)
        rel.checklist = merged
        rel.readiness_percentage = calculate_readiness(merged)

    if data.name is not None:
        rel.name = data.name
    if data.target_date is not None:
        rel.target_date = data.target_date
    if data.release_notes is not None:
        rel.release_notes = data.release_notes

    if data.status is not None:
        # Enforce gate: cannot mark as READY_FOR_DEPLOY or DEPLOYED if mandatory items fail
        if data.status in ["READY_FOR_DEPLOY", "DEPLOYED"]:
            cl = rel.checklist or {}
            mandatory = ["engineering_completed", "qa_testing_passed", "analytics_instrumented", "documentation_ready", "stakeholder_signoff"]
            missing = [m for m in mandatory if not cl.get(m, False)]
            if missing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot approve release: Mandatory checklist items incomplete: {', '.join(missing)}"
                )
        rel.status = data.status

    db.commit()
    db.refresh(rel)
    return rel
