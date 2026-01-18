
from models.poi_ratings import POIRating


class RatingsService:
    async def create_rating(self, rating: POIRating):
        await rating.insert()
        return rating

service = None

def init_ratings_service():
    global service
    if service is None:
        service = RatingsService()  # Initialize with actual repository

def get_ratings_service() -> RatingsService:
    return service # type: ignore