from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import SessionLocal
from models import Lead, OutreachEvent
from schemas import (
    LeadCreate,
    LeadUpdate,
    LeadStatusUpdate,
    LeadResponse,
    OutreachEventResponse,
    RescoreResponse,
)
from services.discovery import rescore_single_lead, rescore_all_leads
from services.ingestion import ingest_candidate

router = APIRouter(prefix="/api/leads", tags=["leads"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _create_status_event(db: Session, lead: Lead, new_status: str, note: str | None = None):
    action_str = f"Status changed to {new_status.replace('_', ' ')}"
    note_str = note if note else f"Moved lead status to {new_status.replace('_', ' ')}"

    msg_type = None
    if new_status == "CONNECTION_SENT":
        msg_type = "Connection request"
    elif new_status in ("MESSAGE_SENT", "REPLIED", "INTERVIEW"):
        msg_type = "LinkedIn message"
    elif new_status == "FOLLOW_UP":
        msg_type = "Follow-up"
    elif new_status == "RESUME_SENT":
        msg_type = "Cold email"

    event = OutreachEvent(
        lead_id=lead.id,
        lead_name=lead.name,
        lead_title=lead.title,
        company=lead.company,
        date=datetime.now().strftime("%Y-%m-%d %H:%M"),
        status=new_status,
        action_taken=action_str,
        note=note_str,
        message_type=msg_type,
    )
    db.add(event)


@router.get("", response_model=list[LeadResponse])
def get_leads(db: Session = Depends(get_db)):
    return db.query(Lead).all()


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} not found"
        )
    return lead


@router.get("/{lead_id}/outreach", response_model=list[OutreachEventResponse])
def get_lead_outreach(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} not found"
        )
    return db.query(OutreachEvent).filter(OutreachEvent.lead_id == lead_id).order_by(OutreachEvent.id.desc()).all()


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(lead_data: LeadCreate, db: Session = Depends(get_db)):
    result = ingest_candidate(
        db=db,
        candidate_data=lead_data.model_dump(),
        source=lead_data.source or "manual",
    )
    if result["status"] == "duplicate":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=result["message"],
        )
    if result["status"] == "invalid":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=result["message"],
        )
    return result["lead"]


@router.patch("/{lead_id}", response_model=LeadResponse)
def update_lead(lead_id: int, lead_data: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} not found"
        )

    update_data = lead_data.model_dump(exclude_unset=True)

    if "linkedin_url" in update_data and update_data["linkedin_url"]:
        conflict = (
            db.query(Lead)
            .filter(Lead.linkedin_url == update_data["linkedin_url"], Lead.id != lead_id)
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Another lead with LinkedIn URL '{update_data['linkedin_url']}' already exists"
            )

    old_status = lead.status
    for field, value in update_data.items():
        setattr(lead, field, value)

    if "status" in update_data and update_data["status"] and update_data["status"] != old_status:
        _create_status_event(db, lead, update_data["status"], update_data.get("notes"))

    lead.updated_at = datetime.utcnow()

    try:
        db.commit()
        db.refresh(lead)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Lead with this LinkedIn URL already exists"
        )

    return lead


@router.patch("/{lead_id}/status", response_model=LeadResponse)
def update_lead_status(
    lead_id: int,
    status_data: LeadStatusUpdate,
    db: Session = Depends(get_db)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} not found"
        )

    old_status = lead.status
    lead.status = status_data.status
    lead.updated_at = datetime.utcnow()

    if old_status != status_data.status:
        _create_status_event(db, lead, status_data.status, status_data.note)

    db.commit()
    db.refresh(lead)

    return lead


@router.delete("/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} not found"
        )

    db.delete(lead)
    db.commit()

    return {"message": "Lead deleted successfully", "id": lead_id}


@router.post("/rescore-all", response_model=RescoreResponse)
def rescore_all(db: Session = Depends(get_db)):
    count = rescore_all_leads(db)
    return RescoreResponse(
        message="Successfully rescored all leads against current user settings",
        rescored_count=count,
    )


@router.post("/{lead_id}/rescore", response_model=LeadResponse)
def rescore_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = rescore_single_lead(db, lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} not found"
        )
    return lead
