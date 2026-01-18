from fastapi import APIRouter
from services.ratings_service import get_ratings_service
from dtos.poi_rating_dto import POIRatingDTO
from models.poi_ratings import POIRating

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.post("/") 
async def create_rating(rating_data: POIRatingDTO):
    """Create a new rating"""

    rating = POIRating(**rating_data.model_dump())
    ratings_service = get_ratings_service()
    rating = await ratings_service.create_rating(rating)

    return {'error': False}