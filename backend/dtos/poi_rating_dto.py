from pydantic import BaseModel
from typing import Optional, List
from models.category_user_rating import CategoryRating

class POIRatingDTO(BaseModel):
    '''
    ratings per user/rating event for a point of interest

    extensible to include user_id
    '''
    poi_id: str
    ratings: Optional[List[CategoryRating]] = []