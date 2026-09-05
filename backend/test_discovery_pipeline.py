import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
from database import SessionLocal
from main import app
from models import DailyLeadBatch, DailyLeadBatchItem, Lead, UserSettings
from services.deduplication import (
    compute_lead_dedup_keys,
    deduplicate_candidates,
    is_candidate_duplicate,
)
from services.discovery import (
    generate_daily_leads,
    get_today_batch,
    rescore_single_lead,
    rescore_all_leads,
)
from services.normalization import (
    canonical_company_key,
    infer_role_category,
    infer_technical_areas,
    is_location_preferred,
    normalize_company,
    normalize_linkedin_url,
    normalize_location,
    normalize_name,
)
from services.scoring import calculate_relevance_score


def test_normalization():
    print("Testing normalization and location hierarchy...")
    # Name normalization
    assert normalize_name("  Dr. Rajesh   Kulkarni  ") == "Rajesh Kulkarni"
    assert normalize_name("Mr. Anita Venkatesh") == "Anita Venkatesh"

    # Location normalization
    assert normalize_location("bengaluru") == "Bangalore, India"
    assert normalize_location("Greater Noida, Delhi NCR") == "Noida, India"
    assert "Gujarat" in normalize_location("Ahmedabad")
    assert "Gujarat" in normalize_location("Gandhinagar")

    # Location hierarchy: Gujarat / Ahmedabad
    target_locations = ["Ahmedabad", "Gujarat", "Bangalore", "Noida", "Hyderabad"]
    is_pref, _ = is_location_preferred("Ahmedabad, Gujarat", target_locations)
    assert is_pref, "Ahmedabad must match preferred locations"
    is_pref_gandhi, _ = is_location_preferred("Gandhinagar, Gujarat", target_locations)
    assert is_pref_gandhi, "Gandhinagar in Gujarat must match Gujarat preference"
    is_pref_blore, _ = is_location_preferred("Bangalore, Karnataka", target_locations)
    assert is_pref_blore, "Bangalore must match preferred locations"

    # Company Canonicalization and Aliases
    assert canonical_company_key("NXP India Pvt Ltd") == "nxp"
    assert canonical_company_key("Qualcomm Technologies, Inc.") == "qualcomm"
    assert canonical_company_key("Renesas Electronics") == "renesas"
    assert canonical_company_key("Texas Instruments India") == "texasinstruments"
    assert canonical_company_key("Suchi Semicon Pvt Ltd") == "suchisemicon"

    # URL normalization
    assert normalize_linkedin_url("https://linkedin.com/in/user/?trk=abc#about") == "https://linkedin.com/in/user"
    assert normalize_linkedin_url("http://linkedin.com/in/user") == "https://linkedin.com/in/user"
    assert normalize_linkedin_url("#") is None

    # Role inference
    assert infer_role_category("ASIC Design Manager") == "ASIC Design Manager"
    assert infer_role_category("Senior RTL Lead") == "RTL Lead"
    assert infer_role_category("RTL Design Intern") == "RTL Intern"
    assert infer_role_category("Physical Design Trainee") == "Physical Design Intern"
    assert infer_role_category("Technical Recruiter - Hardware") == "Technical Recruiter"
    assert infer_role_category("Software Engineer") == "Other"

    # Technical areas inference
    areas = infer_technical_areas("Principal RTL & SystemVerilog Design Engineer with UVM and STA")
    assert "RTL" in areas
    assert "SystemVerilog" in areas
    assert "Design Verification" in areas
    assert "STA" in areas
    print("[OK] Normalization tests passed.")


def test_deduplication():
    print("Testing deduplication...")
    seen = set()
    keys1 = compute_lead_dedup_keys("John Doe", "Qualcomm", "https://linkedin.com/in/johndoe")
    for k in keys1:
        seen.add(k)

    # Same URL duplicate
    assert is_candidate_duplicate("Johnny Doe", "Other Corp", "https://linkedin.com/in/johndoe/", seen)

    # Same Name + Company duplicate
    assert is_candidate_duplicate("John Doe", "Qualcomm Inc.", None, seen)

    # Distinct candidate
    assert not is_candidate_duplicate("Jane Smith", "Intel", "https://linkedin.com/in/janesmith", seen)

    candidates = [
        {"name": "Alice", "company": "Intel", "linkedin_url": "https://linkedin.com/in/alice"},
        {"name": "Alice", "company": "Intel Corporation", "linkedin_url": "https://linkedin.com/in/alice-alt"},
        {"name": "Bob", "company": "AMD", "linkedin_url": "https://linkedin.com/in/bob"},
    ]
    unique = deduplicate_candidates(candidates)
    assert len(unique) == 2
    print("[OK] Deduplication tests passed.")


