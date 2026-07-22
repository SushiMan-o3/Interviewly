from deepgram import DeepgramClient

from api.config import DEEPGRAM_API_KEY, STT_MODEL, TTS_MODEL

_client = DeepgramClient(api_key=DEEPGRAM_API_KEY)


def transcribe_audio(audio_bytes: bytes) -> str:
    """Speech-to-text via Deepgram."""
    response = _client.listen.v1.media.transcribe_file(
        request=audio_bytes,
        model=STT_MODEL,
        smart_format=True,
    )
    return response.results.channels[0].alternatives[0].transcript


def synthesize_speech(text: str) -> bytes:
    """Text-to-speech via Deepgram. Returns raw audio bytes."""
    audio_chunks = _client.speak.v1.audio.generate(text=text, model=TTS_MODEL)
    return b"".join(audio_chunks)
