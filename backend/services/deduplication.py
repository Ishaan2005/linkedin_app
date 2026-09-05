import re
from typing import Any, Dict, List, Optional, Set
from services.normalization import normalize_name, canonical_company_key, normalize_linkedin_url


def compute_lead_dedup_keys(
    name: Optional[str],
    company: Optional[str],
    linkedin_url: Optional[str]
) -> List[str]:
    keys = []
    norm_url = normalize_linkedin_url(linkedin_url)
    if norm_url:
        keys.append(f"url:{norm_url}")

    norm_name = re.sub(r'[^a-z0-9]', '', normalize_name(name).lower())
    comp_key = canonical_company_key(company)
    if norm_name and comp_key:
        keys.append(f"name_comp:{norm_name}_{comp_key}")
    elif norm_name:
        keys.append(f"name:{norm_name}")

    return keys


def is_candidate_duplicate(
    name: Optional[str],
    company: Optional[str],
    linkedin_url: Optional[str],
    seen_keys: Set[str]
) -> bool:
    keys = compute_lead_dedup_keys(name, company, linkedin_url)
    return any(k in seen_keys for k in keys)


def register_dedup_keys(
    name: Optional[str],
    company: Optional[str],
    linkedin_url: Optional[str],
    seen_keys: Set[str]
) -> None:
    for k in compute_lead_dedup_keys(name, company, linkedin_url):
        seen_keys.add(k)


def deduplicate_candidates(candidates: List[Any], existing_leads: Optional[List[Any]] = None) -> List[Any]:
    seen_keys: Set[str] = set()

    # Pre-populate with existing leads if provided
    if existing_leads:
        for lead in existing_leads:
            name = getattr(lead, "name", None) or (lead.get("name") if isinstance(lead, dict) else None)
            comp = getattr(lead, "company", None) or (lead.get("company") if isinstance(lead, dict) else None)
            url = getattr(lead, "linkedin_url", None) or (lead.get("linkedin_url") if isinstance(lead, dict) else None)
            register_dedup_keys(name, comp, url, seen_keys)

    unique_candidates = []
    for cand in candidates:
        name = getattr(cand, "name", None) or (cand.get("name") if isinstance(cand, dict) else None)
        comp = getattr(cand, "company", None) or (cand.get("company") if isinstance(cand, dict) else None)
        url = getattr(cand, "linkedin_url", None) or (cand.get("linkedin_url") if isinstance(cand, dict) else None)

        if not is_candidate_duplicate(name, comp, url, seen_keys):
            register_dedup_keys(name, comp, url, seen_keys)
            unique_candidates.append(cand)

    return unique_candidates
