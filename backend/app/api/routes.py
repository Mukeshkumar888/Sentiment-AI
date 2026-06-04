from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from loguru import logger
import pandas as pd
import io
try:
    import fitz  # pymupdf
    PDF_SUPPORTED = True
except ImportError:
    PDF_SUPPORTED = False

from app.models.database import get_db, AnalysisRecord
from app.models.schemas import (
    AnalyzeRequest, AnalyzeResponse, BatchAnalyzeRequest,
    BatchAnalyzeResponse, HistoryItem, SentimentScore
)

router = APIRouter()

def get_model(request: Request):
    return request.app.state.model_service

@router.post("/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
async def analyze_text(
    body: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
    model=Depends(get_model)
):
    try:
        result = await model.analyze(body.text)
        record = AnalysisRecord(
            text=body.text[:500],
            sentiment=result["sentiment"],
            confidence=result["confidence"],
            positive_score=result["scores"]["positive"],
            negative_score=result["scores"]["negative"],
            neutral_score=result["scores"]["neutral"],
            emotion=result.get("emotion")
        )
        db.add(record)
        await db.commit()
        return AnalyzeResponse(
            text=result["text"],
            sentiment=result["sentiment"],
            confidence=result["confidence"],
            scores=SentimentScore(**result["scores"]),
            emotion=result.get("emotion"),
            emoji=result["emoji"],
            color=result["color"],
            keywords=result["keywords"]
        )
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/batch", response_model=BatchAnalyzeResponse, tags=["Analysis"])
async def analyze_batch(
    body: BatchAnalyzeRequest,
    db: AsyncSession = Depends(get_db),
    model=Depends(get_model)
):
    results, summary = await model.batch_analyze(body.texts)
    for r in results:
        db.add(AnalysisRecord(
            text=r["text"][:500],
            sentiment=r["sentiment"],
            confidence=r["confidence"],
            positive_score=r["scores"]["positive"],
            negative_score=r["scores"]["negative"],
            neutral_score=r["scores"]["neutral"],
            emotion=r.get("emotion")
        ))
    await db.commit()
    return BatchAnalyzeResponse(
        results=[AnalyzeResponse(
            text=r["text"], sentiment=r["sentiment"],
            confidence=r["confidence"], scores=SentimentScore(**r["scores"]),
            emotion=r.get("emotion"), emoji=r["emoji"],
            color=r["color"], keywords=r["keywords"]
        ) for r in results],
        summary=summary
    )

@router.post("/analyze/csv", tags=["Analysis"])
async def analyze_csv(file: UploadFile = File(...), model=Depends(get_model)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")
    content = await file.read()
    df = pd.read_csv(io.StringIO(content.decode("utf-8")))
    if "text" not in df.columns:
        raise HTTPException(status_code=400, detail="CSV must have a 'text' column")
    texts = df["text"].dropna().tolist()[:200]
    results, summary = await model.batch_analyze(texts)
    return {"results": results, "summary": summary, "total_rows": len(texts)}

@router.get("/history", tags=["History"])
async def get_history(skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AnalysisRecord).order_by(AnalysisRecord.created_at.desc()).offset(skip).limit(limit)
    )
    records = result.scalars().all()
    return [HistoryItem.model_validate(r) for r in records]

@router.get("/stats", tags=["Analytics"])
async def get_stats(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count(AnalysisRecord.id)))).scalar()
    dist  = (await db.execute(select(AnalysisRecord.sentiment, func.count(AnalysisRecord.id)).group_by(AnalysisRecord.sentiment))).all()
    emo   = (await db.execute(select(AnalysisRecord.emotion, func.count(AnalysisRecord.id)).where(AnalysisRecord.emotion.isnot(None)).group_by(AnalysisRecord.emotion))).all()
    avg   = (await db.execute(select(func.avg(AnalysisRecord.confidence)))).scalar()
    return {
        "total_analyzed":        total,
        "sentiment_distribution": {r[0]: r[1] for r in dist},
        "emotion_distribution":   {r[0]: r[1] for r in emo},
        "avg_confidence":         round(avg or 0.0, 4)
    }

@router.post("/analyze/pdf", tags=["Analysis"])
async def analyze_pdf(file: UploadFile = File(...), model=Depends(get_model)):
    if not PDF_SUPPORTED:
        raise HTTPException(status_code=501, detail="PDF support not installed. Run: pip install pymupdf")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    content = await file.read()
    try:
        doc = fitz.open(stream=content, filetype="pdf")
        full_text = ""
        for page in doc:
            full_text += page.get_text()
        doc.close()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {str(e)}")
    if not full_text.strip():
        raise HTTPException(status_code=400, detail="PDF has no readable text (may be a scanned image)")
    # Split into chunks of ~500 chars for better analysis
    chunks = [full_text[i:i+500].strip() for i in range(0, min(len(full_text), 5000), 500)]
    chunks = [c for c in chunks if len(c) > 30]
    results, summary = await model.batch_analyze(chunks)
    return {
        "filename": file.filename,
        "total_chars": len(full_text),
        "total_chunks": len(chunks),
        "results": results,
        "summary": summary,
        "full_text_preview": full_text[:300]
    }

