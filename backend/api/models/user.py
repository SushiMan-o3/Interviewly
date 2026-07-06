from sqlalchemy import Column, DateTime, Integer, String, func
from sqlalchemy.orm import relationship

from api.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")
    additional_info = relationship(
        "AdditionalUserInformation",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
