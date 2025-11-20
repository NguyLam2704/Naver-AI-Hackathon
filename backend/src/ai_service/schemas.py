from pydantic import BaseModel, Field
from typing import Optional


class TextToVoiceRequest(BaseModel):
    """Schema for text-to-voice request"""

    text: str = Field(
        ..., min_length=1, max_length=2000, description="Text to convert to speech"
    )
    speaker: str = Field(
        default="nara", description="Voice speaker (nara, jinho, clara, matt, etc.)"
    )
    volume: int = Field(default=0, ge=-5, le=5, description="Volume (-5 to 5)")
    speed: int = Field(default=0, ge=-5, le=5, description="Speed (-5 to 5)")
    pitch: int = Field(default=0, ge=-5, le=5, description="Pitch (-5 to 5)")
    format: str = Field(
        default="mp3", pattern="^(mp3|wav)$", description="Audio format"
    )


class TextToVoiceResponse(BaseModel):
    """Schema for text-to-voice response"""

    success: bool
    message: str
    audio_data: Optional[str] = None  # Base64 encoded audio
    format: str


class SimpleTextRequest(BaseModel):
    """Schema for simple text-to-voice request (only text)"""

    text: str = Field(
        ..., min_length=1, max_length=2000, description="Text to convert to speech"
    )
    volume: int = Field(default=0, ge=-5, le=5, description="Volume (-5 to 5)")
    speed: int = Field(default=0, ge=-5, le=5, description="Speed (-5 to 5)")
    pitch: int = Field(default=0, ge=-5, le=5, description="Pitch (-5 to 5)")
    format: str = Field(
        default="mp3", pattern="^(mp3|wav)$", description="Audio format"
    )
