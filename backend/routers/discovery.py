from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import SessionLocal
from schemas import (
    DailyLeadBatchResponse,
    DiscoveryGenerateRequest,
)
from services.discovery import (
    generate_daily_leads,
    get_batch_by_id,
    get_batch_history,
    get_today_batch,
)

router = APIRouter(prefix="/api/discovery", tags=["discovery"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/generate", response_model=DailyLeadBatchResponse)
def generate_batch(
    request: Optional[DiscoveryGenerateRequest] = None,
    force: bool = Query(False),
    regenerate: bool = Query(False),
    target_count: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    # Support both JSON body and Query params
    is_force = (request.force or request.regenerate) if request else (force or regenerate)
    final_count = (request.target_count if request and request.target_count else target_count)

    batch, _ = generate_daily_leads(
        db=db,
        force=is_force,
        target_count=final_count,
    )
    return batch


@router.get("/today", response_model=Optional[DailyLeadBatchResponse])
def get_todays_batch(db: Session = Depends(get_db)):
    batch = get_today_batch(db)
    return batch


@router.get("/batches", response_model=List[DailyLeadBatchResponse])
def list_batches(limit: int = Query(30, ge=1, le=100), db: Session = Depends(get_db)):
    return get_batch_history(db, limit=limit)


@router.get("/batches/{batch_id}", response_model=DailyLeadBatchResponse)
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = get_batch_by_id(db, batch_id)
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Daily lead batch with id {batch_id} not found"
        )
    return batch
