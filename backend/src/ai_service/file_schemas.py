from pydantic import BaseModel, Field
from typing import Optional


class FileUploadResponse(BaseModel):
    """Response schema for file upload"""

    success: bool = Field(default=True)
    file_uri: str = Field(..., description="Gemini file URI (e.g., files/abc-123)")
    file_name: str = Field(..., description="File name")
    mime_type: str = Field(..., description="MIME type of the file")
    size_bytes: int = Field(..., description="File size in bytes")
    state: str = Field(..., description="Processing state: PROCESSING or ACTIVE")
    display_name: Optional[str] = Field(None, description="Display name of the file")


class FileListResponse(BaseModel):
    """Response schema for listing files"""

    success: bool = Field(default=True)
    files: list = Field(..., description="List of uploaded files")
    count: int = Field(..., description="Number of files")
