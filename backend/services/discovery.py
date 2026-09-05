from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload

from models import DailyLeadBatch, DailyLeadBatchItem, Job, Lead, UserSettings
from seed_data import DEFAULT_SETTINGS
from services.deduplication import deduplicate_candidates
from services.normalization import (
    canonical_company_key,
    infer_role_category,
    infer_technical_areas,
    normalize_company,
    normalize_linkedin_url,
    normalize_location,
    normalize_name,
)
from services.scoring import calculate_relevance_score
from services.sources import CandidateSource, ExistingDatabaseSource

EXCLUDED_STATUSES = {
    "CONNECTION_SENT",
    "CONNECTED",
    "MESSAGE_SENT",
    "RESUME_SENT",
    "FOLLOW_UP",
    "REPLIED",
    "INTERVIEW",
    "REJECTED",
    "ARCHIVED",
}


def _get_or_create_settings(db: Session) -> UserSettings:
    settings = db.query(UserSettings).filter(UserSettings.id == 1).first()
    if not settings:
        settings = UserSettings(
            id=1,
            target_roles=DEFAULT_SETTINGS["target_roles"],
            target_technical_skills=DEFAULT_SETTINGS["target_technical_skills"],
            target_locations=DEFAULT_SETTINGS["target_locations"],
            target_companies=DEFAULT_SETTINGS["target_companies"],
            priority_companies=DEFAULT_SETTINGS.get("priority_companies", []),
            daily_lead_target=DEFAULT_SETTINGS.get("daily_lead_target", 15),
            min_relevance_score=DEFAULT_SETTINGS.get("min_relevance_score", 60.0),
            candidate_profile=DEFAULT_SETTINGS.get("candidate_profile", {}),
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def _get_active_job_companies_and_contacts(db: Session) -> Tuple[set[str], set[int]]:
    active_jobs = db.query(Job).filter(Job.status != "CLOSED").all()
    job_companies = set()
    associated_contact_ids = set()

    for job in active_jobs:
        if job.company:
            job_companies.add(canonical_company_key(job.company))
        if job.associated_contact_ids:
            for cid in job.associated_contact_ids:
                try:
                    associated_contact_ids.add(int(cid))
                except (ValueError, TypeError):
                    pass

    return job_companies, associated_contact_ids


def get_today_batch(db: Session) -> Optional[DailyLeadBatch]:
    today_str = datetime.now().strftime("%Y-%m-%d")
    return (
        db.query(DailyLeadBatch)
        .options(joinedload(DailyLeadBatch.items).joinedload(DailyLeadBatchItem.lead))
        .filter(DailyLeadBatch.date == today_str)
        .first()
    )


def get_batch_by_id(db: Session, batch_id: int) -> Optional[DailyLeadBatch]:
    return (
        db.query(DailyLeadBatch)
        .options(joinedload(DailyLeadBatch.items).joinedload(DailyLeadBatchItem.lead))
        .filter(DailyLeadBatch.id == batch_id)
        .first()
    )


def get_batch_history(db: Session, limit: int = 30) -> List[DailyLeadBatch]:
    return (
        db.query(DailyLeadBatch)
        .options(joinedload(DailyLeadBatch.items).joinedload(DailyLeadBatchItem.lead))
        .order_by(DailyLeadBatch.date.desc())
        .limit(limit)
        .all()
    )


def generate_daily_leads(
    db: Session,
    force: bool = False,
    target_count: Optional[int] = None,
    source: Optional[CandidateSource] = None,
) -> Tuple[DailyLeadBatch, int]:
    """
    Executes the complete daily prospect discovery & ranking pipeline:
    1. Check for existing batch for today (idempotent unless force=True).
    2. Ingestion via Source Adapter.
    3. Normalization & Deduplication.
    4. Scoring against UserSettings & active CRM jobs.
    5. Eligibility filtering (exclude contacted/archived & min_relevance_score).
    6. Ranking & top-K selection.
    7. Persistence in DailyLeadBatch & DailyLeadBatchItem.
    """
    today_str = datetime.now().strftime("%Y-%m-%d")

    # 1. Check idempotency
    existing_batch = get_today_batch(db)
    if existing_batch and not force:
        return existing_batch, len(existing_batch.items)

    settings = _get_or_create_settings(db)
    final_target = target_count if target_count and target_count > 0 else (settings.daily_lead_target or 15)

    # 2. Ingest candidates
    candidate_source = source or ExistingDatabaseSource()
    raw_candidates = candidate_source.fetch_candidates(db)

    # Also load contacted leads to prevent any duplicate/contacted selection
    contacted_leads = (
        db.query(Lead)
        .filter(Lead.status.in_(EXCLUDED_STATUSES))
        .all()
    )

    # 3. Deduplication
    deduped_candidates = deduplicate_candidates(raw_candidates, existing_leads=contacted_leads)

    # Active jobs check
    job_companies, associated_contact_ids = _get_active_job_companies_and_contacts(db)

    # 4. Scoring & Filtering
    scored_candidates: List[Tuple[Dict[str, Any], Dict[str, Any]]] = []

    for cand in deduped_candidates:
        cand_status = cand.get("status") or "NEW"
        if cand_status in EXCLUDED_STATUSES:
            continue

        cand_comp_key = canonical_company_key(cand.get("company"))
        lead_id = cand.get("source_lead_id")

        has_active_job = (
            (cand_comp_key in job_companies and cand_comp_key != "")
            or (lead_id is not None and lead_id in associated_contact_ids)
        )

        score_res = calculate_relevance_score(cand, settings, has_associated_job=has_active_job)
        norm_score = score_res["score"]

        # Minimum score threshold
        min_score = settings.min_relevance_score if settings.min_relevance_score is not None else 60.0
        if norm_score >= min_score:
            scored_candidates.append((cand, score_res))

    # 5. Ranking (descending by score)
    scored_candidates.sort(key=lambda x: x[1]["score"], reverse=True)

    # 6. Select top-K
    selected = scored_candidates[:final_target]

    # 7. Persist batch
    if existing_batch:
        # If force=True, remove old items from existing batch
        db.query(DailyLeadBatchItem).filter(DailyLeadBatchItem.batch_id == existing_batch.id).delete()
        batch = existing_batch
        batch.target_count = final_target
    else:
        batch = DailyLeadBatch(
            date=today_str,
            target_count=final_target,
        )
        db.add(batch)
        db.flush()

    # Create batch items and update leads
    for rank_idx, (cand, score_res) in enumerate(selected, start=1):
        lead_id = cand.get("source_lead_id")
        lead = db.query(Lead).filter(Lead.id == lead_id).first() if lead_id else None

        if lead:
            lead.relevance_score = score_res["score"]
            lead.score_breakdown = score_res["breakdown"]
            lead.recommendation_reason = score_res["recommendation_reason"]
            lead.role_category = score_res["role_category"]
            lead.technical_areas = score_res["technical_areas"]
            lead.updated_at = datetime.utcnow()
            db.flush()

            item = DailyLeadBatchItem(
                batch_id=batch.id,
                lead_id=lead.id,
                rank=rank_idx,
                score=score_res["score"],
                reasons=score_res["breakdown"],
            )
            db.add(item)

    settings.last_daily_generation_date = today_str
    db.commit()

    # Re-fetch populated batch
    batch_with_items = get_batch_by_id(db, batch.id)
    return batch_with_items or batch, len(selected)


def rescore_single_lead(db: Session, lead_id: int) -> Optional[Lead]:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        return None

    settings = _get_or_create_settings(db)
    job_companies, associated_contact_ids = _get_active_job_companies_and_contacts(db)

    cand_comp_key = canonical_company_key(lead.company)
    has_active_job = (
        (cand_comp_key in job_companies and cand_comp_key != "")
        or (lead.id in associated_contact_ids)
    )

    score_res = calculate_relevance_score(lead, settings, has_associated_job=has_active_job)
    lead.relevance_score = score_res["score"]
    lead.score_breakdown = score_res["breakdown"]
    lead.recommendation_reason = score_res["recommendation_reason"]
    lead.role_category = score_res["role_category"]
    lead.technical_areas = score_res["technical_areas"]
    lead.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(lead)
    return lead


def rescore_all_leads(db: Session) -> int:
    leads = db.query(Lead).all()
    if not leads:
        return 0

    settings = _get_or_create_settings(db)
    job_companies, associated_contact_ids = _get_active_job_companies_and_contacts(db)

    for lead in leads:
        cand_comp_key = canonical_company_key(lead.company)
        has_active_job = (
            (cand_comp_key in job_companies and cand_comp_key != "")
            or (lead.id in associated_contact_ids)
        )
        score_res = calculate_relevance_score(lead, settings, has_associated_job=has_active_job)
        lead.relevance_score = score_res["score"]
        lead.score_breakdown = score_res["breakdown"]
        lead.recommendation_reason = score_res["recommendation_reason"]
        lead.role_category = score_res["role_category"]
        lead.technical_areas = score_res["technical_areas"]
        lead.updated_at = datetime.utcnow()

    db.commit()
    return len(leads)
