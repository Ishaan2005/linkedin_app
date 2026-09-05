from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import SessionLocal
from models import OutreachEvent, Lead
from schemas import OutreachEventCreate, OutreachEventUpdate, OutreachEventResponse

router = APIRouter(prefix="/api/outreach", tags=["outreach"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=list[OutreachEventResponse])
def get_outreach_events(db: Session = Depends(get_db)):
    return db.query(OutreachEvent).order_by(OutreachEvent.id.desc()).all()


@router.get("/{event_id}", response_model=OutreachEventResponse)
def get_outreach_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(OutreachEvent).filter(OutreachEvent.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Outreach event with id {event_id} not found"
        )
    return event


@router.post("", response_model=OutreachEventResponse, status_code=status.HTTP_201_CREATED)
def create_outreach_event(data: OutreachEventCreate, db: Session = Depends(get_db)):
    lead_name = data.lead_name
    lead_title = data.lead_title
    company = data.company

    if data.lead_id:
        lead = db.query(Lead).filter(Lead.id == data.lead_id).first()
        if lead:
            if not lead_name:
                lead_name = lead.name
            if not lead_title:
                lead_title = lead.title
            if not company:
                company = lead.company

    event = OutreachEvent(
        lead_id=data.lead_id,
        lead_name=lead_name,
        lead_title=lead_title,
        company=company,
        date=data.date or datetime.now().strftime("%Y-%m-%d %H:%M"),
        status=data.status,
        note=data.note or "",
        action_taken=data.action_taken or "Outreach action recorded",
        message_type=data.message_type,
        generated_text=data.generated_text,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.patch("/{event_id}", response_model=OutreachEventResponse)
def update_outreach_event(event_id: int, data: OutreachEventUpdate, db: Session = Depends(get_db)):
    event = db.query(OutreachEvent).filter(OutreachEvent.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Outreach event with id {event_id} not found"
        )

    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}")
def delete_outreach_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(OutreachEvent).filter(OutreachEvent.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Outreach event with id {event_id} not found"
        )

    db.delete(event)
    db.commit()
    return {"message": "Outreach event deleted successfully", "id": event_id}
