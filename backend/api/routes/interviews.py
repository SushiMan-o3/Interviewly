from datetime import datetime
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    Form,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy.orm import Session

from api.database import get_db
from api.models import Interview as InterviewModel
from api.models import User as UserModel
from api.prompts import INTERVIEWER_SYSTEM_PROMPT
from api.schemas.interview import Interview, InterviewCreate, InterviewSummary
from api.schemas.question import Question
from api.schemas.response import Response
from api.services.claude_service import ask_claude, transcribe_resume
from api.services.security import get_current_user, get_user_from_token
from api.services.speech_service import synthesize_speech, transcribe_audio

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.get("/interviews", response_model=list[InterviewSummary])
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
    interview: Annotated[InterviewCreate, Form()],
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    resume_bytes = None
    if interview.resume is not None:
        if interview.resume.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Resume must be a PDF file")

        resume_bytes = interview.resume.file.read()
        if not resume_bytes.startswith(b"%PDF-"):
            raise HTTPException(status_code=400, detail="Resume must be a valid PDF file")
    elif current_user.additional_info is not None:
        resume_bytes = current_user.additional_info.resume

    new_interview = InterviewModel(
        user_id=current_user.id,
        company=interview.company,
        role=interview.role,
        interview_type=interview.interview_type,
        difficulty=interview.difficulty,
        planned_duration=interview.planned_duration,
        resume=resume_bytes,
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
    interview = (
        db.query(InterviewModel)
        .filter(InterviewModel.id == interview_id, InterviewModel.user_id == current_user.id)
        .first()
    )
    if interview is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

    db.delete(interview)
    db.commit()


@router.websocket("/interview_session/{interview_id}")
async def interview_session(
    websocket: WebSocket,
    interview_id: int,
    token: str,
    db: Session = Depends(get_db),
):
    try:
        current_user = get_user_from_token(token, db)
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    interview = (
        db.query(InterviewModel)
        .filter(
            InterviewModel.id == interview_id,
            InterviewModel.user_id == current_user.id,
        )
        .first()
    )
    if interview is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if interview.completed:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    if interview.resume is not None:
        resume_text = transcribe_resume(interview.resume)
        resume_text = transcribe_resume(current_user.additional_info.resume)
    else:
        resume_text = None

    system_prompt = INTERVIEWER_SYSTEM_PROMPT
    
    if resume_text is not None:
        system_prompt += (
            "\n\nHere is the candidate's resume. Use it to ask relevant, "
            "personalized questions:\n\n" + resume_text
        )

    interview.start_time = datetime.now()
    db.commit()

    history = [] # history for interview
    
    await websocket.accept()
    
    try:
        greeting = (
            f"Hello, I am your AI interviewer for today's {interview.role} "
            f"interview at {interview.company}. Let's get started."
        )

        greeting_audio = synthesize_speech(greeting)
        await websocket.send_bytes(greeting_audio)

        history.append({"role": "assistant", "content": greeting})

        while True:
            await websocket.receive()
            
            

    except WebSocketDisconnect:
        pass
    except Exception:
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
    finally:
        interview.end_time = datetime.now()
        interview.completed = True
        db.commit()