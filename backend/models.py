from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Date, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
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
    follow_up_date = Column(Date, nullable=True)

    # Discovery & scoring fields
    score_breakdown = Column(JSON, nullable=True)
    recommendation_reason = Column(Text, nullable=True)
    technical_areas = Column(JSON, nullable=True)
    role_category = Column(String, nullable=True)
    source = Column(String, default="existing_database", nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    outreach_events = relationship("OutreachEvent", back_populates="lead", cascade="all, delete-orphan")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    industry = Column(String, nullable=True)
    location = Column(String, nullable=True)
    website_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    tech_focus = Column(JSON, nullable=True, default=list)
    description = Column(Text, nullable=True)
    last_researched = Column(String, nullable=True)
    tier = Column(String, default="Target")
    is_saved = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    jobs = relationship("Job", back_populates="company_rel", cascade="all, delete-orphan")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, nullable=True)
    url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    required_skills = Column(JSON, nullable=True, default=list)
    date_discovered = Column(String, nullable=True)
    status = Column(String, default="NEW")
    salary_range = Column(String, nullable=True)
    experience_level = Column(String, nullable=True)
    associated_contact_ids = Column(JSON, nullable=True, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    company_rel = relationship("Company", back_populates="jobs")


class OutreachEvent(Base):
    __tablename__ = "outreach_events"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=True, index=True)
    lead_name = Column(String, nullable=True)
    lead_title = Column(String, nullable=True)
    company = Column(String, nullable=True)
    date = Column(String, nullable=True)
    status = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    action_taken = Column(String, nullable=True)
    message_type = Column(String, nullable=True)
    generated_text = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead", back_populates="outreach_events")


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, default=1)
    target_roles = Column(JSON, nullable=False, default=list)
    target_technical_skills = Column(JSON, nullable=False, default=list)
    target_locations = Column(JSON, nullable=False, default=list)
    target_companies = Column(JSON, nullable=False, default=list)
    priority_companies = Column(JSON, nullable=True, default=list)
    daily_lead_target = Column(Integer, default=15)
    min_relevance_score = Column(Float, default=60.0)
    candidate_profile = Column(JSON, nullable=False, default=dict)
    last_daily_generation_date = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


class DailyLeadBatch(Base):
    __tablename__ = "daily_lead_batches"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, nullable=False, unique=True, index=True)  # "YYYY-MM-DD"
    target_count = Column(Integer, default=15)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship(
        "DailyLeadBatchItem",
        back_populates="batch",
        cascade="all, delete-orphan",
        order_by="DailyLeadBatchItem.rank.asc()"
    )


class DailyLeadBatchItem(Base):
    __tablename__ = "daily_lead_batch_items"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("daily_lead_batches.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    rank = Column(Integer, nullable=False)
    score = Column(Float, nullable=False)
    reasons = Column(JSON, nullable=True)
    selected_at = Column(DateTime, default=datetime.utcnow)

    batch = relationship("DailyLeadBatch", back_populates="items")
    lead = relationship("Lead")
