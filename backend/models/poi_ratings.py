from pydantic import Field
from beanie import Document
from typing import Optional, List
from datetime import datetime, timezone
from .category_user_rating import CategoryRating

class POIRating(Document):
    '''
    ratings per user/rating event for a point of interest

    extensible to include user_id
    '''
    poi_id: str
    ratings: Optional[List[CategoryRating]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "poi_ratings"  # Collection name in MongoDB
