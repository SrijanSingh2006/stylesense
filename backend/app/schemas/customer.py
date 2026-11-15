from pydantic import ConfigDict
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CustomerBase(BaseModel):
    display_name: str
    email: Optional[str] = None
    preferred_categories: List[str] = []
    preferred_colours: List[str] = []
    preferred_brands: List[str] = []
    budget_min: float = 500.0
    budget_max: float = 5000.0

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes = True)
