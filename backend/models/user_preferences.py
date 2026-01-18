from pydantic import BaseModel
from typing import List
from .category_enum import DisabilityCategory

class UserPreferences(BaseModel):
    selected_categories: List[DisabilityCategory] = []