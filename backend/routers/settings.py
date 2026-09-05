from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from models import UserSettings
from schemas import UserSettingsUpdate, UserSettingsResponse
from seed_data import DEFAULT_SETTINGS

router = APIRouter(prefix="/api/settings", tags=["settings"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _get_or_create_settings(db: Session) -> UserSettings:
    settings = db.query(UserSettings).filter(UserSettings.id == 1).first()
    if not settings:
        settings = UserSettings(
            id=1,
            target_roles=DEFAULT_SETTINGS["target_roles"],
            target_technical_skills=DEFAULT_SETTINGS["target_technical_skills"],
            target_locations=DEFAULT_SETTINGS["target_locations"],
            target_companies=DEFAULT_SETTINGS["target_companies"],
            daily_lead_target=DEFAULT_SETTINGS["daily_lead_target"],
            min_relevance_score=DEFAULT_SETTINGS["min_relevance_score"],
            candidate_profile=DEFAULT_SETTINGS["candidate_profile"],
            last_daily_generation_date=DEFAULT_SETTINGS.get("last_daily_generation_date"),
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("", response_model=UserSettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    return _get_or_create_settings(db)


@router.put("", response_model=UserSettingsResponse)
def update_settings(data: UserSettingsUpdate, db: Session = Depends(get_db)):
    settings = _get_or_create_settings(db)

    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        if value is not None:
            setattr(settings, field, value)

    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    return settings
