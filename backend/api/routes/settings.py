from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session

from api import models
from api.database import get_db
from api.schemas.settings import (
    AdditionalUserInfo,
    AdditionalUserInfoUpdate,
    UpdatePassword,
    UpdateUserInfo,
)
from api.schemas.user import User
from api.services.security import get_current_user, hash_password, verify_password

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/profile", response_model=User)
def get_profile(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.get("/additional-info", response_model=AdditionalUserInfo)
def get_additional_info(current_user: models.User = Depends(get_current_user)):
    info = current_user.additional_info
    if info is None:
        return AdditionalUserInfo()

    return AdditionalUserInfo(
        target_role=info.target_role,
        experience=info.experience,
        industry=info.industry,
        has_resume=info.resume is not None,
    )


@router.put("/password", status_code=status.HTTP_204_NO_CONTENT)
def update_password(
    payload: UpdatePassword,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect"
        )

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()


@router.put("/profile", response_model=User)
def update_profile(
    payload: UpdateUserInfo,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    existing = (
        db.query(models.User)
        .filter(
            models.User.id != current_user.id,
            (models.User.username == payload.username) | (models.User.email == payload.email),
        )
        .first()
    )
    if existing:
        detail = (
            "Username already registered"
            if existing.username == payload.username
            else "Email already registered"
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

    current_user.name = payload.name
    current_user.username = payload.username
    current_user.email = payload.email
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/additional-info", response_model=AdditionalUserInfo)
def update_additional_info(
    payload: Annotated[AdditionalUserInfoUpdate, Form()],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    resume_bytes = None
    if payload.resume is not None:
        if payload.resume.content_type != "application/pdf":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Resume must be a PDF file")

        resume_bytes = payload.resume.file.read()
        if not resume_bytes.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Resume must be a valid PDF file"
            )

    info = current_user.additional_info
    if info is None:
        info = models.AdditionalUserInformation(user_id=current_user.id)
        db.add(info)

    info.target_role = payload.target_role
    info.experience = payload.experience
    info.industry = payload.industry
    if resume_bytes is not None:
        info.resume = resume_bytes

    db.commit()
    db.refresh(info)
    return AdditionalUserInfo(
        target_role=info.target_role,
        experience=info.experience,
        industry=info.industry,
        has_resume=info.resume is not None,
    )


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db.delete(current_user)
    db.commit()
