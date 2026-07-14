from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    name: str
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    identifier: str = Field(description="Username or email")
    password: str


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
