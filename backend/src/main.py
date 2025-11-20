from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import get_settings
from database import init_db
from ai_service.router import router as ai_router


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup: Create database tables
    init_db()
    print(f"🚀 {settings.app_name} starting up...")
    print(f"📊 PostgreSQL Database initialized")
    print(f"🎤 AI Service ready")
    yield
    # Shutdown
    print(f"👋 {settings.app_name} shutting down...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Voice Service",
        "version": settings.app_version,
        "endpoints": {
            "text_to_voice": "/chat/text-to-voice",
            "female_voice": "/chat/female-voice",
            "male_voice": "/chat/male-voice",
        },
    }


# AI Service router - Voice/TTS endpoints
app.include_router(ai_router, tags=["AI Service - Voice"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
