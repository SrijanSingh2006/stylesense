from pydantic import ConfigDict
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class EventCreate(BaseModel):
    event_key: Optional[str] = Field(None, max_length=100)
    customer_id: Optional[int] = None
    session_id: str = Field(min_length=1, max_length=100)
    product_id: Optional[int] = None
    event_type: str = Field(min_length=1, max_length=50)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    experiment_id: Optional[int] = None
    variant: Optional[str] = None

class EventResponse(BaseModel):
    id: int
    customer_id: Optional[int]
    session_id: str = Field(min_length=1, max_length=100)
    product_id: Optional[int]
    event_type: str = Field(min_length=1, max_length=50)
    metadata: Dict[str, Any] = Field(default_factory=dict, alias="event_metadata")
    experiment_id: Optional[int]
    variant: Optional[str]
    occurred_at: datetime

    model_config = ConfigDict(from_attributes = True, populate_by_name = True)
