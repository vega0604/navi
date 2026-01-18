from pydantic import BaseModel
from models.category_enum import DisabilityCategory
from models.poi import POI
from typing import List


class RatingsPerCategory(BaseModel):
    category: DisabilityCategory
    average_rating: float
    distribution: dict  # e.g., {"1_star": 10, "2_star": 5, "3_star": 15, "4_star": 30, "5_star": 40}

class POI_FULL_DTO(POI):
    relevant_summary: str
    relevant_review_excerpts: List[str] = []
    categories_overview: List[RatingsPerCategory] = []