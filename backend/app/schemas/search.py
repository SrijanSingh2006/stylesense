from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.schemas.product import ProductResponse

class SearchRequest(BaseModel):
    query: str = ""
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    colour: Optional[str] = None
    brand: Optional[str] = None
    sort_by: Optional[str] = "relevance" # relevance, price_asc, price_desc, rating
    page: int = 1
    limit: int = 20

class ExtractedFilters(BaseModel):
    category: Optional[str] = None
    colour: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    brand: Optional[str] = None
    occasion: Optional[str] = None
    keywords: List[str] = []

class SearchResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    limit: int
    pages: int
    query: str
    parsed_filters: ExtractedFilters
    parser_type: str = "deterministic_rule_tfidf"

class VisualSearchResponse(BaseModel):
    items: List[ProductResponse]
    extracted_colour: str
    extracted_histogram: Dict[str, float]
    algorithm: str = "pillow_color_histogram_cosine"
    notes: str = "Initial prototype matches visual color palette and attributes. Plug-and-play modular design supports future CLIP embedding models."
