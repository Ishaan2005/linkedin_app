from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, SessionLocal
from models import Base, Lead
from schemas import LeadCreate, LeadStatusUpdate

Base.metadata.create_all(bind=engine)

app = FastAPI(title="LinkedIn Job Hunting Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Backend is running"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/leads")
def create_lead(
    lead_data: LeadCreate,
    db: Session = Depends(get_db)
):
    lead = Lead(
        name=lead_data.name,
        title=lead_data.title,
        company=lead_data.company,
        location=lead_data.location,
        linkedin_url=lead_data.linkedin_url,
        relevance_score=lead_data.relevance_score,
        notes=lead_data.notes,
    )

    db.add(lead)
    db.commit()
    db.refresh(lead)

    return lead

@app.get("/api/leads")
def get_leads(db: Session = Depends(get_db)):
    leads = db.query(Lead).all()
    return leads

@app.patch("/api/leads/{lead_id}/status")
def update_lead_status(
    lead_id: int,
    status_data: LeadStatusUpdate,
    db: Session = Depends(get_db)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        return {"error": "Lead not found"}

    lead.status = status_data.status

    db.commit()
    db.refresh(lead)

    return lead
