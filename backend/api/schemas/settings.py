from typing import Optional

from fastapi import UploadFile
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UpdatePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class UpdateUserInfo(BaseModel):
    name: str
    username: str
    email: EmailStr


class AdditionalUserInfoUpdate(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    target_role: Optional[str] = None
    experience: Optional[str] = None
    industry: Optional[str] = None
    resume: Optional[UploadFile] = None


class AdditionalUserInfo(BaseModel):
    target_role: str | None = None
    experience: str | None = None
    industry: str | None = None
    has_resume: bool = False
