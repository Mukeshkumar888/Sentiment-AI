from transformers import pipeline
from loguru import logger
import torch
import re
from collections import Counter

SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"
EMOTION_MODEL = "j-hartmann/emotion-english-distilroberta-base"

SENTIMENT_EMOJI = {"positive": "😊", "negative": "😞", "neutral": "😐"}
SENTIMENT_COLOR = {"positive": "#22c55e", "negative": "#ef4444", "neutral": "#f59e0b"}

POSITIVE_WORDS = {
    "great","good","excellent","amazing","wonderful","love","best","happy","fantastic",
    "awesome","perfect","beautiful","brilliant","outstanding","superb","delightful",
    "incredible","magnificent","marvelous","pleasant","exceptional","remarkable",
    "terrific","splendid","glorious","grateful","joyful","positive","impressive"
}
NEGATIVE_WORDS = {
    "bad","terrible","awful","horrible","hate","worst","poor","sad","disappointed",
    "ugly","failed","broken","useless","dreadful","pathetic","disgusting","appalling",
    "atrocious","deplorable","miserable","painful","frustrating","annoying","boring",
    "mediocre","inferior","inadequate","unacceptable","disappointing","negative"
}
NEUTRAL_WORDS = {
    "okay","fine","average","normal","moderate","decent","acceptable","standard",
    "ordinary","regular","typical","common","usual","general","basic","neutral"
}

