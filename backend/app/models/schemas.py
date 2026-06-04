from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)

class BatchAnalyzeRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, max_length=100)

class SentimentScore(BaseModel):
    positive: float
    negative: float
    neutral: float

class AnalyzeResponse(BaseModel):
    text: str
    sentiment: str
    confidence: float
    scores: SentimentScore
    emotion: Optional[str]
    emoji: str
    color: str
    keywords: list[dict]
    highlights: Optional[list[dict]] = []
    language: Optional[str] = "English"
    warning: Optional[str] = None
    char_count: Optional[int] = 0
    word_count: Optional[int] = 0

class BatchAnalyzeResponse(BaseModel):
    results: list[AnalyzeResponse]
    summary: dict

class HistoryItem(BaseModel):
    id: int
    text: str
    sentiment: str
    confidence: float
    emotion: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

