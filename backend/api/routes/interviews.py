import traceback
from datetime import datetime, timedelta, timezone
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
from api.models import Question as QuestionModel
from api.models import Response as ResponseModel
from api.models import User as UserModel
from api.prompts import INTERVIEWER_SYSTEM_PROMPT, TIME_CHECK_TEMPLATE
from api.schemas.interview import Interview, InterviewCreate, InterviewSummary
from api.services.claude_service import (
    ask_claude,
    ask_claude_overall_feedback,
    ask_claude_with_feedback,
    transcribe_resume,
)
from api.services.security import get_current_user, get_user_from_token
from api.services.speech_service import synthesize_speech, transcribe_audio

router = APIRouter(prefix="/interviews", tags=["interviews"])

# How far past the planned duration the interview is allowed to run before it's cut off.
END_INTERVIEW_GRACE_MINUTES = 5


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

    interview.start_time = datetime.now(timezone.utc)
    db.commit()

    planned_duration = timedelta(minutes=interview.planned_duration)
    hard_deadline = interview.start_time + planned_duration + timedelta(minutes=END_INTERVIEW_GRACE_MINUTES)

    history = [] # history for interview
    sequence_number = 0

    await websocket.accept()

    try:
        greeting = (
            f"Hello, I am your AI interviewer for today's {interview.role} "
            f"interview at {interview.company}. Let's get started."
        )

        pending_response = None  # the most recent unrated ResponseModel, awaiting feedback
        asked_closing_question = False  # whether we've already asked "do you have any questions for me?"

        while True:
            now = datetime.now(timezone.utc)
            if now >= hard_deadline or asked_closing_question:
                if pending_response is not None:
                    result = ask_claude_with_feedback(history, system_prompt)
                    pending_response.feedback = result["feedback"]
                    pending_response.score = result["rating"]
                    db.commit()

                if now >= hard_deadline and not asked_closing_question:
                    closing_text = (
                        "Oh, I didn't realize how much time had passed - looks like we're "
                        "out of time for today's interview. Thanks so much for your answers, "
                        "great work!"
                    )
                else:
                    closing_text = (
                        "Great, that's all the time we have for today. Thanks so much for "
                        "your answers - great work!"
                    )
                await websocket.send_text(closing_text)
                await websocket.send_bytes(synthesize_speech(closing_text))
                await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)
                break

            elapsed = now - interview.start_time
            remaining = max(timedelta(0), planned_duration - elapsed)
            time_check = TIME_CHECK_TEMPLATE.format(
                elapsed_minutes=int(elapsed.total_seconds() // 60),
                planned_duration=interview.planned_duration,
                remaining_minutes=int(remaining.total_seconds() // 60),
                question_number=sequence_number + 1,
            )

            if pending_response is None:
                # First question of the interview: there's no prior answer to grade yet.
                question_text = ask_claude(history, system_prompt + time_check)
                question_text = f"{greeting} {question_text}"
            elif remaining <= timedelta(0):
                # Planned time is up: grade the last answer, then close out with a
                # dedicated "any questions for me?" turn instead of another interview question.
                result = ask_claude_with_feedback(history, system_prompt + time_check)
                pending_response.feedback = result["feedback"]
                pending_response.score = result["rating"]
                db.commit()
                question_text = (
                    "That wraps up the interview questions I had for you. Do you have "
                    "any questions for me?"
                )
                asked_closing_question = True
            else:
                result = ask_claude_with_feedback(history, system_prompt + time_check)
                pending_response.feedback = result["feedback"]
                pending_response.score = result["rating"]
                db.commit()
                question_text = result["next_question"]

            sequence_number += 1
            asked_at = datetime.now(timezone.utc)

            question = QuestionModel(
                interview_id=interview.id,
                sequence_number=sequence_number,
                question_text=question_text,
                asked_at=asked_at,
            )
            db.add(question)
            db.commit()
            db.refresh(question)

            history.append({"role": "assistant", "content": question_text})

            question_audio = synthesize_speech(question_text)
            await websocket.send_bytes(question_audio)

            audio_bytes = await websocket.receive_bytes()
            transcript_text = transcribe_audio(audio_bytes)

            if not transcript_text:
                await websocket.send_text("Is your mic turned on? I cannot hear you.")
                continue

            response = ResponseModel(
                question_id=question.id,
                transcript_text=transcript_text,
                response_time_seconds=(datetime.now(timezone.utc) - asked_at).total_seconds(),
                # pending feedback and score to be filled in after grading
            )
            db.add(response)
            db.commit()
            db.refresh(response)

            history.append({"role": "user", "content": transcript_text})
            pending_response = response


    except WebSocketDisconnect:
        pass
    except Exception:
        traceback.print_exc()
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
    finally:
        interview.end_time = datetime.now(timezone.utc)
        interview.completed = True

        if any(message["role"] == "user" for message in history):
            try:
                overall = ask_claude_overall_feedback(history, system_prompt)
                interview.overall_score = overall["overall_score"]
                interview.feedback = overall["feedback"]
            except Exception:
                traceback.print_exc()

        db.commit()