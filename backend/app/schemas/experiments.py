from pydantic import ConfigDict
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class ExperimentCreate(BaseModel):
    name: str
    hypothesis: str
    description: Optional[str] = None
    primary_metric: str = "conversion_rate"
    traffic_percentage: float = Field(50.0, ge=0, le=100)

class ExperimentUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(DRAFT|RUNNING|CONCLUDED|PAUSED)$")
    traffic_percentage: Optional[float] = Field(None, ge=0, le=100)
    description: Optional[str] = None

class ExperimentResponse(BaseModel):
    id: int
    name: str
    hypothesis: str
    description: Optional[str]
    primary_metric: str
    status: str
    traffic_percentage: float
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes = True)

class VariantMetrics(BaseModel):
    assigned_users: int = 0
    exposed_users: int = 0
    variant: str
    sample_size: int
    conversions: int
    conversion_rate: float
    average_order_value: float

class ExperimentResultsResponse(BaseModel):
    attribution: str = ""
    relative_lift_available: bool = True
    experiment_id: int
    name: str
    status: str
    primary_metric: str
    control: VariantMetrics
    treatment: VariantMetrics
    absolute_difference: float
    relative_lift_pct: float
    p_value: float
    z_score: float
    confidence_interval_95: List[float]
    is_statistically_significant: bool
    statistical_test: str = "Two-Proportion Z-Test (Pooled Variance)"
    sample_size_adequate: bool
    decision_recommendation: str

class FeatureFlagBase(BaseModel):
    name: str
    description: Optional[str] = None
    enabled: bool = False
    rollout_percentage: float = Field(100.0, ge=0, le=100)

class FeatureFlagCreate(FeatureFlagBase):
    pass

class FeatureFlagUpdate(BaseModel):
    enabled: Optional[bool] = None
    rollout_percentage: Optional[float] = Field(None, ge=0, le=100)
    description: Optional[str] = None

class FeatureFlagResponse(FeatureFlagBase):
    id: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes = True)
