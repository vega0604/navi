

service = None

def init_reviews_service():
    global service
    if service is None:
        service = ReviewsService()  # Initialize with actual repository

def get_reviews_service():
    return service


class ReviewsService:
    def get_review_by_id(self, review_id):
        return self.reviews_repository.find_by_id(review_id)

    def create_review(self, review_data):
        return self.reviews_repository.create(review_data)

    def update_review(self, review_id, review_data):
        return self.reviews_repository.update(review_id, review_data)

    def delete_review(self, review_id):
        return self.reviews_repository.delete(review_id)