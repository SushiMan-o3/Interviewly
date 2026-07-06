from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from api.schemas.response import Response


class QuestionBase(BaseModel):
    sequence_number: int
    question_text: str
    question_type: Optional[str] = None
    parent_question_id: Optional[int] = None


class QuestionCreate(QuestionBase):
    interview_id: int


class Question(QuestionBase):
    id: int
    interview_id: int
    asked_at: Optional[datetime] = None
    responses: list[Response] = []

    class Config:
        from_attributes = True
