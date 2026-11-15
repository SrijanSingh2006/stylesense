from pydantic import BaseModel
from typing import List, Optional
from app.schemas.product import ProductResponse

class RecommendationItem(BaseModel):
    product: ProductResponse
    score: float
    explanation: str

class RecommendationResponse(BaseModel):
    customer_id: Optional[int]
    strategy: str # hybrid, content_based, cold_start_popular
    items: List[RecommendationItem]

class CompleteLookResponse(BaseModel):
    primary_product: ProductResponse
    outfit_items: List[ProductResponse]
    total_outfit_price: float
    styling_notes: str
