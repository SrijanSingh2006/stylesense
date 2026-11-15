from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class EventCreate(BaseModel):
    customer_id: Optional[int] = None
    session_id: str
    product_id: Optional[int] = None
    event_type: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    experiment_id: Optional[int] = None
    variant: Optional[str] = None

class EventResponse(BaseModel):
    id: int
    customer_id: Optional[int]
    session_id: str
    product_id: Optional[int]
    event_type: str
    metadata: Dict[str, Any] = Field(default_factory=dict, alias="event_metadata")
    experiment_id: Optional[int]
    variant: Optional[str]
    occurred_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True
