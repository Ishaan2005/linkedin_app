from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from datetime import datetime

from database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    title = Column(String, nullable=True)
    company = Column(String, nullable=True)
    location = Column(String, nullable=True)

    linkedin_url = Column(String, unique=True, nullable=True)

    relevance_score = Column(Float, default=0)

    status = Column(String, default="NEW")

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
