from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api import models
from api.database import get_db
from api.schemas.user import User, UserCreate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=User)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(email=user.email)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=User)
def login(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    return existing