def test_scoring():
    print("Testing transparent 0-100 relevance scoring and component maximums...")
    settings = {
        "target_roles": [
            "RTL Design Engineer",
            "Physical Design Engineer",
            "Design Verification Engineer",
            "RTL Intern",
            "ASIC Design Manager",
            "RTL Lead",
        ],
        "target_technical_skills": [
            "RTL Design",
            "Physical Design",
            "Design Verification",
            "VLSI",
            "ASIC",
            "RTL",
            "Verilog",
            "SystemVerilog",
            "UVM",
            "STA",
        ],
        "target_locations": ["Ahmedabad", "Gujarat", "Bangalore", "Noida", "Hyderabad"],
        "target_companies": ["MosChip", "Truechip", "Verifast", "eInfochips", "Vicharak"],
        "priority_companies": ["NVIDIA", "Qualcomm", "Intel", "AMD", "Google", "Texas Instruments"],
    }

    # Candidate A: MosChip RTL Lead (Target company watchlist)
    cand_a = {
        "title": "RTL Lead",
        "company": "MosChip Technologies",
        "location": "Bangalore, India",
        "technical_areas": ["RTL", "SystemVerilog", "Verilog", "ASIC"],
        "role_category": "RTL Lead",
    }
    res_a = calculate_relevance_score(cand_a, settings, has_associated_job=False)
    b_a = res_a["breakdown"]

    # Assert component limits for Candidate A
    assert 0 <= b_a["rolePoints"] <= 30
    assert 0 <= b_a["technicalPoints"] <= 30
    assert 0 <= b_a["companyPoints"] <= 20
    assert 0 <= b_a["locationPoints"] <= 10
    assert 0 <= b_a["jobPoints"] <= 10
    assert 0 <= res_a["score"] <= 100
    assert b_a["companyPoints"] == 16, "MosChip is a target company watchlist match (16 pts)"
    assert res_a["score"] >= 80

    # Candidate B: Qualcomm Physical Design Manager (High-priority company)
    cand_b = {
        "title": "ASIC Design Manager - Physical Design",
        "company": "Qualcomm",
        "location": "Ahmedabad, Gujarat",
        "technical_areas": ["ASIC", "VLSI", "Physical Design", "STA"],
        "role_category": "ASIC Design Manager",
    }
    res_b = calculate_relevance_score(cand_b, settings, has_associated_job=True)
    b_b = res_b["breakdown"]
    assert b_b["companyPoints"] == 20, "Qualcomm is a high-priority company (20 pts)"
    assert b_b["locationPoints"] == 10, "Ahmedabad, Gujarat matches target location"
    assert b_b["jobPoints"] == 10, "Active job match (10 pts)"
    assert res_b["score"] <= 100
    assert res_b["score"] >= 85

    # Candidate C: Google Software Engineer (Priority company, but wrong role/tech)
    cand_c = {
        "title": "Software Engineer II - Backend Systems",
        "company": "Google",
        "location": "Bangalore, India",
        "technical_areas": [],
        "role_category": "Other",
    }
    res_c = calculate_relevance_score(cand_c, settings, has_associated_job=False)
    b_c = res_c["breakdown"]

    # Check that Candidate C gets 20 for Google, 10 for location, 5 for generic engineer, 0 for tech
    assert b_c["companyPoints"] == 20
    assert b_c["locationPoints"] == 10
    assert b_c["technicalPoints"] == 0
    assert res_c["score"] <= 40

    # CRITICAL: Candidate A (RTL Lead at target firm) must decisively OUTRANK Candidate C (SWE at Google)
    assert res_a["score"] > res_c["score"] + 35, "RTL Lead at MosChip must strongly outscore SWE at Google"
    assert res_b["score"] > res_c["score"] + 40, "PD Manager at Qualcomm must strongly outscore SWE at Google"

    # Boundary check: Maximum possible candidate
    cand_max = {
        "title": "ASIC Design Manager",
        "company": "NVIDIA",
        "location": "Bangalore",
        "technical_areas": ["RTL", "Verilog", "SystemVerilog", "ASIC", "VLSI", "UVM", "STA"],
        "role_category": "ASIC Design Manager",
    }
    res_max = calculate_relevance_score(cand_max, settings, has_associated_job=True)
    assert res_max["score"] == 100.0
    assert res_max["breakdown"]["rawTotal"] == 100

    print("[OK] Transparent scoring tests and component boundaries passed.")


