from unittest.mock import MagicMock

from api.services import speech_service


def test_transcribe_audio_uses_deepgram_when_configured(monkeypatch):
    fake_client = MagicMock()
    alternative = MagicMock(transcript="hello from deepgram")
    fake_client.listen.v1.media.transcribe_file.return_value.results.channels = [
        MagicMock(alternatives=[alternative])
    ]
    monkeypatch.setattr(speech_service, "_client", fake_client)

    result = speech_service.transcribe_audio(b"raw-audio-bytes")

    assert result == "hello from deepgram"
    fake_client.listen.v1.media.transcribe_file.assert_called_once()


def test_transcribe_audio_falls_back_to_speech_recognition_when_no_deepgram_key(
    monkeypatch,
):
    monkeypatch.setattr(speech_service, "_client", None)

    fake_source = MagicMock()
    fake_audio_file = MagicMock()
    fake_audio_file.__enter__.return_value = fake_source
    monkeypatch.setattr(
        speech_service.sr, "AudioFile", MagicMock(return_value=fake_audio_file)
    )

    fake_recognizer = MagicMock()
    fake_recognizer.record.return_value = "recorded-audio"
    fake_recognizer.recognize_google.return_value = "hello from google"
    monkeypatch.setattr(speech_service, "_recognizer", fake_recognizer)

    result = speech_service.transcribe_audio(b"raw-audio-bytes")

    assert result == "hello from google"
    fake_recognizer.recognize_google.assert_called_once_with("recorded-audio")


def test_synthesize_speech_uses_deepgram_when_configured(monkeypatch):
    fake_client = MagicMock()
    fake_client.speak.v1.audio.generate.return_value = [b"chunk1", b"chunk2"]
    monkeypatch.setattr(speech_service, "_client", fake_client)

    result = speech_service.synthesize_speech("hello")

    assert result == b"chunk1chunk2"
    fake_client.speak.v1.audio.generate.assert_called_once()


def test_synthesize_speech_falls_back_to_gtts_when_no_deepgram_key(monkeypatch):
    monkeypatch.setattr(speech_service, "_client", None)

    fake_gtts_instance = MagicMock()
    fake_gtts_instance.write_to_fp.side_effect = lambda fp: fp.write(b"fake-mp3-bytes")
    monkeypatch.setattr(
        speech_service, "gTTS", MagicMock(return_value=fake_gtts_instance)
    )

    result = speech_service.synthesize_speech("hello")

    assert result == b"fake-mp3-bytes"
