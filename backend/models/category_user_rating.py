from pydantic import BaseModel, Field
from .category_enum import DisabilityCategory

class CategoryRating(BaseModel):
    category: DisabilityCategory
    score: float = Field(..., ge=0.0, le=5.0)  # restrict 
