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


ANSWER_FEEDBACK_TOOL = {
    "name": "answer_feedback_and_next_question",
    "description": (
        "Submit feedback and a rating for the candidate's most recent answer, "
        "along with the next interview question to ask them."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "feedback": {
                "type": "string",
                "description": (
                    "Brief, constructive feedback (2-4 sentences) on the candidate's "
                    "most recent answer."
                ),
            },
            "rating": {
                "type": "integer",
                "description": "Rating of the candidate's most recent answer, from 1 (poor) to 10 (excellent).",
                "minimum": 1,
                "maximum": 10,
            },
            "next_question": {
                "type": "string",
                "description": "The next interview question to ask the candidate.",
            },
        },
        "required": ["feedback", "rating", "next_question"],
    },
}


def ask_claude_with_feedback(messages: list[dict], system_prompt: str) -> dict:
    """Grades the candidate's most recent answer and generates the next question in one call."""
    response = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=2048,
        system=system_prompt,
        messages=messages,
        tools=[ANSWER_FEEDBACK_TOOL],
        tool_choice={"type": "tool", "name": ANSWER_FEEDBACK_TOOL["name"]},
    )
    for block in response.content:
        if block.type == "tool_use":
            return block.input
    raise ValueError("Claude did not return the expected tool call")


OVERALL_FEEDBACK_TOOL = {
    "name": "overall_interview_feedback",
    "description": (
        "Submit an overall score and feedback summarizing the candidate's performance "
        "across the entire interview."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "overall_score": {
                "type": "integer",
                "description": "Overall rating of the candidate's performance across the whole interview, from 1 (poor) to 10 (excellent).",
                "minimum": 1,
                "maximum": 10,
            },
            "feedback": {
                "type": "string",
                "description": (
                    "A few paragraphs summarizing the candidate's overall performance: "
                    "key strengths, areas for improvement, and any patterns across their "
                    "answers. This is for the candidate's private post-interview review."
                ),
            },
        },
        "required": ["overall_score", "feedback"],
    },
}


def ask_claude_overall_feedback(messages: list[dict], system_prompt: str) -> dict:
    """Summarizes the candidate's performance across the whole interview into a single score and feedback."""
    messages = messages + [
        {
            "role": "user",
            "content": (
                "The interview is now over. Based on the full conversation above, "
                "evaluate my overall performance across all the questions."
            ),
        }
    ]
    response = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=2048,
        system=system_prompt,
        messages=messages,
        tools=[OVERALL_FEEDBACK_TOOL],
        tool_choice={"type": "tool", "name": OVERALL_FEEDBACK_TOOL["name"]},
    )
    for block in response.content:
        if block.type == "tool_use":
            return block.input
    raise ValueError("Claude did not return the expected tool call")


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
