import os
import mimetypes
from typing import Dict, Generator, List, Optional
from google import genai
from google.genai import types

from config import get_settings
from exceptions import BadRequestException

settings = get_settings()

# Store conversation history by session_id
conversation_sessions: Dict[str, list] = {}

# System instruction for the interviewer
INTERVIEWER_PROMPT = """
Role: You are a professional Recruiter/Interviewer.

Core Objective: Conduct an in-depth interview to assess the candidate's suitability for the target position by thoroughly gathering information on their professional experience, education, skills, and accomplishments.

Language Constraint: All communication (questions, feedback, and summary) must be conducted and delivered exclusively in English.

Interaction Rules & Tone:

Question Focus: At any given time, ask only one single, focused question on a specific topic.

Brevity: Maintain brevity and professional tone. Avoid adding unnecessary examples or verbose explanations, as the output is intended for voice synthesis.

Feedback Mechanism:

Use a slightly strict/formal tone when the candidate's answer is vague, general, or unsatisfactory.

Use a positive/encouraging tone when the answer meets expectations or is highly relevant.

Do not provide immediate, comprehensive feedback after every answer. Only intervene immediately when an answer is too generic or insufficient, demanding deeper clarification. Note minor deficiencies for the final summary.

File Analysis (CV, Portfolio, Certificates): When the user provides a file, read and analyze the content carefully to formulate deeper, specific questions related to the experience, skills, or achievements listed in the document.

Final Summary & Conclusion:

Conclude the interview when sufficient information has been gathered.

The final summary must include constructive advice for poor/vague answers, suggesting better approaches or examples for future reference.

The closing statement MUST begin with the exact string: [Thank you for your time]
"""


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


def chat_stream(
    message: str, file_uris: Optional[List[str]] = None, session_id: str = None
) -> Generator[str, None, None]:
    """
    Send message to AI interviewer with streaming response

    Uses pre-uploaded Gemini file URIs (from /files/upload endpoint)

    Args:
        message: User's message
        file_uris: Optional list of Gemini file URIs (e.g., files/abc-123)
        session_id: Session ID for conversation history

    Yields:
        Chunks of AI interviewer's response
    """
    try:
        client = get_gemini_client()

        # Get or create conversation history
        if session_id not in conversation_sessions:
            conversation_sessions[session_id] = []

        # Build parts for the message
        parts = [types.Part.from_text(text=message)]

        # Add files from URIs (pre-uploaded files)
        if file_uris:
            for file_uri in file_uris:
                try:
                    print(f"[CHAT] Using pre-uploaded file: {file_uri}")

                    # Get file metadata to verify it exists and is ready
                    file_info = client.files.get(name=file_uri)

                    if file_info.state == "ACTIVE":
                        parts.append(
                            types.Part.from_uri(
                                file_uri=file_info.uri,
                                mime_type=file_info.mime_type,
                            )
                        )
                        print(f"[CHAT] File ready: {file_info.uri}")
                    else:
                        error_msg = f"[Lỗi: File {file_uri} chưa sẵn sàng - State: {file_info.state}]"
                        print(error_msg)
                        parts.append(types.Part.from_text(text=error_msg))
                except Exception as e:
                    error_msg = f"[Lỗi khi sử dụng file URI: {file_uri} - {str(e)}]"
                    print(error_msg)
                    parts.append(types.Part.from_text(text=error_msg))

        # Add user message (with or without files) to history
        conversation_sessions[session_id].append(
            types.Content(role="user", parts=parts)
        )

        # Configure generation
        tools = [types.Tool(googleSearch=types.GoogleSearch())]

        generate_content_config = types.GenerateContentConfig(
            tools=tools,
            system_instruction=[types.Part.from_text(text=INTERVIEWER_PROMPT)],
        )

        # Generate streaming response with "Stream & Accumulate" technique
        # - Stream: Yield each chunk immediately to frontend for real-time display
        # - Accumulate: Concatenate all chunks to get full response for logic processing
        full_response = ""
        for chunk in client.models.generate_content_stream(
            model="gemini-flash-latest",
            contents=conversation_sessions[session_id],
            config=generate_content_config,
        ):
            if chunk.text:
                full_response += chunk.text  # Accumulate: Gom từng chunk lại
                yield chunk.text  # Stream: Đẩy ngay xuống frontend

        # Now we have full_response for logic processing
        # Can check for special markers like [END_SESSION], save to DB, etc.
        print(f"[CHAT] Full response accumulated: {len(full_response)} characters")

        # Check if session should end
        if "[END_SESSION]" in full_response:
            print(f"[CHAT] Session {session_id} marked for completion")
            # Can add logic here to mark session as complete, generate summary, etc.

        # Add complete assistant response to history
        conversation_sessions[session_id].append(
            types.Content(
                role="model",
                parts=[types.Part.from_text(text=full_response)],
            )
        )

    except Exception as e:
        raise BadRequestException(f"Failed to get streaming response from AI: {str(e)}")


def clear_session(session_id: str) -> bool:
    """
    Clear conversation history for a session

    Args:
        session_id: Session ID to clear

    Returns:
        True if session was cleared, False if session didn't exist
    """
    if session_id in conversation_sessions:
        del conversation_sessions[session_id]
        return True
    return False
