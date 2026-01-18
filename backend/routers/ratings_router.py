from fastapi import APIRouter
from services.ratings_service import get_ratings_service

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.get("/{rating_id}")
async def get_rating(rating_id: int):
    """Get a specific rating"""
    return {"rating_id": rating_id, "message": "Get rating"}


@router.post("/")
async def create_rating():
    """Create a new rating"""
    return {"message": "Create rating"}