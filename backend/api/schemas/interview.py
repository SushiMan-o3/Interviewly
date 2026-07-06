from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from api.schemas.question import Question


class InterviewBase(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    interview_type: Optional[str] = None
    difficulty: Optional[str] = None
    planned_duration: Optional[int] = None


class InterviewCreate(InterviewBase):
    pass


class Interview(InterviewBase):
    id: int
    user_id: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    overall_score: Optional[float] = None
    feedback: Optional[str] = None
    created_at: datetime
    questions: list[Question] = []

    class Config:
        from_attributes = True
