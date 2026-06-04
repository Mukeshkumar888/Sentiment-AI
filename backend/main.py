from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger
import sys
import os

from app.api.routes import router
from app.models.database import init_db
from app.services.model_service import ModelService

logger.remove()
logger.add(sys.stderr, format="<green>{time:HH:mm:ss}</green> | <level>{level}</level> | {message}", level="INFO")
logger.add("logs/app.log", rotation="10 MB", retention="7 days")

model_service = ModelService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting SentimentAI API...")
    await init_db()
    await model_service.load_model()
    app.state.model_service = model_service
    logger.info("Model loaded and ready!")
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title="SentimentAI API",
    description="Production-grade Sentiment Analysis with Transformer models",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"status": "ok", "message": "SentimentAI is running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model_service.is_loaded}
