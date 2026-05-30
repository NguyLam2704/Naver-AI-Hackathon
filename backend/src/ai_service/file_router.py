from fastapi import APIRouter, UploadFile, File
import uuid
import os
import aiofiles

from ai_service.file_schemas import FileUploadResponse, FileListResponse
import ai_service.file_service as file_service

router = APIRouter()

# Directory to store uploaded files temporarily
# On Vercel (Lambda), only /tmp is writable
UPLOAD_DIR = "/tmp/uploads" if os.getenv("VERCEL") else "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/files/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload file to Gemini API and return URI for use in chat.
    """
    file_path = None
    try:
        # Save file temporarily
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")

        async with aiofiles.open(file_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)

        # Upload to Gemini
        result = file_service.upload_file_to_gemini(
            file_path=file_path, display_name=file.filename
        )

        return FileUploadResponse(**result)

    finally:
        # Clean up temporary file
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass


@router.get("/files", response_model=FileListResponse)
def list_files():
    """
    List all uploaded files.

    Returns:
        List of files with metadata
    """
    result = file_service.list_gemini_files()
    return FileListResponse(**result)


@router.get("/files/{file_name:path}")
def get_file(file_name: str):
    """
    Get file metadata from Gemini API

    Args:
        file_name: File name (e.g., files/abc-123)

    Example:
        GET /files/files/abc-123
    """
    return file_service.get_gemini_file(file_name)


@router.delete("/files/{file_name:path}")
def delete_file(file_name: str):
    """
    Delete a file from Gemini API

    Args:
        file_name: File name (e.g., files/abc-123)

    Example:
        DELETE /files/files/abc-123
    """
    return file_service.delete_gemini_file(file_name)
