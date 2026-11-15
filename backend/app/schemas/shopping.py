from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.product import ProductResponse

class CartEventRequest(BaseModel):
    customer_id: Optional[int] = None
    session_id: str
    product_id: int
    action: str # "add", "remove", "update_qty"
    quantity: int = 1
    selected_size: Optional[str] = "M"

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = 1
    selected_size: Optional[str] = "M"

class OrderCreateRequest(BaseModel):
    customer_id: int
    session_id: Optional[str] = None
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    selected_size: Optional[str]

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    session_id: Optional[str]
    total_amount: float
    status: str
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True
