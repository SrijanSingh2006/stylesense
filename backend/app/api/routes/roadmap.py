from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.schemas.operations import RoadmapTaskCreate, RoadmapTaskUpdate, RoadmapTaskResponse
from app.services.roadmap import (
    get_roadmap_tasks, create_roadmap_task, update_roadmap_task, delete_roadmap_task
)

router = APIRouter()

@router.get("/roadmap/tasks", response_model=List[RoadmapTaskResponse], tags=["Roadmap"])
def list_tasks(status: Optional[str] = None, db: Session = Depends(get_db)):
    tasks = get_roadmap_tasks(db, status=status)
    return [RoadmapTaskResponse.from_orm(t) for t in tasks]

@router.post("/roadmap/tasks", response_model=RoadmapTaskResponse, tags=["Roadmap"])
def add_task(data: RoadmapTaskCreate, db: Session = Depends(get_db)):
    task = create_roadmap_task(db, data)
    return RoadmapTaskResponse.from_orm(task)

@router.patch("/roadmap/tasks/{task_id}", response_model=RoadmapTaskResponse, tags=["Roadmap"])
def modify_task(task_id: int, data: RoadmapTaskUpdate, db: Session = Depends(get_db)):
    try:
        task = update_roadmap_task(db, task_id, data)
        return RoadmapTaskResponse.from_orm(task)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/roadmap/tasks/{task_id}", tags=["Roadmap"])
def remove_task(task_id: int, db: Session = Depends(get_db)):
    deleted = delete_roadmap_task(db, task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "deleted_task_id": task_id}
