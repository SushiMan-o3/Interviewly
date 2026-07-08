from fastapi import APIRouter, Depends, HTTPException, WebSocket, status
from sqlalchemy.orm import Session

from api.database import get_db
from api.models import Interview as InterviewModel
from api.models import Question as QuestionModel
from api.models import Response as ResponseModel
from api.models import User as UserModel
from api.prompts import INTERVIEWER_SYSTEM_PROMPT
from api.schemas.interview import Interview, InterviewCreate, InterviewSummary
from api.schemas.question import Question
from api.schemas.response import Response
from api.services.claude_service import ask_claude
from api.services.security import get_current_user
from api.services.speech_service import synthesize_speech, transcribe_audio

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.get("/", response_model=list[InterviewSummary])
def get_interviews(
    skip: int = 0,
    limit: int = 6,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return (
        db.query(InterviewModel)
        .filter(InterviewModel.user_id == current_user.id)
        .order_by(InterviewModel.created_at.asc(), InterviewModel.id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{interview_id}", response_model=Interview)
def get_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    interview = (
        db.query(InterviewModel)
        .filter(
            InterviewModel.id == interview_id,
            InterviewModel.user_id == current_user.id,
        )
        .first()
    )
    if interview is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    return interview


@router.post("/create_interview", response_model=Interview)
def create_interview(
    interview: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    new_interview = InterviewModel(
        user_id=current_user.id,
        company=interview.company,
        role=interview.role,
        interview_type=interview.interview_type,
        difficulty=interview.difficulty,
        planned_duration=interview.planned_duration,
    )
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)
    return new_interview


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    owned_interview_ids = db.query(InterviewModel.id).filter(
        InterviewModel.id == interview_id,
        InterviewModel.user_id == current_user.id,
    )
    question_ids = db.query(QuestionModel.id).filter(
        QuestionModel.interview_id.in_(owned_interview_ids)
    )

    db.query(ResponseModel).filter(ResponseModel.question_id.in_(question_ids)).delete(
        synchronize_session=False
    )
    db.query(QuestionModel).filter(QuestionModel.interview_id.in_(owned_interview_ids)).delete(
        synchronize_session=False
    )
    deleted = (
        db.query(InterviewModel)
        .filter(InterviewModel.id == interview_id, InterviewModel.user_id == current_user.id)
        .delete(synchronize_session=False)
    )

    if deleted == 0:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

    db.commit()


@router.websocket("/interview_session/{interview_id}")
async def interview_session(
    websocket: WebSocket,
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    pass
