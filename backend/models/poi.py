from beanie import Document
from pydantic import Field
from typing import List

class POI(Document):
    id: str = Field(alias="_id")
    name: str
    categories: List[str] = []
    latitude: float
    longitude: float

    class Settings:
        name = "pois"  # Collection name in MongoDB