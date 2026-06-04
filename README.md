# 🎯 SentimentAI

> A production-grade Sentiment Analysis web app powered by state-of-the-art Transformer models

![SentimentAI](https://img.shields.io/badge/AI-RoBERTa%20Transformer-6366f1?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge)

---

## ✨ Features

- 🧠 **RoBERTa Transformer Model** — State-of-the-art sentiment analysis (Positive / Negative / Neutral)
- 🎭 **Emotion Detection** — Detects 7 emotions: joy, anger, fear, sadness, surprise, disgust, neutral
- 🎯 **Confidence Gauge** — Animated arc showing prediction confidence percentage
- 🔤 **Word Highlighting** — Colored words showing which drove the sentiment
- 🎤 **Voice Input** — Speak instead of typing (English, Hindi, Telugu, Tamil, Kannada, Marathi)
- 📂 **CSV & PDF Upload** — Bulk analyze spreadsheets or extract text from PDFs
- ⚖️ **Compare Texts** — Analyze two texts side by side
- 📌 **Pin Results** — Save your favorite analyses
- 📤 **Share Results** — Copy or share analysis to anyone
- 📊 **Stats Dashboard** — Session analytics with sentiment breakdown charts
- 🌙 **Dark / Light Mode** — Toggle between themes
- 📱 **Fully Responsive** — Works perfectly on laptop and Android mobile

---

## 🛠️ Tech Stack

| Layer         | Technology                         |
| ------------- | ---------------------------------- |
| AI Model      | HuggingFace Transformers (RoBERTa) |
| Emotion Model | DistilRoBERTa (j-hartmann)         |
| Backend       | FastAPI + Python 3.13              |
| Database      | SQLite + SQLAlchemy                |
| Frontend      | React 18                           |
| Styling       | Pure CSS with animations           |
| PDF Support   | PyMuPDF                            |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/sentimentai.git
cd sentimentai
```

**2. Start the Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload
```

> First run downloads AI models (~500MB) — takes 3-5 minutes

**3. Start the Frontend**

```bash
cd frontend
npm install
npm start
```

**4. Open in browser**

```
http://localhost:3000
```

---

## 📡 API Endpoints

| Method | Endpoint                | Description            |
| ------ | ----------------------- | ---------------------- |
| POST   | `/api/v1/analyze`       | Analyze single text    |
| POST   | `/api/v1/analyze/batch` | Analyze multiple texts |
| POST   | `/api/v1/analyze/csv`   | Upload CSV file        |
| POST   | `/api/v1/analyze/pdf`   | Upload PDF file        |
| GET    | `/api/v1/history`       | View analysis history  |
| GET    | `/api/v1/stats`         | Get analytics          |
| GET    | `/docs`                 | Swagger API docs       |

---

## 🎤 Voice Input

| Language   | Speech Recognition  | Sentiment Accuracy                    |
| ---------- | ------------------- | ------------------------------------- |
| 🇺🇸 English | ✅ Supported        | ✅ High accuracy                      |
| 🇮🇳 Hindi   | ✅ Transcribes text | ⚠️ Limited (model is English-trained) |
| 🇮🇳 Telugu  | ✅ Transcribes text | ⚠️ Limited (model is English-trained) |
| 🇮🇳 Tamil   | ✅ Transcribes text | ⚠️ Limited (model is English-trained) |
| 🇮🇳 Kannada | ✅ Transcribes text | ⚠️ Limited (model is English-trained) |
| 🇮🇳 Marathi | ✅ Transcribes text | ⚠️ Limited (model is English-trained) |

> **Note:** The RoBERTa model is trained on English text. For best results, use English voice input.
> Other languages will transcribe speech correctly but sentiment analysis accuracy may be lower.

---

## 📁 Project Structure

```
sentimentai/
├── backend/
│   ├── main.py                    # FastAPI entry point
│   ├── requirements.txt
│   └── app/
│       ├── api/routes.py          # All API endpoints
│       ├── models/database.py     # SQLite database
│       ├── models/schemas.py      # Pydantic schemas
│       └── services/model_service.py  # AI model logic
├── frontend/
│   ├── package.json
│   └── src/
│       ├── index.js
│       └── App.jsx                # Full React UI
└── README.md
```

---

## 🌐 Deployment

### Backend — Render.com

1. Connect GitHub repo to Render
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend — Vercel

1. Connect GitHub repo to Vercel
2. Root directory: `frontend`
3. Build command: `npm run build`

---

## 📸 Screenshots

> Dark mode with sentiment gauge, emotion detection, and word highlighting

---

## 📄 License

MIT License — feel free to use and modify!

---

_Built with ❤️ using HuggingFace Transformers, FastAPI, and React_
