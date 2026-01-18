from beanie import Document
from datetime import datetime, timezone
from pydantic import Field

class Review(Document):
    id: str = Field(alias="_id")
    poi_id: str
    review_text: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


    class Settings:
        name = "reviews"  # Collection name in MongoDB