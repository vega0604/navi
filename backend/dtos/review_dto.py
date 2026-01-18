from pydantic import BaseModel

class ReviewDTO(BaseModel):
    poi_id: str
    review_text: str
