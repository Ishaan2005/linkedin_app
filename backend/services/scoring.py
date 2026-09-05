import re
from typing import Any, Dict, List, Optional, Set, Tuple
from services.normalization import (
    canonical_company_key,
    infer_role_category,
    infer_technical_areas,
    is_location_preferred,
)

# Additional known semiconductor firms for general ecosystem recognition
BROAD_SEMICONDUCTOR_FIRMS = {
    "broadcom", "apple", "google", "samsung", "tsmc", "tenstorrent",
    "analog", "adi", "microchip", "westerndigital", "xilinx", "altera",
    "asml", "appliedmaterials", "lamresearch", "stmicroelectronics",
    "skyworks", "qorvo", "cirruslogic", "realtek", "latticesemi",
}


def _matches_company_list(canonical_cand_comp: str, comp_list: List[str]) -> Tuple[bool, str]:
    if not canonical_cand_comp or not comp_list:
        return False, ""
    for c in comp_list:
        c_canon = canonical_company_key(c)
        if c_canon and (c_canon == canonical_cand_comp or c_canon in canonical_cand_comp or canonical_cand_comp in c_canon):
            return True, c
    return False, ""


def calculate_relevance_score(
    lead: Any,
    settings: Any,
    has_associated_job: bool = False,
    company_has_active_jobs: bool = False,
) -> Dict[str, Any]:
    """
    Calculates transparent 0-100 relevance score:
    - ROLE RELEVANCE:       max 30 pts
    - TECHNICAL RELEVANCE:  max 30 pts
    - COMPANY RELEVANCE:    max 20 pts
    - LOCATION RELEVANCE:   max 10 pts
    - ACTIVE JOB RELEVANCE: max 10 pts
    TOTAL:                  max 100 pts
    """
    # Extract candidate attributes
    title = (getattr(lead, "title", None) or (lead.get("title") if isinstance(lead, dict) else "")) or ""
    company = (getattr(lead, "company", None) or (lead.get("company") if isinstance(lead, dict) else "")) or ""
    location = (getattr(lead, "location", None) or (lead.get("location") if isinstance(lead, dict) else "")) or ""
    role_category = getattr(lead, "role_category", None) or (lead.get("role_category") if isinstance(lead, dict) else None)
    if not role_category:
        role_category = infer_role_category(title)

    raw_tech_areas = getattr(lead, "technical_areas", None) or (lead.get("technical_areas") if isinstance(lead, dict) else None)
    if raw_tech_areas is not None:
        technical_areas = list(raw_tech_areas)
    else:
        technical_areas = infer_technical_areas(title)

    # Extract user settings
    target_roles = getattr(settings, "target_roles", None) or (settings.get("target_roles") if isinstance(settings, dict) else []) or []
    target_skills = getattr(settings, "target_technical_skills", None) or (settings.get("target_technical_skills") if isinstance(settings, dict) else []) or []
    target_companies = getattr(settings, "target_companies", None) or (settings.get("target_companies") if isinstance(settings, dict) else []) or []
    priority_companies = getattr(settings, "priority_companies", None) or (settings.get("priority_companies") if isinstance(settings, dict) else []) or []
    target_locations = getattr(settings, "target_locations", None) or (settings.get("target_locations") if isinstance(settings, dict) else []) or []

    title_lower = title.lower()

    # ==========================================
    # 1. ROLE RELEVANCE (0 - 30 points)
    # ==========================================
    role_points = 0
    role_reason = ""
    is_decision_maker = False
    is_recruiter = False
    is_target_eng = False

    # Decision makers in hardware/ASIC domain
    if (
        "asic design manager" in title_lower
        or "asic manager" in title_lower
        or "vlsi manager" in title_lower
        or "design manager" in title_lower
        or ("hiring manager" in title_lower and any(k in title_lower for k in ["hardware", "vlsi", "asic", "soc", "silicon", "rtl"]))
        or role_category in ("ASIC Design Manager", "VLSI Manager")
    ):
        role_points = 30
        role_reason = "Direct decision maker / Hiring Manager in hardware domain"
        is_decision_maker = True
    elif (
        any(k in title_lower for k in ["rtl lead", "physical design lead", "verification lead", "dv lead", "pd lead"])
        or ("technical lead" in title_lower and any(k in title_lower for k in ["rtl", "asic", "vlsi", "pd", "dv", "verification", "soc"]))
        or ("principal engineer" in title_lower and any(k in title_lower for k in ["rtl", "asic", "vlsi", "pd", "dv", "verification"]))
        or role_category in ("RTL Lead", "Physical Design Lead", "Verification Lead")
    ):
        role_points = 28
        role_reason = f"Senior technical lead involved in hiring ({role_category})"
        is_decision_maker = True
    elif (
        any(k in title_lower for k in ["rtl design engineer", "physical design engineer", "design verification engineer", "asic design engineer", "digital design engineer", "soc verification engineer"])
        or ("engineer" in title_lower and any(k in title_lower for k in ["rtl", "physical design", "design verification"]))
        or role_category in ("RTL Design Engineer", "Physical Design Engineer", "Design Verification Engineer", "ASIC Design Engineer", "Digital Design Engineer")
    ):
        role_points = 27
        role_reason = f"Direct target engineering role match ({role_category})"
        is_target_eng = True
    elif (
        any(k in title_lower for k in ["intern", "trainee", "graduate engineer"])
        and any(k in title_lower for k in ["rtl", "vlsi", "asic", "physical design", "verification", "digital design"])
        or role_category in ("RTL Intern", "Physical Design Intern", "Design Verification Intern", "VLSI Intern")
    ):
        role_points = 26
        role_reason = f"Target entry-level / internship role match ({role_category})"
        is_target_eng = True
    elif (
        "engineering manager" in title_lower
        or "director" in title_lower
        or "vp " in title_lower
        or role_category == "Engineering Manager"
    ):
        role_points = 24
        role_reason = "Engineering leadership with direct team oversight"
        is_decision_maker = True
    elif (
        any(k in title_lower for k in ["technical recruiter", "semiconductor recruiter", "vlsi recruiter"])
        or ("recruiter" in title_lower and any(k in title_lower for k in ["hardware", "silicon", "semiconductor", "vlsi", "tech"]))
        or role_category in ("Technical Recruiter", "Recruiter", "Talent Acquisition")
    ):
        role_points = 22
        role_reason = "Technical recruiter focused on semiconductor hiring"
        is_recruiter = True
    elif any(k in title_lower for k in ["technical lead", "tech lead", "staff engineer", "architect"]) or role_category == "Technical Lead":
        role_points = 22
        role_reason = "Hardware technical lead / staff engineer"
    elif "hr" in title_lower or role_category == "HR" or "talent" in title_lower:
        role_points = 15
        role_reason = "People operations / Human Resources contact"
    elif any(k in title_lower for k in ["firmware", "embedded", "test engineer", "cad engineer", "layout"]):
        role_points = 12
        role_reason = "Hardware ecosystem engineering contact"
    elif "engineer" in title_lower or "developer" in title_lower:
        role_points = 5
        role_reason = "Software / general engineering contact"
    else:
        role_points = 2
        role_reason = "General professional contact"

    # Boost for target role match
    if target_roles:
        for tr in target_roles:
            if tr.lower() in title_lower or tr.lower() == role_category.lower():
                if role_points < 30:
                    role_points = min(30, role_points + 2)
                break

    role_points = min(30, max(0, role_points))

    # ==========================================
    # 2. TECHNICAL RELEVANCE (0 - 30 points)
    # ==========================================
    technical_points = 0
    tech_reasons: List[str] = []
    areas_lower = [a.lower() for a in technical_areas]

    # Primary target domain match (RTL, PD, DV, Verilog, SystemVerilog, STA, UVM, Place & Route)
    has_primary_domain = any(
        any(k in a for k in ["rtl", "physical design", "verification", "systemverilog", "verilog", "sta", "uvm", "place and route", "timing closure", "synthesis"])
        for a in areas_lower
    ) or any(k in title_lower for k in ["rtl", "physical design", "verification", "systemverilog", "verilog", "sta", "uvm", "place and route"])

    has_broader_hardware = any(
        any(k in a for k in ["asic", "vlsi", "soc", "fpga", "digital design", "risc-v", "eda"])
        for a in areas_lower
    ) or any(k in title_lower for k in ["asic", "vlsi", "soc", "fpga", "digital design"])

    if has_primary_domain:
        technical_points = 18
        tech_reasons.append("Primary domain alignment (RTL/PD/DV)")
    elif has_broader_hardware:
        technical_points = 12
        tech_reasons.append("Semiconductor/ASIC/VLSI domain alignment")
    elif areas_lower:
        technical_points = 6
        tech_reasons.append("Hardware technology ecosystem")

    # Match user's target technical skills
    matched_target_skills: List[str] = []
    if target_skills:
        for s in target_skills:
            s_low = s.lower()
            if s_low in title_lower or any(s_low in a for a in areas_lower):
                matched_target_skills.append(s)

    if matched_target_skills:
        skill_boost = min(12, len(matched_target_skills) * 4)
        technical_points = min(30, technical_points + skill_boost)
        tech_reasons.append(f"Matched target skills: {', '.join(matched_target_skills[:3])}")

    # If completely no hardware keywords, zero technical points
    if not has_primary_domain and not has_broader_hardware and not matched_target_skills:
        technical_points = 0
        technical_reason = "No hardware/VLSI keywords identified"
    else:
        technical_points = min(30, max(0, technical_points))
        technical_reason = "; ".join(tech_reasons) if tech_reasons else "General hardware alignment"

    # ==========================================
    # 3. COMPANY RELEVANCE (0 - 20 points)
    # ==========================================
    company_points = 0
    company_reason = ""
    comp_canon = canonical_company_key(company)
    matched_company_name = company or "Company"

    is_priority, prio_name = _matches_company_list(comp_canon, priority_companies)
    is_target, target_name = _matches_company_list(comp_canon, target_companies)

    if is_priority:
        company_points = 20
        company_reason = f"High-priority company ({prio_name or company})"
        matched_company_name = prio_name or company
    elif is_target:
        company_points = 16
        company_reason = f"Target company watchlist match ({target_name or company})"
        matched_company_name = target_name or company
    elif any(f in comp_canon for f in BROAD_SEMICONDUCTOR_FIRMS) if comp_canon else False:
        company_points = 8
        company_reason = f"Semiconductor ecosystem company ({company})"
    elif company:
        company_points = 2
        company_reason = f"Company in extended market ({company})"
    else:
        company_points = 0
        company_reason = "Company unverified"

    company_points = min(20, max(0, company_points))

    # ==========================================
    # 4. LOCATION RELEVANCE (0 - 10 points)
    # ==========================================
    location_points = 0
    location_reason = ""
    loc_lower = location.lower() if location else ""

    is_pref, pref_label = is_location_preferred(location, target_locations)

    if is_pref:
        location_points = 10
        location_reason = f"Preferred location ({location or pref_label})"
    elif "remote" in loc_lower:
        location_points = 6
        location_reason = "Remote location"
    elif "india" in loc_lower or any(c in loc_lower for c in ["pune", "chennai", "mumbai", "kolkata"]):
        location_points = 4
        location_reason = f"India tech ecosystem ({location})"
    elif any(hub in loc_lower for hub in ["san jose", "austin", "santa clara", "sunnyvale", "hsinchu", "munich"]):
        location_points = 3
        location_reason = f"Global tech hub ({location})"
    elif location:
        location_points = 1
        location_reason = f"Location recorded ({location})"
    else:
        location_points = 0
        location_reason = "Location not specified"

    location_points = min(10, max(0, location_points))

    # ==========================================
    # 5. ACTIVE JOB RELEVANCE (0 - 10 points)
    # ==========================================
    job_points = 0
    job_reason = ""
    if has_associated_job:
        job_points = 10
        job_reason = "Directly tied to an active, relevant VLSI/ASIC job opening"
    elif company_has_active_jobs:
        job_points = 5
        job_reason = "Company has active job openings in CRM"
    else:
        job_points = 0
        job_reason = "No active direct job currently attached"

    job_points = min(10, max(0, job_points))

    # ==========================================
    # FINAL SCORE (Naturally bounded 0 - 100)
    # ==========================================
    raw_total = role_points + technical_points + company_points + location_points + job_points
    # Safe defensive clamp
    final_score = round(min(100.0, max(0.0, float(raw_total))), 1)

    # Human-readable "Why Recommended" Explanation based on real matched factors
    key_factors: List[str] = []
    if is_decision_maker:
        key_factors.append(f"{role_category or 'Hiring Lead'}")
    elif is_recruiter:
        key_factors.append("Technical recruiter focused on semiconductor hiring")
    elif is_target_eng:
        key_factors.append(f"{role_category or title}")

    if has_primary_domain:
        if matched_target_skills:
            key_factors.append(f"strong {'/'.join(matched_target_skills[:2])} alignment")
        else:
            key_factors.append("RTL/Physical Design/Verification domain match")
    elif matched_target_skills:
        key_factors.append(f"skilled in {matched_target_skills[0]}")

    if is_priority:
        key_factors.append(f"at high-priority company {matched_company_name}")
    elif is_target:
        key_factors.append(f"at target company {matched_company_name}")
    elif company:
        key_factors.append(f"at {company}")

    if is_pref and location:
        key_factors.append(f"in preferred location {location}")

    if job_points == 10:
        key_factors.append("linked to active job opening")

    if key_factors:
        recommendation_reason = "; ".join(key_factors) + "."
    else:
        recommendation_reason = f"{title or 'Contact'} at {company or 'Target Company'}."

    breakdown = {
        "rolePoints": role_points,
        "roleReason": role_reason,
        "technicalPoints": technical_points,
        "technicalReason": technical_reason,
        "companyPoints": company_points,
        "companyReason": company_reason,
        "jobPoints": job_points,
        "jobReason": job_reason,
        "locationPoints": location_points,
        "locationReason": location_reason,
        "rawTotal": raw_total,
        "normalizedScore": final_score,
        "summaryExplanation": f"Score {final_score}/100 based on hardware role, technical skills, target company, and location criteria.",
    }

    return {
        "score": final_score,
        "breakdown": breakdown,
        "recommendation_reason": recommendation_reason,
        "role_category": role_category,
        "technical_areas": technical_areas,
    }
