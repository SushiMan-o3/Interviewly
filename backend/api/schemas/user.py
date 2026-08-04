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


class ForgetPasswordRequest(BaseModel):
    identifier: str = Field(description="Username or email")


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
