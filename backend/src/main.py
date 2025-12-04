import os
import sys
# Add current directory to sys.path so imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import requests 
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config import get_settings
from database import init_db
from ai_service.router import router as ai_voice_router
from ai_service.chat_router import router as ai_chat_router
from ai_service.file_router import router as ai_file_router
from pydub import AudioSegment
from io import BytesIO
import asyncio
from deepgram.extensions.types.sockets import ListenV2MediaMessage
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException
from deepgram import AsyncDeepgramClient
from deepgram.core.events import EventType
from deepgram.extensions.types.sockets import ListenV2SocketClientResponse
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

def webm_to_pcm16(blob: bytes) -> bytes:
    audio = AudioSegment.from_file(BytesIO(blob), format="webm")
    audio = audio.set_channels(1).set_frame_rate(16000)
    pcm16 = audio.raw_data
    return pcm16

@app.websocket("/api/ws/deepgram")
async def deepgram_proxy(ws: WebSocket):
    await ws.accept()
    api_key = settings.deepgram_api_key
    dg = AsyncDeepgramClient(api_key=api_key)

    async with dg.listen.v2.connect(
        model="flux-general-en",
        encoding="linear16",
        sample_rate=16000
    ) as conn:

        def on_message(msg: ListenV2SocketClientResponse):
            # if hasattr(msg, "event") and msg.event == 'EndOfTurn':
            transcript = ""
            if hasattr(msg, "transcript") and msg.transcript:
                transcript = msg.transcript
            is_final = (hasattr(msg, "event") and msg.event == 'EndOfTurn')
            response_data = {
            "text": transcript,
            "is_final": is_final
            }
            asyncio.create_task(ws.send_json(response_data))

        conn.on(EventType.OPEN, lambda _: print("Deepgram connected"))
        conn.on(EventType.MESSAGE, on_message)
        conn.on(EventType.ERROR, lambda e: print("Deepgram error:", e))
        conn.on(EventType.CLOSE, lambda _: print("Deepgram closed"))

        task = asyncio.create_task(conn.start_listening())

        try:
            while True:
                message = await ws.receive()
                if message["type"] == "websocket.disconnect":
                    break

                if "bytes" in message and message["bytes"]:
                    await conn._send(message["bytes"])
                elif "text" in message and message["text"] == "flush":
                    await conn.finish()

        except Exception as e:
            print("WebSocket error:", e)
        finally:
            task.cancel()
            # await ws.close()
# AI Service routers
app.include_router(ai_voice_router, prefix="/api", tags=["AI Service - Voice"])
app.include_router(ai_chat_router, prefix="/api", tags=["AI Service - Chat"])
app.include_router(ai_file_router, prefix="/api", tags=["AI Service - Files"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
