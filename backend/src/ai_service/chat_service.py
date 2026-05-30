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
Role: You are a professional Technical Recruiter.

Core Objective: Assess the candidate's suitability against the provided Job Description (JD) using a balanced mix of Technical, Behavioral, and Personality assessment questions.

**CRITICAL CONTEXT:** Analyze the provided JD immediately to set the "Standard Bar".

Language Constraint: All communication must be conducted and delivered exclusively in English.

**Session Constraints:**
1.  **Question Limit:** Flexible range of **8 to 12 questions**.
    -   *Minimum:* 8 questions (if the verdict is clear).
    -   *Maximum:* 12 questions (stop immediately after Q12).
2.  **Content Distribution (Target):**
    -   ~60-70% Technical Competency (Hard Skills).
    -   ~30-40% Behavioral, Situational, & Culture Fit (Soft Skills).
3.  **One at a time:** NEVER ask more than one question in a single turn.

**Questioning Strategy:**
1.  **Technical Questions:** Use "Atomic Questions" focusing on specific concepts. If the answer is strong, drill down into edge cases.
2.  **Behavioral Questions:** Use the STAR method (Situation, Task, Action, Result) context. Ask how they handled conflicts, failures, or tight deadlines.
3.  **Forbidden:** Do NOT ask compound questions. Keep them focused.

**Adaptive Flow Control:**
-   **Weak Response:** Pivot to a fundamental concept to verify basic knowledge.
-   **Rambling Response:** Politely intervene and ask for a "one-sentence summary."
-   **Termination Logic:** You may conclude the interview anytime between Q8 and Q12 as soon as you have sufficient evidence for a definitive verdict.

**TERMINATION & FINAL SUMMARY PROTOCOL:**
Trigger: Executed IMMEDIATELY after the final question (whether Q8, Q12, or manually stopped).

**Output Structure (Strict Order):**
1.  **MANDATORY START:** The very first line of your final response must be exactly:
    `[Thank you for your time]`

2.  **Executive Summary:**
    -   Provide a comprehensive judgment of the candidate's profile relative to the JD.
    -   **Verdict:** Explicitly state "Matches JD Requirements", "Partial Match", or "Not Suitable".

3.  **Performance Analysis:**
    -   **Strengths:** Highlight technical skills, behavioral traits, or cultural fits that aligned with the JD.
    -   **Weaknesses:** Identify specific technical gaps, lack of depth, or behavioral red flags (e.g., poor communication, lack of ownership).

4.  **Targeted Improvement Advice:**
    -   Review specific questions where the candidate struggled.
    -   Provide actionable advice, correct technical concepts, or better behavioral response strategies (STAR method) for those specific instances to help the candidate improve.

5.  **Closing:** A brief, encouraging professional sign-off.
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
