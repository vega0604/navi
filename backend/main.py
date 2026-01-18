from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from contextlib import asynccontextmanager

from models.review import Review
from models.poi_ratings import POIRating
from models.poi import POI

from routers.places_router import router as places_router
from routers.ratings_router import router as ratings_router 
from routers.reviews_router import router as reviews_router

from services.places_service import init_places_service
from services.ratings_service import init_ratings_service
from services.reviews_service import init_reviews_service

from os import getenv
from pyngrok import ngrok, conf
from loguru import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting application lifespan...")
    logger.info("Connecting to MongoDB Cluster...")
    mongo_uri = getenv("MONGODB_URI")  
    logger.info(f"MongoDB URI: {mongo_uri}")  # Log the URI for debugging
    mongo_client = AsyncIOMotorClient(mongo_uri)
    await init_beanie(
        database=mongo_client['navi-cluster'], # type: ignore
        document_models=[
            Review,
            POIRating,
            POI
        ]
    )
    logger.info("Connected to MongoDB Cluster.")  # Confirm connection

    init_places_service()
    init_ratings_service()
    init_reviews_service()

    logger.info("Starting ngrok tunnel...")
    NGROK_AUTH_TOKEN = getenv("NGROK_AUTH_TOKEN")
    public_url = None
    if NGROK_AUTH_TOKEN:
        conf.get_default().auth_token = NGROK_AUTH_TOKEN
        public_url = ngrok.connect("8000").public_url
        logger.info(f"ngrok tunnel started at {public_url}")
    else:
        logger.warning("NGROK_AUTH_TOKEN not found in environment variables. Skipping ngrok tunnel setup.")

    yield

    logger.info("Shutting down application lifespan...")
    logger.info("Closing MongoDB connection...")
    mongo_client.close()
    if public_url:
        logger.info("Disconnecting ngrok tunnel...")
        ngrok.disconnect(public_url)


app = FastAPI(lifespan=lifespan)

# Include routers with dependency context
app.include_router(places_router)
app.include_router(ratings_router)
app.include_router(reviews_router)

@app.get("/")
async def root():
    return {"message": "Hello World"}