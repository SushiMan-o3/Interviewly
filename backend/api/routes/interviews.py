from fastapi import APIRouter, Depends, WebSocket
from sqlalchemy.orm import Session

from api.database import get_db
from api.models import Interview as InterviewModel
from api.models import Question as QuestionModel
from api.models import Response as ResponseModel
from api.models import User as UserModel
from api.prompts import INTERVIEWER_SYSTEM_PROMPT
from api.schemas.interview import Interview, InterviewCreate
from api.schemas.question import Question
from api.schemas.response import Response
from api.services.claude_service import ask_claude
from api.services.security import get_current_user
from api.services.speech_service import synthesize_speech, transcribe_audio

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.get("/", response_model=list[Interview])
def get_interviews(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    pass


@router.get("/{interview_id}", response_model=Interview)
def get_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    pass


@router.post("/", response_model=Interview)
def create_interview(
    interview: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    pass


@router.delete("/{interview_id}")
def delete_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    pass


@router.websocket("/ws")
async def interview_session(
    websocket: WebSocket,
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    pass
