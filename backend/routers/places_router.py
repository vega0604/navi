from fastapi import APIRouter

router = APIRouter(prefix="/places", tags=["places"])


@router.get("/")
async def get_places():
    """Get all places"""
    return {"message": "Get places"}


@router.get("/{place_id}")
async def get_place(place_id: int):
    """Get a specific place"""
    return {"place_id": place_id, "message": "Get place"}


@router.post("/")
async def create_place():
    """Create a new place"""
    return {"message": "Create place"}