from fastapi import APIRouter
from app.schemas.size import SizeRequest, SizeResponse
from app.services.size_engine import calculate_size_recommendation

router = APIRouter()

@router.post("/size-recommendation", response_model=SizeResponse, tags=["Size & Fit"])
def post_size_recommendation(req: SizeRequest):
    return calculate_size_recommendation(req)
