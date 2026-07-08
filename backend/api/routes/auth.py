from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api import models
from api.database import get_db
from api.schemas.token import Token
from api.schemas.user import User, UserCreate, UserLogin
from api.services.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")

    new_user = models.User(
        name=user.name,
        username=user.username,
        hashed_password=hash_password(user.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(new_user.username)
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if not existing or not verify_password(user.password, existing.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    access_token = create_access_token(existing.username)
    return Token(access_token=access_token)

