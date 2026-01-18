

service = None

def init_ratings_service():
    global service
    if service is None:
        service = RatingsService()  # Initialize with actual repository

def get_ratings_service():
    return service

class RatingsService:
    def get_rating_by_id(self, rating_id):
        return self.ratings_repository.find_by_id(rating_id)

    def create_rating(self, rating_data):
        return self.ratings_repository.create(rating_data)

    def update_rating(self, rating_id, rating_data):
        return self.ratings_repository.update(rating_id, rating_data)

    def delete_rating(self, rating_id):
        return self.ratings_repository.delete(rating_id)