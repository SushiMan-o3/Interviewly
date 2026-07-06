from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ResponseBase(BaseModel):
    transcript_text: Optional[str] = None
    response_time_seconds: Optional[float] = None


class ResponseCreate(ResponseBase):
    question_id: int


class Response(ResponseBase):
    id: int
    question_id: int
    score: Optional[float] = None
    feedback: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
