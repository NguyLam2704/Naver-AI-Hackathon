import os
import mimetypes
from typing import List, Dict
from google import genai

from config import get_settings
from exceptions import BadRequestException

settings = get_settings()


def get_gemini_client():
    """Initialize and return Gemini client"""
    api_key = settings.gemini_api_key

    if not api_key:
        raise BadRequestException("GEMINI_API_KEY not configured in .env file")

    return genai.Client(api_key=api_key)


def get_mime_type(file_path: str) -> str:
    """
    Get MIME type for a file

    Args:
        file_path: Path to the file

    Returns:
        MIME type string
    """
    mime_type, _ = mimetypes.guess_type(file_path)

    if not mime_type:
        # Fallback for common types
        ext = os.path.splitext(file_path)[1].lower()
        mime_type_map = {
            ".pdf": "application/pdf",
            ".doc": "application/msword",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls": "application/vnd.ms-excel",
            ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".ppt": "application/vnd.ms-powerpoint",
            ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".txt": "text/plain",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".bmp": "image/bmp",
            ".webp": "image/webp",
            ".mp3": "audio/mpeg",
            ".wav": "audio/wav",
            ".mp4": "video/mp4",
            ".avi": "video/x-msvideo",
            ".mov": "video/quicktime",
        }
        mime_type = mime_type_map.get(ext, "application/octet-stream")

    return mime_type


def upload_file_to_gemini(file_path: str, display_name: str = None) -> Dict:
    """
    Upload a file to Gemini API and return file metadata

    Args:
        file_path: Local path to the file
        display_name: Optional display name for the file

    Returns:
        Dictionary with file metadata including URI
    """
    try:
        client = get_gemini_client()

        # Check if file exists
        if not os.path.exists(file_path):
            raise BadRequestException(f"File not found: {file_path}")

        # Get MIME type
        mime_type = get_mime_type(file_path)
        print(f"Uploading file to Gemini: {file_path} (MIME: {mime_type})")

        # Upload file with config
        # Note: Use binary mode to avoid encoding issues with Vietnamese filenames
        from google.genai import types as genai_types

        config = genai_types.UploadFileConfig(mime_type=mime_type)

        # Read file as bytes to avoid encoding issues
        with open(file_path, "rb") as f:
            file_content = f.read()

        # Create a temporary file-like object from bytes
        import io

        file_obj = io.BytesIO(file_content)
        file_obj.name = os.path.basename(file_path)

        uploaded_file = client.files.upload(file=file_obj, config=config)

        print(f"File uploaded: {uploaded_file.name}, State: {uploaded_file.state}")

        # Wait for file to be processed
        import time

        max_wait = 30
        wait_time = 0

        while uploaded_file.state == "PROCESSING" and wait_time < max_wait:
            time.sleep(1)
            wait_time += 1
            uploaded_file = client.files.get(name=uploaded_file.name)
            print(f"Processing... State: {uploaded_file.state}")

        if uploaded_file.state != "ACTIVE":
            raise BadRequestException(
                f"File processing failed. State: {uploaded_file.state}"
            )

        # Return file metadata
        return {
            "success": True,
            "file_uri": uploaded_file.uri,
            "file_name": uploaded_file.name,
            "mime_type": uploaded_file.mime_type,
            "size_bytes": (
                int(uploaded_file.size_bytes) if uploaded_file.size_bytes else 0
            ),
            "state": uploaded_file.state,
            "display_name": uploaded_file.display_name or os.path.basename(file_path),
        }

    except Exception as e:
        raise BadRequestException(f"Failed to upload file: {str(e)}")


def list_gemini_files() -> Dict:
    """
    List all files uploaded to Gemini API

    Returns:
        Dictionary with list of files
    """
    try:
        client = get_gemini_client()

        files_list = []
        for file in client.files.list():
            files_list.append(
                {
                    "file_name": file.name,
                    "file_uri": file.uri,
                    "display_name": file.display_name,
                    "mime_type": file.mime_type,
                    "size_bytes": int(file.size_bytes) if file.size_bytes else 0,
                    "state": file.state,
                    "create_time": (
                        str(file.create_time) if hasattr(file, "create_time") else None
                    ),
                }
            )

        return {
            "success": True,
            "files": files_list,
            "count": len(files_list),
        }

    except Exception as e:
        raise BadRequestException(f"Failed to list files: {str(e)}")


def delete_gemini_file(file_name: str) -> Dict:
    """
    Delete a file from Gemini API

    Args:
        file_name: File name (e.g., files/abc-123)

    Returns:
        Success status
    """
    try:
        client = get_gemini_client()

        client.files.delete(name=file_name)

        return {
            "success": True,
            "message": f"File {file_name} deleted successfully",
        }

    except Exception as e:
        raise BadRequestException(f"Failed to delete file: {str(e)}")


def get_gemini_file(file_name: str) -> Dict:
    """
    Get file metadata from Gemini API

    Args:
        file_name: File name (e.g., files/abc-123)

    Returns:
        File metadata
    """
    try:
        client = get_gemini_client()

        file = client.files.get(name=file_name)

        return {
            "success": True,
            "file_name": file.name,
            "file_uri": file.uri,
            "display_name": file.display_name,
            "mime_type": file.mime_type,
            "size_bytes": int(file.size_bytes) if file.size_bytes else 0,
            "state": file.state,
            "create_time": (
                str(file.create_time) if hasattr(file, "create_time") else None
            ),
        }

    except Exception as e:
        raise BadRequestException(f"Failed to get file: {str(e)}")
