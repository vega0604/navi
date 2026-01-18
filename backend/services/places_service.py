from models.user_preferences import UserPreferences
from models.poi import POI
from dtos.poi_full_dto import POI_FULL_DTO
from dtos.poi_partial_dto import POI_PARTIAL_DTO
from models.poi_ratings import POIRating
from models.review import Review
from models.category_user_rating import CategoryRating
from google import genai
from os import getenv

class PlacesService:
    def __init__(self, gemini_api_key: str = getenv('GEMINI_API_KEY', '')):
        if gemini_api_key:
            genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-3-flash-preview')

    async def get_place_by_id(self, place_id: str, user_preferences: UserPreferences) -> POI_FULL_DTO:
        bare_poi = await POI.get(place_id)
        poi_reviews = await Review.find(Review.id == place_id).to_list()


    async def generate_summary(self, place: POI) -> str:
        """Generate a summary of the place using Gemini AI"""
        prompt = f"Create a brief summary of this place: {place.name}. {place.description}"
        response = self.model.generate_content(prompt)
        return response.text

    async def create_place(self, place_data: POI):
        await place_data.insert()

service = None

def init_places_service():
    global service
    if service is None:
        service = PlacesService()  # Initialize with actual repository

def get_places_service() -> PlacesService:
    return service # type: ignore
