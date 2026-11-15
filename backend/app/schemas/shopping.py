from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime
from app.schemas.product import ProductResponse

class CartEventRequest(BaseModel):
    customer_id: Optional[int] = None
    session_id: str
    product_id: int
    action: Literal["add", "remove", "update_qty"]
    quantity: int = Field(1, strict=True, ge=1)
    selected_size: Optional[str] = "M"

class OrderItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: int = Field(strict=True, ge=1)
    quantity: int = Field(strict=True, ge=1, le=10000)
    selected_size: str = Field(min_length=1, max_length=20)

class OrderCreateRequest(BaseModel):
    address_id: int = Field(strict=True, ge=1)
    model_config = ConfigDict(extra="forbid")
    customer_id: int = Field(strict=True, ge=1)
    session_id: Optional[str] = Field(None, max_length=100)
    idempotency_key: str = Field(min_length=8, max_length=100)
    items: List[OrderItemCreate] = Field(min_length=1, max_length=100)

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    selected_size: Optional[str]

    model_config = ConfigDict(from_attributes = True)

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    session_id: Optional[str]
    total_amount: float
    status: str
    created_at: datetime
    items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes = True)
