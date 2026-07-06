from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from api.database import Base


class AdditionalUserInformation(Base):
    __tablename__ = "additional_user_informations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    target_role = Column(String, nullable=True)
    experience = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    resume_url = Column(String, nullable=True)

    user = relationship("User", back_populates="additional_info")
