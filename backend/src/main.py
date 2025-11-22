import sys
import os

# Add current directory to sys.path so imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

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
    # Startup: Create database tables (skip if running on Vercel)
    import os

    # Try to initialize database, but don't fail if it fails (e.g. on Vercel without DB)
    try:
        if not os.getenv("VERCEL"):
            init_db()
            print(f"📊 PostgreSQL Database initialized")
    except Exception as e:
        print(f"⚠️ Database initialization failed (running without DB): {e}")

    print(f"🚀 {settings.app_name} starting up...")
    print(f"🎤 AI Service ready")
    yield
    # Shutdown
    print(f"👋 {settings.app_name} shutting down...")


# Determine root_path based on environment
# We will handle routing prefixes explicitly in the app structure
# instead of relying on root_path which can be tricky with Vercel rewrites
root_path = ""

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
    root_path=root_path,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex="https?://.*",  # Allow all http and https origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/api")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "status": "running",
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Interview Service",
        "version": settings.app_version,
        "endpoints": {
            "chat_stream": "/api/chat/stream (supports file upload or file URIs)",
            "clear_session": "/api/chat/session/{session_id}",
            "female_voice": "/api/chat/female-voice",
            "male_voice": "/api/chat/male-voice",
            "file_upload": "/api/files/upload (upload files to get URI)",
            "list_files": "/api/files (list all uploaded files)",
            "get_file": "/api/files/{file_name} (get file metadata)",
            "delete_file": "/api/files/{file_name} (delete file)",
        },
    }


# AI Service routers
app.include_router(ai_voice_router, prefix="/api", tags=["AI Service - Voice"])
app.include_router(ai_chat_router, prefix="/api", tags=["AI Service - Chat"])
app.include_router(ai_file_router, prefix="/api", tags=["AI Service - Files"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
