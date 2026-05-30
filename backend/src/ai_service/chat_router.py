from fastapi import APIRouter, Form
from fastapi.responses import StreamingResponse
import uuid
import json
from typing import Optional

from ai_service.chat_schemas import ChatRequest, ChatResponse
import ai_service.chat_service as chat_service

router = APIRouter()


@router.post("/chat/stream")
async def send_chat_stream(
    message: str = Form(...),
    file_uris: Optional[str] = Form(None),  # JSON string of file URIs
    session_id: Optional[str] = Form(None),
):
    """
    Send message to AI interviewer with streaming response.
    Upload files via /files/upload first to get URIs.
    """
    # Generate session_id if not provided
    session_id = session_id or str(uuid.uuid4())

    # Parse file URIs from JSON string
    parsed_file_uris = []
    if file_uris:
        try:
            parsed_file_uris = json.loads(file_uris)
        except json.JSONDecodeError:
            # If not valid JSON, treat as single URI
            parsed_file_uris = [file_uris]

    def event_stream():
        """Generator for SSE stream"""
        try:
            # Send session_id first
            yield f"data: {json.dumps({'type': 'session_id', 'session_id': session_id}, ensure_ascii=False)}\n\n"

            # Stream AI response with file URIs
            for chunk in chat_service.chat_stream(
                message=message,
                file_uris=parsed_file_uris if parsed_file_uris else None,
                session_id=session_id,
            ):
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk}, ensure_ascii=False)}\n\n"

            # Send completion signal
            yield f"data: {json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream; charset=utf-8",
        },
    )


@router.delete("/chat/session/{session_id}")
def clear_chat_session(session_id: str):
    """
    Clear conversation history for a session

    Example: DELETE /chat/session/abc-123-def
    """
    success = chat_service.clear_session(session_id)

    if success:
        return {
            "success": True,
            "message": f"Session {session_id} cleared successfully",
        }
    else:
        return {"success": False, "message": f"Session {session_id} not found"}
