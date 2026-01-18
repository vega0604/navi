from fastapi import APIRouter

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/")
async def get_reviews():
    """Get all reviews"""
    return {"message": "Get reviews"}


@router.get("/{review_id}")
async def get_review(review_id: int):
    """Get a specific review"""
    return {"review_id": review_id, "message": "Get review"}


@router.post("/")
async def create_review():
    """Create a new review"""
    return {"message": "Create review"}