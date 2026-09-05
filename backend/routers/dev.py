from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Company, Job, OutreachEvent, UserSettings
from seed_data import DEFAULT_COMPANIES, DEFAULT_JOBS, DEFAULT_SETTINGS, DEFAULT_OUTREACH_EVENTS

router = APIRouter(prefix="/api/dev", tags=["development-only"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_defaults(db: Session):
    """Seed or restore demo companies, jobs, outreach events, and settings."""
    # 1. Reset Companies
    db.query(Job).delete()
    db.query(Company).delete()
    db.flush()

    comp_map = {}
    for c_data in DEFAULT_COMPANIES:
        comp = Company(
            name=c_data["name"],
            industry=c_data["industry"],
            location=c_data["location"],
            website_url=c_data["website_url"],
            linkedin_url=c_data["linkedin_url"],
            tech_focus=c_data["tech_focus"],
            description=c_data["description"],
            last_researched=c_data["last_researched"],
            tier=c_data["tier"],
            is_saved=c_data["is_saved"],
        )
        db.add(comp)
        db.flush()
        comp_map[comp.name.lower()] = comp.id

    # 2. Reset Jobs
    for j_data in DEFAULT_JOBS:
        comp_id = comp_map.get(j_data["company"].lower())
        job = Job(
            company_id=comp_id,
            title=j_data["title"],
            company=j_data["company"],
            location=j_data["location"],
            url=j_data["url"],
            description=j_data["description"],
            required_skills=j_data["required_skills"],
            date_discovered=j_data["date_discovered"],
            status=j_data["status"],
            salary_range=j_data["salary_range"],
            experience_level=j_data["experience_level"],
            associated_contact_ids=j_data["associated_contact_ids"],
        )
        db.add(job)

    # 3. Reset Settings
    db.query(UserSettings).delete()
    db.flush()
    settings = UserSettings(
        id=1,
        target_roles=DEFAULT_SETTINGS["target_roles"],
        target_technical_skills=DEFAULT_SETTINGS["target_technical_skills"],
        target_locations=DEFAULT_SETTINGS["target_locations"],
        target_companies=DEFAULT_SETTINGS["target_companies"],
        priority_companies=DEFAULT_SETTINGS.get("priority_companies", []),
        daily_lead_target=DEFAULT_SETTINGS["daily_lead_target"],
        min_relevance_score=DEFAULT_SETTINGS["min_relevance_score"],
        candidate_profile=DEFAULT_SETTINGS["candidate_profile"],
        last_daily_generation_date=DEFAULT_SETTINGS.get("last_daily_generation_date"),
    )
    db.add(settings)

    # 4. Reset Outreach Events
    db.query(OutreachEvent).delete()
    db.flush()
    for o_data in DEFAULT_OUTREACH_EVENTS:
        evt = OutreachEvent(
            lead_name=o_data.get("lead_name"),
            lead_title=o_data.get("lead_title"),
            company=o_data.get("company"),
            date=o_data.get("date"),
            status=o_data.get("status"),
            action_taken=o_data.get("action_taken"),
            note=o_data.get("note"),
            message_type=o_data.get("message_type"),
        )
        db.add(evt)

    db.commit()


@router.post("/reset")
def reset_demo_data(db: Session = Depends(get_db)):
    """Development-only endpoint to safely restore CRM mock companies, jobs, settings, and outreach."""
    seed_defaults(db)
    return {
        "message": "Development reset complete. Companies, jobs, outreach events, and settings restored to defaults. Lead records preserved.",
        "status": "ok",
    }
