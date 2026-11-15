from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.operations import (
    InventoryOverviewResponse, InventoryAlertItem, InventoryForecastResponse, InventoryMovementCreate
)
from app.services.inventory import (
    get_inventory_overview, get_inventory_forecast, record_inventory_movement
)

router = APIRouter()

@router.get("/inventory", response_model=InventoryOverviewResponse, tags=["Inventory"])
def get_inventory(db: Session = Depends(get_db)):
    return get_inventory_overview(db)

@router.get("/inventory/alerts", response_model=List[InventoryAlertItem], tags=["Inventory"])
def get_alerts(db: Session = Depends(get_db)):
    overview = get_inventory_overview(db)
    return overview.alerts

@router.get("/inventory/forecast/{product_id}", response_model=InventoryForecastResponse, tags=["Inventory"])
def get_forecast(product_id: int, db: Session = Depends(get_db)):
    try:
        return get_inventory_forecast(db, product_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/inventory/movements", tags=["Inventory"])
def create_movement(data: InventoryMovementCreate, db: Session = Depends(get_db)):
    try:
        mov = record_inventory_movement(db, data)
        return {"status": "success", "movement_id": mov.id, "quantity": mov.quantity}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
