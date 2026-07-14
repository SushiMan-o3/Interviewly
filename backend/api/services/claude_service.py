import base64

from anthropic import Anthropic

from api.config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL
from api.prompts import RESUME_TRANSCRIPTION_PROMPT

client = Anthropic(api_key=ANTHROPIC_API_KEY)


def ask_claude(messages: list[dict], system_prompt: str) -> str:
    response = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=64000,
        system=system_prompt,
        messages=messages,
    )
    return response.content[0].text


def transcribe_resume(pdf_bytes: bytes) -> str:
    """Extracts the text content of a resume PDF using Claude's PDF support."""
    response = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=8192,
        system=RESUME_TRANSCRIPTION_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": base64.standard_b64encode(pdf_bytes).decode("utf-8"),
                        },
                    },
                ],
            }
        ],
    )
    return response.content[0].text
