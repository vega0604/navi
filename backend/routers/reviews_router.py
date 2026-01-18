from fastapi import APIRouter
from dtos.review_dto import ReviewDTO
from models.review import Review
from services.reviews_service import get_reviews_service

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/")
async def create_review(review_data: ReviewDTO):
    """Create a new review"""

    review = Review(**review_data.model_dump())
    reviews_service = get_reviews_service()
    review = await reviews_service.create_review(review)
    return {'error': False}