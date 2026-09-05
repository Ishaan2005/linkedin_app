from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from models import Lead


class CandidateSource(ABC):
    @abstractmethod
    def fetch_candidates(self, db: Session) -> List[Dict[str, Any]]:
        """Fetch candidate records as a list of dictionaries with standard keys:
        - name: str
        - title: Optional[str]
        - company: Optional[str]
        - location: Optional[str]
        - linkedin_url: Optional[str]
        - source_lead_id: Optional[int]
        - status: Optional[str]
        - notes: Optional[str]
        - follow_up_date: Optional[date]
        """
        pass


class ExistingDatabaseSource(CandidateSource):
    """Source adapter that fetches uncontacted leads directly from the local SQLite database."""

    def __init__(self, include_statuses: Optional[List[str]] = None):
        # Default to uncontacted statuses
        self.include_statuses = include_statuses or ["NEW", "REVIEWED"]

    def fetch_candidates(self, db: Session) -> List[Dict[str, Any]]:
        query = db.query(Lead)
        if self.include_statuses:
            query = query.filter(Lead.status.in_(self.include_statuses))

        leads = query.all()
        candidates: List[Dict[str, Any]] = []

        for lead in leads:
            candidates.append({
                "source_lead_id": lead.id,
                "name": lead.name,
                "title": lead.title,
                "company": lead.company,
                "location": lead.location,
                "linkedin_url": lead.linkedin_url,
                "status": lead.status,
                "notes": lead.notes,
                "follow_up_date": lead.follow_up_date,
                "score_breakdown": lead.score_breakdown,
                "recommendation_reason": lead.recommendation_reason,
                "technical_areas": lead.technical_areas,
                "role_category": lead.role_category,
                "relevance_score": lead.relevance_score,
            })

        return candidates
