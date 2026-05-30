import urllib.request
import urllib.parse
import base64
from typing import Dict

from ai_service.schemas import TextToVoiceRequest, SimpleTextRequest
from exceptions import BadRequestException
from config import get_settings

settings = get_settings()


def text_to_voice(tts_request: TextToVoiceRequest) -> Dict:
    """Convert text to speech using CLOVA Voice API"""
    client_id = settings.clova_voice_client_id
    client_secret = settings.clova_voice_client_secret
    api_url = settings.clova_api_url

    if not client_id or not client_secret:
        raise BadRequestException(
            "CLOVA Voice API credentials not configured in .env file"
        )

    if not api_url:
        raise BadRequestException("CLOVA API URL not configured in .env file")

    try:
        # Encode text for URL
        enc_text = urllib.parse.quote(tts_request.text)

        # Build request data
        data = (
            f"speaker={tts_request.speaker}"
            f"&volume={tts_request.volume}"
            f"&speed={tts_request.speed}"
            f"&pitch={tts_request.pitch}"
            f"&format={tts_request.format}"
            f"&text={enc_text}"
        )

        # API endpoint from .env
        url = api_url

        # Create request
        request = urllib.request.Request(url)
        request.add_header("X-NCP-APIGW-API-KEY-ID", client_id)
        request.add_header("X-NCP-APIGW-API-KEY", client_secret)

        # Send request
        response = urllib.request.urlopen(request, data=data.encode("utf-8"))
        rescode = response.getcode()

        if rescode == 200:
            # Read audio data
            audio_data = response.read()

            # Encode to base64 for JSON response
            audio_base64 = base64.b64encode(audio_data).decode("utf-8")

            return {
                "success": True,
                "message": "Text converted to speech successfully",
                "audio_data": audio_base64,
                "format": tts_request.format,
            }
        else:
            raise BadRequestException(f"CLOVA Voice API error: {rescode}")

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        raise BadRequestException(f"CLOVA Voice API error: {e.code} - {error_body}")
    except Exception as e:
        raise BadRequestException(f"Failed to convert text to speech: {str(e)}")


def text_to_female_voice(request: SimpleTextRequest) -> Dict:
    """Convert text to speech with FEMALE voice (Clara)"""
    tts_request = TextToVoiceRequest(
        text=request.text,
        speaker="clara",
        volume=request.volume,
        speed=request.speed,
        pitch=request.pitch,
        format=request.format,
    )
    return text_to_voice(tts_request)


def text_to_male_voice(request: SimpleTextRequest) -> Dict:
    """Convert text to speech with MALE voice (Matt)"""
    tts_request = TextToVoiceRequest(
        text=request.text,
        speaker="matt",
        volume=request.volume,
        speed=request.speed,
        pitch=request.pitch,
        format=request.format,
    )
    return text_to_voice(tts_request)
