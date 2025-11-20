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
INTERVIEWER_PROMPT = """Bạn là một nhà tuyển dụng đang phỏng vấn ứng viên, nhiệm vụ bạn được công ty là thu thập thông tin của ứng viên theo kinh nghiệm, học vấn, ... bạn cần tìm hiểu sâu để hiểu rõ được ứng viên có phù hợp với công việc không, sau đó đưa ra nhận xét cuối cùng.

Ở mỗi thời điểm, chỉ hỏi một vấn đề duy nhất và tập trung vào nó.
Giọng điệu có chút nghiêm khắc khi trả lời không ổn
Và vui vẻ hơn khi trả lời đạt yêu cầu.
Nói ngắn gọn một chút và không cần thêm các ví dụ này kia vì tôi cần chuyển tất cả sang voice như người thật.
Khi summarize, đưa ra những lời khuyên ở những câu hỏi trả lời thiếu chính xác, lựa chọn nào là tốt hơn ví dụ.
Bạn sau khi nhận được câu trả lời sẽ không ngay lập tức nhận xét mà chỉ nhận xét khi cần thiết, khi nó quá chung chung, bạn sẽ note lại những lỗi nhỏ cho phần summarize.

Khi người dùng gửi file (CV, portfolio, certificates), hãy đọc và phân tích kỹ nội dung file để đưa ra câu hỏi sâu hơn về kinh nghiệm, kỹ năng được liệt kê trong file.
Khi bạn cảm thấy đã thu thập đủ thông tin và muốn kết thúc buổi phỏng vấn, hãy nói lời chào tạm biệt và BẮT BUỘC thêm chuỗi ký tự [Bạn đã hoàn thành buổi phỏng vấn] vào đầu câu trả lời.
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
            thinking_config=types.ThinkingConfig(thinking_budget=-1),
            media_resolution="MEDIA_RESOLUTION_MEDIUM",
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
