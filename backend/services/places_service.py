from models.poi import POI
from dtos.poi_full_dto import POI_FULL_DTO
from dtos.poi_partial_dto import POI_PARTIAL_DTO
from models.poi_ratings import POIRating
from models.review import Review
from models.category_user_rating import CategoryRating


service = None

def init_places_service():
    global service
    if service is None:
        service = PlacesService()  # Initialize with actual repository

def get_places_service():
    return service

class PlacesService:
    def get_place_by_id(self, place_id):
        return self.places_repository.find_by_id(place_id)

    def create_place(self, place_data):
        return self.places_repository.create(place_data)

    def update_place(self, place_id, place_data):
        return self.places_repository.update(place_id, place_data)

    def delete_place(self, place_id):
        return self.places_repository.delete(place_id)