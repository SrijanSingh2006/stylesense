from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class SizeRequest(BaseModel):
    product_id: Optional[int] = None
    brand: Optional[str] = None
    category: Optional[str] = "Shirts"
    height_cm: float = Field(..., ge=120, le=240)
    chest_cm: float = Field(..., ge=60, le=160)
    waist_cm: float = Field(..., ge=50, le=160)
    hips_cm: Optional[float] = None
    preferred_fit: str = "Regular" # Slim, Regular, Relaxed, Oversized

class SizeResponse(BaseModel):
    recommended_size: str
    fit_category: str
    confidence_score: float # e.g. 0.88
    explanation: str
    size_chart_matched: Dict[str, str]
    alternative_sizes: List[str]
    disclaimer: str = "Heuristic transparent size recommendation based on brand-grade sizing metrics. Does not guarantee physical bespoke fit."
