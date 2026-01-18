
from models.review import Review


class ReviewsService:
    async def create_review(self, review: Review):
        await review.insert()
    
service = None

def init_reviews_service():
    global service
    if service is None:
        service = ReviewsService()  # Initialize with actual repository

def get_reviews_service() -> ReviewsService:
    return service # type: ignore

