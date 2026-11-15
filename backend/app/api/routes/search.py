from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.search import SearchRequest, SearchResponse, VisualSearchResponse
from app.services.search import search_products
from app.services.visual_search import process_visual_search

router = APIRouter()

@router.post("/search", response_model=SearchResponse, tags=["Search"])
def post_search(req: SearchRequest, db: Session = Depends(get_db)):
    return search_products(db, req)

@router.post("/visual-search", response_model=VisualSearchResponse, tags=["Search"])
async def post_visual_search(file: UploadFile = File(...), db: Session = Depends(get_db)):
    return await process_visual_search(file, db)
