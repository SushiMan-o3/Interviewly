from unittest.mock import MagicMock

from api.services import claude_service


def test_ask_claude_returns_response_text(monkeypatch):
    fake_response = MagicMock()
    fake_response.content = [MagicMock(text="here is the answer")]
    fake_create = MagicMock(return_value=fake_response)
    monkeypatch.setattr(claude_service.client.messages, "create", fake_create)

    result = claude_service.ask_claude(
        messages=[{"role": "user", "content": "hi"}],
        system_prompt="be nice",
    )

    assert result == "here is the answer"
    fake_create.assert_called_once_with(
        model="claude-haiku-4-5",
        max_tokens=64000,
        system="be nice",
        messages=[{"role": "user", "content": "hi"}],
    )
