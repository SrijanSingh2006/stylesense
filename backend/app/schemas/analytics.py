from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class FunnelStep(BaseModel):
    step_name: str
    stage_key: str
    count: int
    conversion_from_prev: float
    drop_off_count: int
    drop_off_rate: float
    overall_conversion: float

class FunnelResponse(BaseModel):
    total_sessions: int
    steps: List[FunnelStep]
    biggest_dropoff_stage: str
    methodology: str = "Session-based funnel aggregation from atomic event logs."

class CohortRetentionWeek(BaseModel):
    week_index: int
    retention_rate: float
    active_customers: int

class CohortRow(BaseModel):
    cohort_week: str
    cohort_size: int
    weeks: List[CohortRetentionWeek]

class CohortResponse(BaseModel):
    cohorts: List[CohortRow]
    period: str = "Last 4 Weeks"

class OverviewMetricsResponse(BaseModel):
    total_revenue: float
    average_order_value: float
    total_sessions: int
    unique_visitors: int
    total_orders: int
    conversion_rate: float
    cart_abandonment_rate: float
    return_rate: float
    repeat_customer_rate: float
    total_products_active: int

class NorthStarResponse(BaseModel):
    north_star_name: str = "Completed Purchase Sessions"
    north_star_value: int
    supporting_metrics: Dict[str, Any]
    metric_tree_description: str

class ProductPerformanceItem(BaseModel):
    product_id: int
    name: str
    category: str
    views: int
    adds_to_cart: int
    purchases: int
    conversion_rate: float
    revenue: float
    return_count: int
    return_rate: float

class SegmentCustomer(BaseModel):
    customer_id: int
    name: str
    segment: str
    recency_days: int
    frequency_orders: int
    monetary_spend: float
    actionable_strategy: str

class SegmentSummary(BaseModel):
    segment_name: str
    customer_count: int
    percentage: float
    average_spend: float
    strategy: str

class SegmentationResponse(BaseModel):
    summary: List[SegmentSummary]
    customers: List[SegmentCustomer]
