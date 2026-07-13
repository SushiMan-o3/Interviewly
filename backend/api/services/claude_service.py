from anthropic import Anthropic

from api.config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL

client = Anthropic(api_key=ANTHROPIC_API_KEY)


def ask_claude(messages: list[dict], system_prompt: str) -> str:
    response = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=64000,
        system=system_prompt,
        messages=messages,
    )
    return response.content[0].text
