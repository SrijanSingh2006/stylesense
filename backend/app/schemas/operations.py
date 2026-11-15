from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Inventory
class InventoryMovementCreate(BaseModel):
    product_id: int
    movement_type: str # PURCHASE, RESTOCK, RETURN, ADJUSTMENT
    quantity: int
    reference: Optional[str] = None

class InventoryAlertItem(BaseModel):
    product_id: int
    name: str
    category: str
    current_stock: int
    reorder_point: int
    status: str # OUT_OF_STOCK, CRITICAL_LOW, LOW, HEALTHY
    stock_coverage_days: float
    recommended_reorder_qty: int

class InventoryForecastResponse(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    daily_run_rate_units: float
    days_until_stockout: float
    reorder_threshold: int
    status: str
    recommended_po_quantity: int
    historical_weekly_sales: List[int]

class InventoryOverviewResponse(BaseModel):
    total_skus: int
    total_inventory_units: int
    total_inventory_valuation: float
    out_of_stock_count: int
    low_stock_count: int
    inventory_turnover_ratio: float
    alerts: List[InventoryAlertItem]

# Returns
class ReturnReasonBreakdown(BaseModel):
    reason: str
    count: int
    percentage: float

class CategoryReturnItem(BaseModel):
    category: str
    total_orders: int
    returned_orders: int
    return_rate: float
    primary_reason: str

class ReturnOverviewResponse(BaseModel):
    total_orders: int
    total_returns: int
    overall_return_rate: float
    size_related_returns_pct: float
    reasons: List[ReturnReasonBreakdown]
    category_breakdown: List[CategoryReturnItem]
    top_problematic_products: List[Dict[str, Any]]
    recommendations: List[str]

# Catalogue
class CatalogueIssueResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    issue_type: str
    severity: str
    description: str
    suggested_action: Optional[str]
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CatalogueIssueUpdate(BaseModel):
    is_resolved: bool

class CatalogueQualityResponse(BaseModel):
    total_products_checked: int
    catalogue_health_score: float # 0 - 100
    critical_issues_count: int
    warning_issues_count: int
    issues_by_type: Dict[str, int]
    issues: List[CatalogueIssueResponse]

# Pricing / Promotion Simulator
class PromotionSimulateRequest(BaseModel):
    product_id: int
    discount_percentage: float = Field(..., ge=0, le=90)
    price_elasticity: float = Field(-1.8, description="Estimated price elasticity of demand (e.g. -1.5 to -2.5)")
    estimated_cost_per_unit: Optional[float] = None

class PromotionSimulateResponse(BaseModel):
    product_id: int
    product_name: str
    baseline_price: float
    baseline_units_per_month: int
    baseline_revenue: float
    baseline_gross_margin_pct: float
    discount_percentage: float
    scenario_selling_price: float
    scenario_estimated_units: int
    scenario_projected_revenue: float
    scenario_projected_gross_profit: float
    scenario_gross_margin_pct: float
    revenue_delta_pct: float
    profit_delta_pct: float
    elasticity_applied: float
    assumptions_notice: str = "Estimated demand elasticity simulation. Results reflect modeled consumer sensitivity, not guaranteed sales."

# Roadmap
class RoadmapTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    owner: str = "Storefront PM"
    status: str = "BACKLOG"
    priority: str = "MEDIUM"
    reach: float = 1000.0
    impact: float = 2.0
    confidence: float = 80.0
    effort: float = 4.0
    due_date: Optional[datetime] = None

class RoadmapTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    owner: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    reach: Optional[float] = None
    impact: Optional[float] = None
    confidence: Optional[float] = None
    effort: Optional[float] = None
    due_date: Optional[datetime] = None

class RoadmapTaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    owner: str
    status: str
    priority: str
    reach: float
    impact: float
    confidence: float
    effort: float
    rice_score: float
    due_date: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

# Release Readiness
class ReleaseCreate(BaseModel):
    version: str
    name: str
    target_date: Optional[datetime] = None
    release_notes: Optional[str] = None
    checklist: Dict[str, bool] = Field(default_factory=dict)

class ReleaseUpdate(BaseModel):
    name: Optional[str] = None
    target_date: Optional[datetime] = None
    status: Optional[str] = None
    checklist: Optional[Dict[str, bool]] = None
    release_notes: Optional[str] = None

class ReleaseResponse(BaseModel):
    id: int
    version: str
    name: str
    target_date: Optional[datetime]
    status: str
    readiness_percentage: int
    checklist: Dict[str, bool]
    release_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Feedback
class FeedbackCreate(BaseModel):
    customer_id: Optional[int] = None
    product_id: Optional[int] = None
    feedback_type: str = "FIT_ISSUE"
    rating: float = 4.0
    comment: str
    source: str = "Storefront Review"
    priority: str = "MEDIUM"

class FeedbackUpdate(BaseModel):
    status: Optional[str] = None
    owner: Optional[str] = None
    priority: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    customer_id: Optional[int]
    product_id: Optional[int]
    feedback_type: str
    rating: float
    comment: Optional[str]
    source: str
    owner: str
    priority: str
    sentiment: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
