from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Job, Company
from schemas import JobCreate, JobUpdate, JobStatusUpdate, JobResponse

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=list[JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    return db.query(Job).order_by(Job.id.asc()).all()


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with id {job_id} not found"
        )
    return job


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(data: JobCreate, db: Session = Depends(get_db)):
    company_id = data.company_id
    if not company_id and data.company:
        comp = db.query(Company).filter(Company.name.ilike(data.company.strip())).first()
        if comp:
            company_id = comp.id

    job = Job(
        title=data.title.strip(),
        company=data.company.strip(),
        company_id=company_id,
        location=data.location,
        url=data.url,
        description=data.description,
        required_skills=data.required_skills,
        date_discovered=data.date_discovered or datetime.utcnow().strftime("%Y-%m-%d"),
        status=data.status,
        salary_range=data.salary_range,
        experience_level=data.experience_level,
        associated_contact_ids=data.associated_contact_ids,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.patch("/{job_id}", response_model=JobResponse)
def update_job(job_id: int, data: JobUpdate, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with id {job_id} not found"
        )

    update_dict = data.model_dump(exclude_unset=True)

    if "company" in update_dict and update_dict["company"] and "company_id" not in update_dict:
        comp = db.query(Company).filter(Company.name.ilike(update_dict["company"].strip())).first()
        if comp:
            job.company_id = comp.id

    for field, value in update_dict.items():
        setattr(job, field, value)

    job.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return job


@router.patch("/{job_id}/status", response_model=JobResponse)
def update_job_status(job_id: int, data: JobStatusUpdate, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with id {job_id} not found"
        )

    job.status = data.status
    job.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with id {job_id} not found"
        )

    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully", "id": job_id}
