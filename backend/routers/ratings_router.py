from fastapi import APIRouter

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.get("/")
async def get_ratings():
    """Get all ratings"""
    return {"message": "Get ratings"}


@router.get("/{rating_id}")
async def get_rating(rating_id: int):
    """Get a specific rating"""
    return {"rating_id": rating_id, "message": "Get rating"}


@router.post("/")
async def create_rating():
    """Create a new rating"""
    return {"message": "Create rating"}