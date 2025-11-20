from fastapi import APIRouter
from fastapi.responses import Response
import base64

from ai_service.schemas import SimpleTextRequest, TextToVoiceResponse
import ai_service.service as service

router = APIRouter()


@router.post("/chat/female-voice", response_model=TextToVoiceResponse)
def text_to_female_voice(request: SimpleTextRequest):
    """
    Convert text to speech with female voice (Clara - English).
    """
    return service.text_to_female_voice(request)


@router.post("/chat/male-voice", response_model=TextToVoiceResponse)
def text_to_male_voice(request: SimpleTextRequest):
    """
    Convert text to speech with male voice (Matt - English).
    """
    return service.text_to_male_voice(request)


@router.post("/chat/female-voice/audio")
def text_to_female_voice_audio(request: SimpleTextRequest):
    """
    Convert text to speech with female voice. Returns audio file directly.
    """
    result = service.text_to_female_voice(request)

    if result["success"]:
        audio_bytes = base64.b64decode(result["audio_data"])
        media_type = "audio/mpeg" if result["format"] == "mp3" else "audio/wav"
        return Response(
            content=audio_bytes,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="female_voice.{result["format"]}"'
            },
        )
    else:
        raise Exception(result["message"])


@router.post("/chat/male-voice/audio")
def text_to_male_voice_audio(request: SimpleTextRequest):
    """
    Convert text to speech with male voice. Returns audio file directly.
    """
    result = service.text_to_male_voice(request)

    if result["success"]:
        audio_bytes = base64.b64decode(result["audio_data"])
        media_type = "audio/mpeg" if result["format"] == "mp3" else "audio/wav"
        return Response(
            content=audio_bytes,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="male_voice.{result["format"]}"'
            },
        )
    else:
        raise Exception(result["message"])
