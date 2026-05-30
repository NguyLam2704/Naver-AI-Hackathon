# Naver AI Hackathon Project

This project consists of a FastAPI backend and a React frontend.

## Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL (Optional, for backend database features)

## 1. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment (recommended):

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file in `backend/` (copy from `.env.example` if available) and add your API keys:

```env
GEMINI_API_KEY=your_gemini_api_key
CLOVA_VOICE_CLIENT_ID=your_clova_client_id
CLOVA_VOICE_CLIENT_SECRET=your_clova_client_secret
CLOVA_API_URL=https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts
```

Run the server:

```bash
cd src
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`.
API Documentation: `http://localhost:8000/docs`

## 2. Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm start
```

The frontend will be available at `http://localhost:3000`.

## 3. Connecting Frontend to Backend

Currently, the frontend might be using mock data. To connect it to the real backend:

1. Ensure the backend is running on port 8000.
2. Update the frontend API calls to point to `http://localhost:8000` (or configure a proxy in `package.json`).

## Project Structure

- `backend/`: FastAPI application
- `frontend/`: React application
- `api/`: Serverless entry point for Vercel
- `vercel.json`: Vercel configuration
