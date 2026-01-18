from poi import POI
from category_enum import DisabilityCategory
from pydantic import Field
from typing import List, Optional

class POI_PARTIAL_DTO(POI):
    relevant_categories: Optional[List[DisabilityCategory]] = []