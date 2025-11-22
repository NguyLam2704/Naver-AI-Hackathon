from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

# Get the backend directory (parent of src)
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    """Application settings"""

    app_name: str = "Naver AI Hackathon API"
    app_version: str = "1.0.0"
    debug: bool = True

    # Database - PostgreSQL
    # Use a default value that won't crash if not set, or make it Optional
    database_url: str = "sqlite:///./test.db"

    # CORS
    # Remove "*" because it conflicts with allow_credentials=True in CORSMiddleware
    cors_origins: list = ["http://localhost:3000", "http://localhost:3001"]

    # API
    api_v1_prefix: str = "/api/v1"

    # CLOVA Voice API
    clova_voice_client_id: str = ""
    clova_voice_client_secret: str = ""
    clova_api_url: str = "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts"

    # Gemini API
    gemini_api_key: str = ""

    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
