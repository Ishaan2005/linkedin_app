from pydantic import BaseModel


class LeadCreate(BaseModel):
    name: str
    title: str | None = None
    company: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    relevance_score: float = 0
    notes: str | None = None

class LeadStatusUpdate(BaseModel):
    status: str
