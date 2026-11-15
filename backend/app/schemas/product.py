from pydantic import ConfigDict
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ProductBase(BaseModel):
    sku: str
    name: str
    brand: str
    category: str
    subcategory: Optional[str] = None
    description: Optional[str] = None
    colour: str
    dominant_colour: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    sizes_available: List[str] = []
    size_chart: Dict[str, Any] = {}
    fit_type: Optional[str] = "Regular"
    material: Optional[str] = "Cotton"
    occasion: Optional[str] = "Casual"
    tags: List[str] = []
    rating: float = 4.2
    review_count: int = 0
    stock_quantity: int = 50
    reorder_point: int = 15
    image_url: Optional[str] = None
    active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes = True)

class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    limit: int
    pages: int
