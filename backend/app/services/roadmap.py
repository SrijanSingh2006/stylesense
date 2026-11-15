from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.roadmap import RoadmapTask
from app.schemas.operations import RoadmapTaskCreate, RoadmapTaskUpdate

def compute_rice_score(reach: float, impact: float, confidence_pct: float, effort: float) -> float:
    if reach < 0 or impact < 0 or not 0 <= confidence_pct <= 100 or effort <= 0:
        raise ValueError("Invalid RICE input")
    safe_effort = effort
    conf_factor = confidence_pct / 100.0
    # RICE = (Reach * Impact * Confidence) / Effort
    score = (reach * impact * conf_factor) / safe_effort
    return round(score, 1)

def get_roadmap_tasks(db: Session, status: Optional[str] = None) -> List[RoadmapTask]:
    query = db.query(RoadmapTask)
    if status:
        query = query.filter(RoadmapTask.status == status)
    return query.order_by(RoadmapTask.rice_score.desc()).all()

def create_roadmap_task(db: Session, data: RoadmapTaskCreate) -> RoadmapTask:
    score = compute_rice_score(data.reach, data.impact, data.confidence, data.effort)
    task = RoadmapTask(
        title=data.title,
        description=data.description,
        owner=data.owner,
        status=data.status,
        priority=data.priority,
        reach=data.reach,
        impact=data.impact,
        confidence=data.confidence,
        effort=data.effort,
        rice_score=score,
        due_date=data.due_date
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

def update_roadmap_task(db: Session, task_id: int, data: RoadmapTaskUpdate) -> RoadmapTask:
    task = db.query(RoadmapTask).filter(RoadmapTask.id == task_id).first()
    if not task:
        raise ValueError(f"Roadmap task {task_id} not found")

    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(task, k, v)

    # Recompute RICE score if metrics changed
    task.rice_score = compute_rice_score(task.reach, task.impact, task.confidence, task.effort)

    db.commit()
    db.refresh(task)
    return task

def delete_roadmap_task(db: Session, task_id: int) -> bool:
    task = db.query(RoadmapTask).filter(RoadmapTask.id == task_id).first()
    if not task:
        return False
    db.delete(task)
    db.commit()
    return True
