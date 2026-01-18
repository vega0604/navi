from fastapi import APIRouter
from services.places_service import get_places_service
from dtos.poi_full_dto import POI_FULL_DTO
from dtos.poi_partial_dto import POI_PARTIAL_DTO
from models.user_preferences import UserPreferences
from typing import List

router = APIRouter(prefix="/places", tags=["places"])



@router.get("/{place_id}", response_model=POI_FULL_DTO)
async def get_full_place(place_id: str, user_preferences: UserPreferences):
    """Get a specific place"""

    places_service = get_places_service()
    place = await places_service.get_place_by_id(place_id, user_preferences)
    return {"poi_data": place}

@router.get("/search?query={query}", response_model=List[POI_PARTIAL_DTO])
async def get_partial_places(query: str):
    return []


@router.post("/")
async def create_place():
    """Create a new place"""
    return {"message": "Create place"}