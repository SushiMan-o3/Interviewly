import asyncio
import json
from datetime import datetime, timezone
from typing import Literal

from sqlalchemy.orm import Session

from api.models import Interview as InterviewModel
from api.models import Question as QuestionModel
from api.models import Response as ResponseModel
from api.prompts import (
    FEEDBACK_SYSTEM_PROMPT,
    INTERVIEWER_SYSTEM_PROMPT,
    NEXT_ACTION_SYSTEM_PROMPT,
    NEXT_QUESTION_SYSTEM_PROMPT,
)
from api.schemas.interview import InterviewFeedbackOut
from api.services.claude_service import ask_claude

NextAction = Literal["follow_up", "next_question", "end_interview"]

FEEDBACK_JSON_INSTRUCTION = (
    'Respond with strict JSON only, no markdown, in the form '
    '{"score": <integer 1-10>, "feedback": "<specific, actionable feedback>"}.'
)


def _format_interview_history(interview: InterviewModel) -> str:
    lines = []
    for question in interview.questions:
        lines.append(f"Q{question.sequence_number}: {question.question_text}")
        for response in question.responses:
            if response.transcript_text:
                lines.append(f"A: {response.transcript_text}")
    return "\n".join(lines) if lines else "No questions asked yet."


def _parse_feedback(raw: str) -> InterviewFeedbackOut:
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.lower().startswith("json"):
            text = text[len("json"):].strip()
    data = json.loads(text)
    return InterviewFeedbackOut(score=int(data["score"]), feedback=str(data["feedback"]))


def decide_next_action(
    interview: InterviewModel, question: QuestionModel, response: ResponseModel
) -> NextAction:
    elapsed_minutes = (datetime.now(timezone.utc) - interview.start_time).total_seconds() / 60
    remaining_minutes = interview.planned_duration - elapsed_minutes
    if remaining_minutes <= 0:
        return "end_interview"

    decision = ask_claude(
        messages=[
            {
                "role": "user",
                "content": (
                    f"Question: {question.question_text}\n"
                    f"Candidate's answer: {response.transcript_text}\n"
                    f"Time remaining in interview: {remaining_minutes:.1f} minutes."
                ),
            }
        ],
        system_prompt=NEXT_ACTION_SYSTEM_PROMPT,
    )
    return "follow_up" if "FOLLOW_UP" in decision.upper() else "next_question"


def get_follow_up_question(question: QuestionModel, response: ResponseModel) -> str:
    return ask_claude(
        messages=[
            {
                "role": "user",
                "content": (
                    f"Original question: {question.question_text}\n"
                    f"Candidate's answer: {response.transcript_text}\n\n"
                    "Ask a natural, specific follow-up question based on this answer."
                ),
            }
        ],
        system_prompt=INTERVIEWER_SYSTEM_PROMPT,
    )


def get_next_question(interview: InterviewModel) -> str:
    history = _format_interview_history(interview)
    return ask_claude(
        messages=[
            {
                "role": "user",
                "content": (
                    f"Company: {interview.company}\n"
                    f"Role: {interview.role}\n"
                    f"Interview type: {interview.interview_type}\n"
                    f"Difficulty: {interview.difficulty}\n\n"
                    f"Questions asked so far:\n{history}\n\n"
                    "Correct the candidate's last answer, then ask the next interview question."
                ),
            }
        ],
        system_prompt=NEXT_QUESTION_SYSTEM_PROMPT,
    )


async def evaluate_response(question: QuestionModel, response: ResponseModel, db: Session) -> None:
    raw = await asyncio.to_thread(
        ask_claude,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Question: {question.question_text}\n"
                    f"Candidate's answer: {response.transcript_text}\n\n"
                    f"{FEEDBACK_JSON_INSTRUCTION}"
                ),
            }
        ],
        system_prompt=FEEDBACK_SYSTEM_PROMPT,
    )
    feedback = _parse_feedback(raw)
    response.score = feedback.score
    response.feedback = feedback.feedback
    db.commit()


def evaluate_interview(interview_id: int, db: Session) -> InterviewFeedbackOut:
    interview = db.query(InterviewModel).filter(InterviewModel.id == interview_id).first()
    if interview is None:
        raise ValueError(f"Interview {interview_id} not found")

    transcript = _format_interview_history(interview)
    raw = ask_claude(
        messages=[
            {
                "role": "user",
                "content": (
                    f"Full interview transcript:\n{transcript}\n\n{FEEDBACK_JSON_INSTRUCTION}"
                ),
            }
        ],
        system_prompt=FEEDBACK_SYSTEM_PROMPT,
    )
    feedback = _parse_feedback(raw)

    interview.overall_score = feedback.score
    interview.feedback = feedback.feedback
    interview.completed = True
    interview.end_time = datetime.now(timezone.utc)
    db.commit()

    return feedback
