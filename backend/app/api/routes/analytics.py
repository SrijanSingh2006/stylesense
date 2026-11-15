from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.analytics import (
    OverviewMetricsResponse, FunnelResponse, CohortResponse, ProductPerformanceItem, NorthStarResponse
)
from app.services.analytics import (
    calculate_overview_metrics, calculate_funnel, calculate_cohort_retention,
    calculate_north_star, get_product_performance
)

router = APIRouter()

@router.get("/analytics/overview", response_model=OverviewMetricsResponse, tags=["Analytics"])
def get_overview(days: int = Query(30, ge=1, le=180), db: Session = Depends(get_db)):
    return calculate_overview_metrics(db, days=days)

@router.get("/analytics/funnel", response_model=FunnelResponse, tags=["Analytics"])
def get_funnel(days: int = Query(30, ge=1, le=180), db: Session = Depends(get_db)):
    return calculate_funnel(db, days=days)

@router.get("/analytics/cohorts", response_model=CohortResponse, tags=["Analytics"])
def get_cohorts(db: Session = Depends(get_db)):
    return calculate_cohort_retention(db)

@router.get("/analytics/products", response_model=List[ProductPerformanceItem], tags=["Analytics"])
def get_products_analytics(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    return get_product_performance(db, limit=limit)

@router.get("/analytics/north-star", response_model=NorthStarResponse, tags=["Analytics"])
def get_north_star(db: Session = Depends(get_db)):
    return calculate_north_star(db)
