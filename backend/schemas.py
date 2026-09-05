from datetime import datetime, date
from typing import Any
from pydantic import BaseModel, ConfigDict, field_validator


class LeadCreate(BaseModel):
    name: str
    title: str | None = None
    company: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    relevance_score: float = 0.0
    status: str = "NEW"
    notes: str | None = None
    follow_up_date: date | None = None
    source: str | None = "manual"

    @field_validator("follow_up_date", mode="before")
    @classmethod
    def parse_follow_up_date(cls, v):
        if v == "" or v is None:
            return None
        return v

    @field_validator("linkedin_url", mode="before")
    @classmethod
    def clean_linkedin_url(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if not v or v == "#":
                return None
        return v


class LeadUpdate(BaseModel):
    name: str | None = None
    title: str | None = None
    company: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    relevance_score: float | None = None
    status: str | None = None
    notes: str | None = None
    follow_up_date: date | None = None
    source: str | None = None

    @field_validator("follow_up_date", mode="before")
    @classmethod
    def parse_follow_up_date(cls, v):
        if v == "" or v is None:
            return None
        return v

    @field_validator("linkedin_url", mode="before")
    @classmethod
    def clean_linkedin_url(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if not v or v == "#":
                return None
        return v


class LeadStatusUpdate(BaseModel):
    status: str
    note: str | None = None


class LeadResponse(BaseModel):
    id: int
    name: str
    title: str | None = None
    company: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    relevance_score: float
    status: str
    notes: str | None = None
    follow_up_date: date | None = None
    score_breakdown: dict[str, Any] | None = None
    recommendation_reason: str | None = None
    technical_areas: list[str] | None = None
    role_category: str | None = None
    source: str | None = "existing_database"
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Company Schemas
# ==========================================

class CompanyCreate(BaseModel):
    name: str
    industry: str | None = None
    location: str | None = None
    website_url: str | None = None
    linkedin_url: str | None = None
    tech_focus: list[str] = []
    description: str | None = None
    last_researched: str | None = None
    tier: str = "Target"
    is_saved: bool = False


class CompanyUpdate(BaseModel):
    name: str | None = None
    industry: str | None = None
    location: str | None = None
    website_url: str | None = None
    linkedin_url: str | None = None
    tech_focus: list[str] | None = None
    description: str | None = None
    last_researched: str | None = None
    tier: str | None = None
    is_saved: bool | None = None


class CompanyResponse(BaseModel):
    id: int
    name: str
    industry: str | None = None
    location: str | None = None
    website_url: str | None = None
    linkedin_url: str | None = None
    tech_focus: list[str] = []
    description: str | None = None
    last_researched: str | None = None
    tier: str
    is_saved: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Job Schemas
# ==========================================

class JobCreate(BaseModel):
    title: str
    company: str
    company_id: int | None = None
    location: str | None = None
    url: str | None = None
    description: str | None = None
    required_skills: list[str] = []
    date_discovered: str | None = None
    status: str = "NEW"
    salary_range: str | None = None
    experience_level: str | None = None
    associated_contact_ids: list[str] = []


class JobUpdate(BaseModel):
    title: str | None = None
    company: str | None = None
    company_id: int | None = None
    location: str | None = None
    url: str | None = None
    description: str | None = None
    required_skills: list[str] | None = None
    date_discovered: str | None = None
    status: str | None = None
    salary_range: str | None = None
    experience_level: str | None = None
    associated_contact_ids: list[str] | None = None


class JobStatusUpdate(BaseModel):
    status: str


class JobResponse(BaseModel):
    id: int
    company_id: int | None = None
    title: str
    company: str
    location: str | None = None
    url: str | None = None
    description: str | None = None
    required_skills: list[str] = []
    date_discovered: str | None = None
    status: str
    salary_range: str | None = None
    experience_level: str | None = None
    associated_contact_ids: list[str] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Outreach Event Schemas
# ==========================================

class OutreachEventCreate(BaseModel):
    lead_id: int | None = None
    lead_name: str | None = None
    lead_title: str | None = None
    company: str | None = None
    date: str | None = None
    status: str | None = None
    note: str | None = None
    action_taken: str | None = None
    message_type: str | None = None
    generated_text: str | None = None

    @field_validator("lead_id", mode="before")
    @classmethod
    def parse_lead_id(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                return None
        return int(v)


class OutreachEventUpdate(BaseModel):
    lead_id: int | None = None
    lead_name: str | None = None
    lead_title: str | None = None
    company: str | None = None
    date: str | None = None
    status: str | None = None
    note: str | None = None
    action_taken: str | None = None
    message_type: str | None = None
    generated_text: str | None = None


class OutreachEventResponse(BaseModel):
    id: int
    lead_id: int | None = None
    lead_name: str | None = None
    lead_title: str | None = None
    company: str | None = None
    date: str | None = None
    status: str | None = None
    note: str | None = None
    action_taken: str | None = None
    message_type: str | None = None
    generated_text: str | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# User Settings Schemas
# ==========================================

class UserSettingsUpdate(BaseModel):
    target_roles: list[str] | None = None
    target_technical_skills: list[str] | None = None
    target_locations: list[str] | None = None
    target_companies: list[str] | None = None
    priority_companies: list[str] | None = None
    daily_lead_target: int | None = None
    min_relevance_score: float | None = None
    candidate_profile: dict[str, Any] | None = None
    last_daily_generation_date: str | None = None


class UserSettingsResponse(BaseModel):
    id: int = 1
    target_roles: list[str] = []
    target_technical_skills: list[str] = []
    target_locations: list[str] = []
    target_companies: list[str] = []
    priority_companies: list[str] = []
    daily_lead_target: int = 15
    min_relevance_score: float = 60.0
    candidate_profile: dict[str, Any] = {}
    last_daily_generation_date: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Daily Lead Batch Schemas
# ==========================================

class DailyLeadBatchItemResponse(BaseModel):
    id: int
    batch_id: int
    lead_id: int
    rank: int
    score: float
    reasons: dict[str, Any] | None = None
    selected_at: datetime | None = None
    lead: LeadResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class DailyLeadBatchResponse(BaseModel):
    id: int
    date: str
    target_count: int
    created_at: datetime | None = None
    items: list[DailyLeadBatchItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class DiscoveryGenerateRequest(BaseModel):
    force: bool = False
    regenerate: bool = False
    target_count: int | None = None


class RescoreResponse(BaseModel):
    message: str
    rescored_count: int


# ==========================================
# Ingestion Schemas
# ==========================================

class IngestionCandidateRequest(BaseModel):
    name: str
    title: str | None = None
    company: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    role_category: str | None = None
    technical_areas: list[str] | None = None
    notes: str | None = None
    follow_up_date: date | None = None
    status: str = "NEW"
    source: str = "manual"

    @field_validator("follow_up_date", mode="before")
    @classmethod
    def parse_follow_up_date(cls, v):
        if v == "" or v is None:
            return None
        return v

    @field_validator("linkedin_url", mode="before")
    @classmethod
    def clean_linkedin_url(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if not v or v == "#":
                return None
        return v


class IngestionCandidateResponse(BaseModel):
    status: str
    message: str
    lead: LeadResponse | None = None


class IngestionCsvRequest(BaseModel):
    rows: list[dict[str, Any]]
    source: str = "csv"


class IngestionCsvResponse(BaseModel):
    imported: int
    duplicates: int
    invalid: int
    updated: int
    errors: list[str]
    leads_count: int

