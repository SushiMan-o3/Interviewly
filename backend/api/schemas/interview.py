from datetime import datetime
from typing import Optional

from fastapi import UploadFile
from pydantic import BaseModel, ConfigDict, Field

from api.schemas.question import Question


class InterviewBase(BaseModel):
    company: str
    role: str
    interview_type: str
    difficulty: str
    planned_duration: int


class InterviewCreate(InterviewBase):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    resume: Optional[UploadFile] = None


class Interview(InterviewBase):
    id: int
    user_id: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    overall_score: Optional[float] = None
    feedback: Optional[str] = None
    completed: bool = False
    created_at: datetime
    QuestionAnswer: list[Question] = Field(default_factory=list, validation_alias="questions")

    class Config:
        from_attributes = True


class CompletedInterview(Interview):
    start_time: datetime
    end_time: datetime
    overall_score: float
    feedback: str
    completed: bool = True


class InterviewSummary(BaseModel):
    id: int
    user_id: int
    created_at: datetime
    completed: bool
    planned_duration: int
    interview_type: str
    difficulty: str
    role: str
    company: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    overall_score: Optional[float] = None

    class Config:
        from_attributes = True


class InterviewFeedbackOut(BaseModel):
    score: int
    feedback: str