import io

import speech_recognition as sr
from deepgram import DeepgramClient

from api.config import DEEPGRAM_API_KEY, STT_MODEL, TTS_MODEL

_client = DeepgramClient(api_key=DEEPGRAM_API_KEY) if DEEPGRAM_API_KEY else None
_recognizer = sr.Recognizer()


def transcribe_audio(audio_bytes: bytes) -> str:
    """Speech-to-text: uses Deepgram if configured, otherwise falls back to
    SpeechRecognition's free Google Web Speech API recognizer."""
    if _client is None:
        with sr.AudioFile(io.BytesIO(audio_bytes)) as source:
            audio = _recognizer.record(source)
        return _recognizer.recognize_google(audio)

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
