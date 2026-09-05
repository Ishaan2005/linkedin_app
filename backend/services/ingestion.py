from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple
from sqlalchemy.orm import Session

from models import Job, Lead, UserSettings
from services.deduplication import compute_lead_dedup_keys, is_candidate_duplicate, register_dedup_keys
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


def _get_active_job_context(db: Session) -> Tuple[Set[str], Set[int]]:
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


def ingest_candidate(
    db: Session,
    candidate_data: Dict[str, Any],
    source: str = "manual",
) -> Dict[str, Any]:
    """
    Ingests a single candidate through normalization, deduplication, scoring, and DB persistence.
    Returns dict with status ("created" or "duplicate" or "invalid") and the Lead object.
    """
    raw_name = candidate_data.get("name")
    if not raw_name or not str(raw_name).strip():
        return {
            "status": "invalid",
            "message": "Candidate name is required",
            "lead": None,
        }

    name = normalize_name(str(raw_name))
    title = str(candidate_data.get("title") or "").strip() or None
    company = normalize_company(str(candidate_data.get("company") or "").strip()) or None
    location = normalize_location(str(candidate_data.get("location") or "").strip()) or None
    linkedin_url = normalize_linkedin_url(candidate_data.get("linkedin_url"))
    notes = candidate_data.get("notes") or candidate_data.get("note")
    follow_up_date = candidate_data.get("follow_up_date")

    # 1. Deduplication check against DB
    existing = None
    if linkedin_url:
        existing = db.query(Lead).filter(Lead.linkedin_url == linkedin_url).first()

    if not existing and name and company:
        # Check canonical name + company
        existing = (
            db.query(Lead)
            .filter(Lead.name.ilike(name), Lead.company.ilike(company))
            .first()
        )

    if existing:
        return {
            "status": "duplicate",
            "message": f"Candidate '{name}' ({company}) already exists in CRM (ID: {existing.id})",
            "lead": existing,
        }

    # 2. Inferences
    role_category = candidate_data.get("role_category") or infer_role_category(title)
    technical_areas = candidate_data.get("technical_areas")
    if not technical_areas:
        technical_areas = infer_technical_areas(title)

    # 3. Relevance Scoring against current UserSettings and Active Jobs
    settings = db.query(UserSettings).filter(UserSettings.id == 1).first()
    job_companies, associated_contact_ids = _get_active_job_context(db)

    cand_comp_canon = canonical_company_key(company)
    has_active_job = False
    company_has_jobs = cand_comp_canon in job_companies if cand_comp_canon else False

    score_res = calculate_relevance_score(
        {
            "title": title,
            "company": company,
            "location": location,
            "role_category": role_category,
            "technical_areas": technical_areas,
        },
        settings or {},
        has_associated_job=has_active_job,
        company_has_active_jobs=company_has_jobs,
    )

    # 4. Create Lead
    new_lead = Lead(
        name=name,
        title=title,
        company=company,
        location=location,
        linkedin_url=linkedin_url,
        relevance_score=score_res["score"],
        score_breakdown=score_res["breakdown"],
        recommendation_reason=score_res["recommendation_reason"],
        technical_areas=technical_areas,
        role_category=role_category,
        status=candidate_data.get("status") or "NEW",
        notes=notes,
        follow_up_date=follow_up_date,
        source=source,
    )

    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)

    return {
        "status": "created",
        "message": f"Candidate '{name}' successfully ingested and scored ({score_res['score']}/100)",
        "lead": new_lead,
    }


def ingest_csv_candidates(
    db: Session,
    rows: List[Dict[str, Any]],
    source: str = "csv",
) -> Dict[str, Any]:
    """
    Ingests a list of candidate dictionaries through normalization, deduplication,
    scoring, and DB persistence. Returns comprehensive summary report.
    """
    imported_count = 0
    duplicate_count = 0
    invalid_count = 0
    updated_count = 0
    errors: List[str] = []
    created_leads: List[Lead] = []

    # Build memory set of existing leads to prevent intra-batch duplicates
    existing_leads = db.query(Lead).all()
    seen_keys: Set[str] = set()
    for el in existing_leads:
        register_dedup_keys(el.name, el.company, el.linkedin_url, seen_keys)

    settings = db.query(UserSettings).filter(UserSettings.id == 1).first()
    job_companies, associated_contact_ids = _get_active_job_context(db)

    for idx, row in enumerate(rows, start=1):
        raw_name = row.get("name") or row.get("Full Name") or row.get("Candidate Name")
        if not raw_name or not str(raw_name).strip():
            invalid_count += 1
            errors.append(f"Row {idx}: Missing candidate name")
            continue

        name = normalize_name(str(raw_name))
        title = str(row.get("title") or row.get("Job Title") or row.get("Headline") or "").strip() or None
        company = normalize_company(str(row.get("company") or row.get("Company Name") or "").strip()) or None
        location = normalize_location(str(row.get("location") or row.get("Location") or "").strip()) or None
        url = normalize_linkedin_url(row.get("linkedin_url") or row.get("URL") or row.get("Profile URL"))
        notes = row.get("notes") or row.get("Notes")

        # Check duplicate
        if is_candidate_duplicate(name, company, url, seen_keys):
            duplicate_count += 1
            continue

        # Register key
        register_dedup_keys(name, company, url, seen_keys)

        # Inferences
        role_category = row.get("role_category") or infer_role_category(title)
        technical_areas = row.get("technical_areas")
        if not technical_areas:
            # Check for comma-separated string in CSV
            raw_tech = row.get("technical_area") or row.get("skills")
            if raw_tech and isinstance(raw_tech, str):
                technical_areas = [s.strip() for s in raw_tech.split(",") if s.strip()]
            else:
                technical_areas = infer_technical_areas(title)

        cand_comp_canon = canonical_company_key(company)
        company_has_jobs = cand_comp_canon in job_companies if cand_comp_canon else False

        score_res = calculate_relevance_score(
            {
                "title": title,
                "company": company,
                "location": location,
                "role_category": role_category,
                "technical_areas": technical_areas,
            },
            settings or {},
            has_associated_job=False,
            company_has_active_jobs=company_has_jobs,
        )

        lead = Lead(
            name=name,
            title=title,
            company=company,
            location=location,
            linkedin_url=url,
            relevance_score=score_res["score"],
            score_breakdown=score_res["breakdown"],
            recommendation_reason=score_res["recommendation_reason"],
            technical_areas=technical_areas,
            role_category=role_category,
            status="NEW",
            notes=notes,
            source=source,
        )
        db.add(lead)
        created_leads.append(lead)
        imported_count += 1

    db.commit()

    return {
        "imported": imported_count,
        "duplicates": duplicate_count,
        "invalid": invalid_count,
        "updated": updated_count,
        "errors": errors[:20],
        "leads_count": len(created_leads),
    }
