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
            self.client = genai.Client(api_key=gemini_api_key).aio
        else:
            raise ValueError("Gemini API key is not set in environment variables.")
        self.model = 'gemini-3-flash-preview'

    async def get_place_by_id(self, place_id: str, user_preferences: UserPreferences) -> POI_FULL_DTO:
        bare_poi = await POI.get(place_id)
        poi_reviews = await Review.find(Review.id == place_id).to_list()
        poi_reviews = [review.review_text for review in poi_reviews]

        summary_prompt = """
        You are an accessibility-focused summarization assistant.
        I will provide:
        A list of user reviews as strings.
        A list of disability categories that represent the disabilities a person may have.
        Your task is to generate a concise, neutral summary of the place only in relation to the given disability categories.
        Guidelines:
        Focus exclusively on accessibility-related positives and negatives that are relevant to the provided disability categories.
        If a review mentions accessibility features unrelated to the given categories, ignore them.
        If information for a given disability category is missing or unclear, explicitly state that there is insufficient information.
        Do not generalize beyond what is stated in the reviews.
        Use respectful, inclusive language.
        Avoid repeating individual reviews; synthesize them into a single summary.
        Input format:
        {
        "reviews": ["review 1", "review 2", "..."],
        "disability_categories": ["category 1", "category 2"]
        }
        Output format:
        A short paragraph summary (3–5 sentences)
        Followed by a bullet list with one bullet per disability category:

        Each bullet should clearly list positives, negatives, or unknowns for that category.

        Example focus:
        If disability_categories includes "visual impairment" and "mobility impairment", prioritize information such as braille menus, lighting clarity, ramps, stairs, spacing, and navigation.

        Generate the summary now based on the provided input.
        """

        summary = await self.client.models.generate_content(
            model=self.model,
            contents=[
                summary_prompt,
                {
                    "reviews": poi_reviews,
                    "disability_categories": user_preferences.selected_categories
                }
            ]
        )

        excerpts_prompt = """
        You are an accessibility-focused information extraction assistant.
        I will provide:
        A list of user reviews as strings.
        A list of disability categories that represent the disabilities a person may have.
        Your task is to extract only the specific excerpts (phrases or sentences) from the reviews that are relevant to the given disability categories.
        Guidelines:
        Only extract text that directly relates to accessibility for the provided disability categories.
        Ignore unrelated content, opinions, or general praise/complaints.
        Do not paraphrase or summarize — return the exact excerpts from the reviews.
        If a review contains multiple relevant excerpts, extract each separately.
        If no excerpt is relevant for a given disability category, return an empty list for that category.
        Use respectful, inclusive language and avoid assumptions.
        Input format:
        {
        "reviews": ["review 1", "review 2", "..."],
        "disability_categories": ["category 1", "category 2"]
        }
        Output format:
        Return valid JSON in the following structure:
        {
        "relevant_excerpts": [
            "<excerpt from review 0>",
            "<excerpt from review 1>",
            "<excerpt from review 2>",
            "..."
        ]


        Additional rules:

        review_index should match the zero-based index of the review in the input list.

        Do not include duplicate excerpts.

        Do not infer accessibility features that are not explicitly stated.

        Extract the relevant excerpts now based on the provided input.
        """

        excerpts = await self.client.models.generate_content(
            model=self.model,
            contents=[
                excerpts_prompt,
                {
                    "reviews": poi_reviews,
                    "disability_categories": user_preferences.selected_categories
                }
            ]
        )

    # async def generate_summary(self, place: POI) -> str:
    #     """Generate a summary of the place using Gemini AI"""
    #     prompt = f"Create a brief summary of this place: {place.name}. {place.description}"
    #     response = self.model.generate_content(prompt)
    #     return response.text

    async def create_place(self, place_data: POI):
        await place_data.insert()

service = None

def init_places_service():
    global service
    if service is None:
        service = PlacesService()  # Initialize with actual repository

def get_places_service() -> PlacesService:
    return service # type: ignore
