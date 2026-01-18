from models.poi import POI
from models.category_enum import DisabilityCategory
from typing import List, Optional

class POI_PARTIAL_DTO(POI):
    relevant_categories: Optional[List[DisabilityCategory]] = []