from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from api.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    parent_question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)

    sequence_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, nullable=True)
    asked_at = Column(DateTime(timezone=True), nullable=True)

    interview = relationship("Interview", back_populates="questions")
    parent = relationship("Question", remote_side=[id], back_populates="children")
    children = relationship("Question", back_populates="parent")
    responses = relationship(
        "Response", back_populates="question", cascade="all, delete-orphan"
    )