class ModelService:
    def __init__(self):
        self.sentiment_pipeline = None
        self.emotion_pipeline = None
        self.is_loaded = False
        self.device = 0 if torch.cuda.is_available() else -1

    async def load_model(self):
        try:
            logger.info("Loading sentiment model (RoBERTa)...")
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model=SENTIMENT_MODEL,
                tokenizer=SENTIMENT_MODEL,
                device=self.device,
                return_all_scores=True,
                truncation=True,
                max_length=512
            )
            logger.info("Loading emotion model (DistilRoBERTa)...")
            self.emotion_pipeline = pipeline(
                "text-classification",
                model=EMOTION_MODEL,
                device=self.device,
                return_all_scores=True,
                truncation=True,
                max_length=512
            )
            self.is_loaded = True
            logger.info("All models loaded successfully!")
        except Exception as e:
            logger.error(f"Model load failed: {e}")
            raise

    def _normalize_label(self, label: str) -> str:
        label = label.lower()
        if "pos" in label: return "positive"
        if "neg" in label: return "negative"
        return "neutral"

    def _extract_keywords(self, text: str) -> list:
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        freq = Counter(words)
        keywords = []
        seen = set()
        for word, count in freq.most_common(50):
            if word in seen: continue
            seen.add(word)
            if word in POSITIVE_WORDS:
                keywords.append({"word": word, "score": round(0.7 + min(count * 0.05, 0.29), 2), "sentiment": "positive"})
            elif word in NEGATIVE_WORDS:
                keywords.append({"word": word, "score": round(0.7 + min(count * 0.05, 0.29), 2), "sentiment": "negative"})
            elif word in NEUTRAL_WORDS:
                keywords.append({"word": word, "score": round(0.5 + min(count * 0.03, 0.2), 2), "sentiment": "neutral"})
        keywords.sort(key=lambda x: x["score"], reverse=True)
        return keywords[:12]

    def _highlight_words(self, text: str) -> list:
        """Return list of {word, sentiment} for frontend highlighting."""
        tokens = re.split(r'(\s+|[,.!?;:]+)', text)
        result = []
        for token in tokens:
            clean = token.lower().strip()
            if clean in POSITIVE_WORDS:
                result.append({"token": token, "sentiment": "positive"})
            elif clean in NEGATIVE_WORDS:
                result.append({"token": token, "sentiment": "negative"})
            elif clean in NEUTRAL_WORDS:
                result.append({"token": token, "sentiment": "neutral"})
            else:
                result.append({"token": token, "sentiment": None})
        return result

    def _detect_language(self, text: str) -> str:
        """Simple heuristic language detection."""
        sample = text[:200].lower()
        if re.search(r'[а-яё]', sample): return "Russian"
        if re.search(r'[\u4e00-\u9fff]', sample): return "Chinese"
        if re.search(r'[\u0600-\u06ff]', sample): return "Arabic"
        if re.search(r'[\u0900-\u097f]', sample): return "Hindi"
        return "English"

    def _chunk_text(self, text: str, chunk_size: int = 450) -> list:
        """Split long text into sentence-aware chunks."""
        sentences = re.split(r'(?<=[.!?])\s+', text)
        chunks, current = [], ""
        for sent in sentences:
            if len(current) + len(sent) < chunk_size:
                current += " " + sent
            else:
                if current.strip(): chunks.append(current.strip())
                current = sent
        if current.strip(): chunks.append(current.strip())
        return chunks if chunks else [text[:chunk_size]]

    async def _analyze_single(self, text: str) -> dict:
        raw = self.sentiment_pipeline(text[:512])
        sent_results = raw[0] if isinstance(raw[0], list) else raw
        if isinstance(sent_results, dict): sent_results = [sent_results]
        scores_map = {self._normalize_label(r["label"]): round(r["score"], 4) for r in sent_results}
        for key in ["positive", "negative", "neutral"]:
            scores_map.setdefault(key, 0.0)
        sentiment  = max(scores_map, key=scores_map.get)
        confidence = scores_map[sentiment]

        emotion = None
        try:
            raw_emo = self.emotion_pipeline(text[:512])
            emo_results = raw_emo[0] if isinstance(raw_emo[0], list) else raw_emo
            if isinstance(emo_results, dict): emo_results = [emo_results]
            top_emotion = max(emo_results, key=lambda x: x["score"])
            emotion = top_emotion["label"].lower()
        except Exception:
            pass

        return sentiment, confidence, scores_map, emotion

    async def analyze(self, text: str) -> dict:
        if not self.is_loaded:
            raise RuntimeError("Models not loaded yet")

        language = self._detect_language(text)
        is_long  = len(text) > 512
        warning  = None

        if is_long:
            # Chunk and aggregate
            chunks = self._chunk_text(text)
            all_scores = {"positive": 0.0, "negative": 0.0, "neutral": 0.0}
            emotions = []
            for chunk in chunks[:8]:
                s, c, sc, em = await self._analyze_single(chunk)
                for k in all_scores: all_scores[k] += sc[k]
                if em: emotions.append(em)
            n = len(chunks[:8])
            scores_map = {k: round(v/n, 4) for k, v in all_scores.items()}
            sentiment  = max(scores_map, key=scores_map.get)
            confidence = scores_map[sentiment]
            emotion    = Counter(emotions).most_common(1)[0][0] if emotions else None
            warning    = f"Long text ({len(text)} chars) — analyzed across {n} sections"
        else:
            sentiment, confidence, scores_map, emotion = await self._analyze_single(text)

        if confidence < 0.55:
            warning = (warning or "") + (" | " if warning else "") + "Low confidence — text may be ambiguous"

        return {
            "text":       text,
            "sentiment":  sentiment.upper(),
            "confidence": confidence,
            "scores":     scores_map,
            "emotion":    emotion,
            "emoji":      SENTIMENT_EMOJI.get(sentiment, "😐"),
            "color":      SENTIMENT_COLOR.get(sentiment, "#f59e0b"),
            "keywords":   self._extract_keywords(text),
            "highlights": self._highlight_words(text[:300]),
            "language":   language,
            "warning":    warning,
            "char_count": len(text),
            "word_count": len(text.split()),
        }

    async def batch_analyze(self, texts: list) -> tuple:
        results = [await self.analyze(t) for t in texts]
        sentiments = [r["sentiment"] for r in results]
        summary = {
            "total":          len(results),
            "positive":       sentiments.count("POSITIVE"),
            "negative":       sentiments.count("NEGATIVE"),
            "neutral":        sentiments.count("NEUTRAL"),
            "avg_confidence": round(sum(r["confidence"] for r in results) / len(results), 4)
        }
        return results, summary

