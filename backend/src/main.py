from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import get_settings
from database import init_db
from ai_service.router import router as ai_voice_router
from ai_service.chat_router import router as ai_chat_router
from ai_service.file_router import router as ai_file_router


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
        "service": "AI Interview Service",
        "version": settings.app_version,
        "endpoints": {
            "chat_stream": "/chat/stream (supports file upload or file URIs)",
            "clear_session": "/chat/session/{session_id}",
            "female_voice": "/chat/female-voice",
            "male_voice": "/chat/male-voice",
            "file_upload": "/files/upload (upload files to get URI)",
            "list_files": "/files (list all uploaded files)",
            "get_file": "/files/{file_name} (get file metadata)",
            "delete_file": "/files/{file_name} (delete file)",
        },
    }


# AI Service routers
app.include_router(ai_voice_router, tags=["AI Service - Voice"])
app.include_router(ai_chat_router, tags=["AI Service - Chat"])
app.include_router(ai_file_router, tags=["AI Service - Files"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
