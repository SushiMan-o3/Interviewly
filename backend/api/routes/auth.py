import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api import models
from api.config import FRONTEND_URL
from api.database import get_db
from api.schemas.token import Token
from api.schemas.user import ForgetPasswordRequest, ResetPasswordRequest, User, UserCreate, UserLogin
from api.services.email_service import send_password_reset_email
from api.services.security import (
    create_access_token,
    create_password_reset_token,
    get_current_user,
    hash_password,
    verify_password,
    verify_password_reset_token,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(models.User)
        .filter((models.User.username == user.username) | (models.User.email == user.email))
        .first()
    )
    if existing:
        detail = (
            "Username already registered"
            if existing.username == user.username
            else "Email already registered"
        )
        raise HTTPException(status_code=400, detail=detail)

    new_user = models.User(
        name=user.name,
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(new_user.username)
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    existing = (
        db.query(models.User)
        .filter(
            (models.User.username == user.identifier) | (models.User.email == user.identifier)
        )
        .first()
    )
    if not existing or not verify_password(user.password, existing.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    access_token = create_access_token(existing.username)
    return Token(access_token=access_token)


@router.post("/forget-password", status_code=204)
def forget_password(payload: ForgetPasswordRequest, db: Session = Depends(get_db)):
    existing = (
        db.query(models.User)
        .filter(
            (models.User.username == payload.identifier) | (models.User.email == payload.identifier)
        )
        .first()
    )

    if existing:
        reset_token = create_password_reset_token(existing)
        reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        try:
            send_password_reset_email(existing.email, reset_link)
        except Exception:
            logger.exception("Failed to send password reset email to user %s", existing.id)

    return


@router.post("/reset-password", status_code=204)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = verify_password_reset_token(payload.token, db)
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return