def test_ingestion_api():
    print("Testing manual and CSV candidate ingestion pipeline...")
    client = TestClient(app)

    # 1. Manual single candidate ingestion
    new_candidate = {
        "name": "Testing Ingestion Candidate",
        "title": "RTL Design Engineer",
        "company": "MosChip",
        "location": "Ahmedabad",
        "linkedin_url": "https://www.linkedin.com/in/test-ingestion-rtl-unique-99",
        "notes": "Direct manual ingestion test",
        "source": "manual_test",
    }
    res = client.post("/api/ingestion/candidate", json=new_candidate)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "created"
    assert data["lead"] is not None
    assert data["lead"]["relevance_score"] >= 60
    assert "score_breakdown" in data["lead"]

    # 2. Duplicate ingestion check
    res_dup = client.post("/api/ingestion/candidate", json=new_candidate)
    assert res_dup.status_code == 200
    data_dup = res_dup.json()
    assert data_dup["status"] == "duplicate"
    assert "already exists" in data_dup["message"]

    # 3. Invalid candidate check (no name)
    res_invalid = client.post("/api/ingestion/candidate", json={"title": "RTL Lead", "company": "Intel"})
    assert res_invalid.status_code == 422

    # 4. Bulk CSV ingestion
    csv_rows = [
        {
            "name": "CSV Ingest Lead 1",
            "title": "Physical Design Engineer",
            "company": "Truechip",
            "location": "Noida",
            "linkedin_url": "https://www.linkedin.com/in/test-csv-lead-1",
        },
        {
            "name": "CSV Ingest Lead 2",
            "title": "Verification Lead",
            "company": "NXP",
            "location": "Bangalore",
            "linkedin_url": "https://www.linkedin.com/in/test-csv-lead-2",
        },
        # Intra-batch duplicate of Lead 1
        {
            "name": "CSV Ingest Lead 1 Duplicate",
            "title": "Physical Design Engineer",
            "company": "Truechip",
            "location": "Noida",
            "linkedin_url": "https://www.linkedin.com/in/test-csv-lead-1",
        },
        # Invalid row (empty name)
        {
            "name": "",
            "title": "ASIC Engineer",
            "company": "Intel",
        },
    ]

    res_csv = client.post("/api/ingestion/csv", json={"rows": csv_rows, "source": "csv_test"})
    assert res_csv.status_code == 200
    report = res_csv.json()
    assert report["imported"] == 2
    assert report["duplicates"] == 1
    assert report["invalid"] == 1
    print("[OK] Ingestion pipeline API tests passed.")


def test_discovery_pipeline_and_api():
    print("Testing discovery pipeline and API endpoints...")
    db = SessionLocal()
    try:
        # Generate batch
        batch, count = generate_daily_leads(db, force=True, target_count=15)
        assert batch is not None
        assert count > 0
        assert len(batch.items) == count

        # Verify ranking order (descending score)
        scores = [item.score for item in batch.items]
        assert scores == sorted(scores, reverse=True)

        # Verify idempotency
        batch2, count2 = generate_daily_leads(db, force=False)
        assert batch2.id == batch.id
        assert count2 == count

        # Verify leads have score breakdowns and reasons
        first_item = batch.items[0]
        assert first_item.lead is not None
        assert first_item.lead.relevance_score > 0
        assert first_item.lead.score_breakdown is not None
        assert first_item.lead.recommendation_reason is not None

        # Test single rescore
        rescored = rescore_single_lead(db, first_item.lead_id)
        assert rescored is not None
        assert rescored.relevance_score > 0

        # Test rescore all
        rescored_total = rescore_all_leads(db)
        assert rescored_total > 0
    finally:
        db.close()

    # Test via FastAPI TestClient
    client = TestClient(app)

    # GET /api/discovery/today
    res = client.get("/api/discovery/today")
    assert res.status_code == 200
    data = res.json()
    assert data is not None
    assert "items" in data
    assert len(data["items"]) > 0

    # GET /api/discovery/batches
    res_batches = client.get("/api/discovery/batches")
    assert res_batches.status_code == 200
    assert len(res_batches.json()) >= 1

    # POST /api/discovery/generate (regenerate=True)
    res_regen = client.post("/api/discovery/generate?regenerate=true&target_count=10")
    assert res_regen.status_code == 200
    gen_data = res_regen.json()
    assert gen_data["target_count"] == 10
    assert len(gen_data["items"]) == 10

    # POST /api/leads/rescore-all
    res_rescore = client.post("/api/leads/rescore-all")
    assert res_rescore.status_code == 200
    assert res_rescore.json()["rescored_count"] > 0

    # GET /api/leads
    res_leads = client.get("/api/leads")
    assert res_leads.status_code == 200
    all_leads = res_leads.json()
    assert len(all_leads) > 0
    # Check that discovery fields are returned
    lead0 = all_leads[0]
    assert "score_breakdown" in lead0
    assert "recommendation_reason" in lead0
    assert "technical_areas" in lead0
    assert "role_category" in lead0

    print("[OK] Pipeline and API integration tests passed.")


if __name__ == "__main__":
    test_normalization()
    test_deduplication()
    test_scoring()
    test_ingestion_api()
    test_discovery_pipeline_and_api()
    print("\n=============================================")
    print("ALL BACKEND DISCOVERY & INGESTION TESTS PASSED!")
    print("=============================================")
