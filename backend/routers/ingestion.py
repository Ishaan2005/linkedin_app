from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import SessionLocal
from schemas import (
    IngestionCandidateRequest,
    IngestionCandidateResponse,
    IngestionCsvRequest,
    IngestionCsvResponse,
)
from services.ingestion import ingest_candidate, ingest_csv_candidates

router = APIRouter(prefix="/api/ingestion", tags=["ingestion"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/candidate", response_model=IngestionCandidateResponse)
def ingest_single_candidate(
    payload: IngestionCandidateRequest,
    db: Session = Depends(get_db),
):
    result = ingest_candidate(
        db=db,
        candidate_data=payload.model_dump(),
        source=payload.source or "manual",
    )
    if result["status"] == "invalid":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=result["message"],
        )
    return result


@router.post("/csv", response_model=IngestionCsvResponse)
def ingest_csv_rows(
    payload: IngestionCsvRequest,
    db: Session = Depends(get_db),
):
    report = ingest_csv_candidates(
        db=db,
        rows=payload.rows,
        source=payload.source or "csv",
    )
    return report
