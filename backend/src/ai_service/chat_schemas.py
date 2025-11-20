from pydantic import BaseModel, Field
from typing import Optional, List


class ChatRequest(BaseModel):
    """Request schema for chat endpoint"""

    message: str = Field(..., description="User's message to the interviewer")
    session_id: Optional[str] = Field(
        None, description="Session ID for conversation continuity"
    )


class ChatWithFilesRequest(BaseModel):
    """Request schema for chat with files"""

    message: str = Field(..., description="User's message to the interviewer")
    file_urls: Optional[List[str]] = Field(
        None, description="List of file URLs (Google Cloud Storage or public URLs)"
    )
    session_id: Optional[str] = Field(
        None, description="Session ID for conversation continuity"
    )


class ChatResponse(BaseModel):
    """Response schema for chat endpoint"""

    response: str = Field(..., description="AI interviewer's response")
    session_id: str = Field(..., description="Session ID for this conversation")
    success: bool = Field(default=True)
