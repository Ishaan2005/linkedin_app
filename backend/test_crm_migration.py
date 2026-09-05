from fastapi.testclient import TestClient
from main import app
import sqlite3

client = TestClient(app)

def run_all_tests():
    print("=== RUNNING CRM MIGRATION TESTS ===")

    # 1. Health check
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
    print("[PASS] 1. Health check OK")

    # 2. Existing lead is intact
    r = client.get("/api/leads/1")
    assert r.status_code == 200
    lead1 = r.json()
    assert lead1["name"] == "Test Engineer"
    print(f"[PASS] 2. Existing Lead 1 intact: {lead1['name']} ({lead1['company']})")

    # 3. Companies CRUD
    r = client.get("/api/companies")
    assert r.status_code == 200
    comps = r.json()
    assert len(comps) >= 10
    print(f"[PASS] 3a. GET /api/companies returned {len(comps)} companies")

    first_comp = comps[0]
    r = client.get(f"/api/companies/{first_comp['id']}")
    assert r.status_code == 200
    assert r.json()["name"] == first_comp["name"]
    print(f"[PASS] 3b. GET /api/companies/{first_comp['id']} OK: {first_comp['name']}")

    # 404 on missing company
    r = client.get("/api/companies/999999")
    assert r.status_code == 404
    print("[PASS] 3c. GET /api/companies/999999 returned 404")

    # POST new company
    new_comp_payload = {
        "name": "Test Hardware Lab",
        "industry": "ASIC Design Services",
        "location": "Bengaluru, India",
        "website_url": "https://test-hw.example.com",
        "linkedin_url": "https://linkedin.com/company/test-hw",
        "tech_focus": ["ASIC", "VLSI", "RTL"],
        "description": "Custom ASIC test lab",
        "last_researched": "2026-09-05",
        "tier": "Startup",
        "is_saved": True,
    }
    r = client.post("/api/companies", json=new_comp_payload)
    assert r.status_code == 201
    created_comp = r.json()
    comp_id = created_comp["id"]
    assert created_comp["name"] == "Test Hardware Lab"
    assert created_comp["is_saved"] is True
    print(f"[PASS] 3d. POST /api/companies created ID {comp_id}")

    # 409 duplicate company name
    r = client.post("/api/companies", json=new_comp_payload)
    assert r.status_code == 409
    print("[PASS] 3e. Duplicate company rejected with 409")

    # PATCH company
    r = client.patch(f"/api/companies/{comp_id}", json={"is_saved": False, "tier": "Tier 2"})
    assert r.status_code == 200
    assert r.json()["is_saved"] is False
    assert r.json()["tier"] == "Tier 2"
    print(f"[PASS] 3f. PATCH /api/companies/{comp_id} updated is_saved and tier")

    # DELETE company
    r = client.delete(f"/api/companies/{comp_id}")
    assert r.status_code == 200
    assert client.get(f"/api/companies/{comp_id}").status_code == 404
    print(f"[PASS] 3g. DELETE /api/companies/{comp_id} OK")

    # 4. Jobs CRUD
    r = client.get("/api/jobs")
    assert r.status_code == 200
    jobs = r.json()
    assert len(jobs) >= 8
    print(f"[PASS] 4a. GET /api/jobs returned {len(jobs)} jobs")

    first_job = jobs[0]
    r = client.get(f"/api/jobs/{first_job['id']}")
    assert r.status_code == 200
    assert r.json()["title"] == first_job["title"]
    print(f"[PASS] 4b. GET /api/jobs/{first_job['id']} OK: {first_job['title']}")

    # 404 on missing job
    r = client.get("/api/jobs/999999")
    assert r.status_code == 404
    print("[PASS] 4c. GET /api/jobs/999999 returned 404")

    # POST new job
    new_job_payload = {
        "title": "Senior RTL Verification Engineer",
        "company": "AMD",
        "location": "Bengaluru, India",
        "url": "https://amd.com/careers/test-job-1",
        "description": "Test verification role",
        "required_skills": ["SystemVerilog", "UVM"],
        "date_discovered": "2026-09-05",
        "status": "NEW",
        "salary_range": "₹20L - ₹30L PA",
        "experience_level": "2-4 Years",
        "associated_contact_ids": ["1"],
    }
    r = client.post("/api/jobs", json=new_job_payload)
    assert r.status_code == 201
    created_job = r.json()
    job_id = created_job["id"]
    assert created_job["company"] == "AMD"
    assert created_job["company_id"] is not None
    print(f"[PASS] 4d. POST /api/jobs created ID {job_id} linked to company_id {created_job['company_id']}")

    # PATCH job status
    r = client.patch(f"/api/jobs/{job_id}/status", json={"status": "APPLIED"})
    assert r.status_code == 200
    assert r.json()["status"] == "APPLIED"
    print(f"[PASS] 4e. PATCH /api/jobs/{job_id}/status updated status to APPLIED")

    # PATCH other job fields
    r = client.patch(f"/api/jobs/{job_id}", json={"salary_range": "₹22L - ₹32L PA"})
    assert r.status_code == 200
    assert r.json()["salary_range"] == "₹22L - ₹32L PA"
    print(f"[PASS] 4f. PATCH /api/jobs/{job_id} updated salary_range")

    # DELETE job
    r = client.delete(f"/api/jobs/{job_id}")
    assert r.status_code == 200
    assert client.get(f"/api/jobs/{job_id}").status_code == 404
    print(f"[PASS] 4g. DELETE /api/jobs/{job_id} OK")

    # 5. Outreach Events & Lead Status Auto-Event
    r = client.get("/api/outreach")
    assert r.status_code == 200
    initial_events_count = len(r.json())
    print(f"[PASS] 5a. GET /api/outreach returned {initial_events_count} events")

    # Change lead 1 status and verify outreach event is automatically created
    old_lead_status = lead1["status"]
    new_status = "INTERVIEW" if old_lead_status != "INTERVIEW" else "CONNECTED"
    r = client.patch(f"/api/leads/1/status", json={"status": new_status, "note": "Invited for round 1 interview"})
    assert r.status_code == 200
    assert r.json()["status"] == new_status
    print(f"[PASS] 5b. PATCH /api/leads/1/status changed status from {old_lead_status} to {new_status}")

    # Verify event was recorded for lead 1
    r = client.get("/api/leads/1/outreach")
    assert r.status_code == 200
    lead_events = r.json()
    assert len(lead_events) >= 1
    latest_evt = lead_events[0]
    assert latest_evt["lead_id"] == 1
    assert latest_evt["status"] == new_status
    assert "Invited for round 1 interview" in latest_evt["note"]
    print(f"[PASS] 5c. GET /api/leads/1/outreach confirmed automatic event creation: {latest_evt['action_taken']}")

    # Restore lead 1 status
    client.patch(f"/api/leads/1/status", json={"status": old_lead_status})

    # POST direct outreach event
    new_evt_payload = {
        "lead_id": 1,
        "lead_name": "Test Engineer",
        "lead_title": "RTL Design Engineer",
        "company": "Qualcomm",
        "status": "MESSAGE_SENT",
        "action_taken": "Follow-up message sent",
        "note": "Shared updated resume",
        "message_type": "LinkedIn message",
    }
    r = client.post("/api/outreach", json=new_evt_payload)
    assert r.status_code == 201
    created_evt = r.json()
    evt_id = created_evt["id"]
    print(f"[PASS] 5d. POST /api/outreach created event ID {evt_id}")

    # GET /api/outreach/{id}
    r = client.get(f"/api/outreach/{evt_id}")
    assert r.status_code == 200
    assert r.json()["note"] == "Shared updated resume"
    print(f"[PASS] 5e. GET /api/outreach/{evt_id} OK")

    # PATCH outreach event
    r = client.patch(f"/api/outreach/{evt_id}", json={"note": "Shared updated resume and portfolio"})
    assert r.status_code == 200
    assert r.json()["note"] == "Shared updated resume and portfolio"
    print(f"[PASS] 5f. PATCH /api/outreach/{evt_id} updated note")

    # DELETE outreach event
    r = client.delete(f"/api/outreach/{evt_id}")
    assert r.status_code == 200
    assert client.get(f"/api/outreach/{evt_id}").status_code == 404
    print(f"[PASS] 5g. DELETE /api/outreach/{evt_id} OK")

    # 6. User Settings GET & PUT
    r = client.get("/api/settings")
    assert r.status_code == 200
    settings = r.json()
    assert settings["id"] == 1
    assert "target_roles" in settings
    assert settings["daily_lead_target"] == 15
    print(f"[PASS] 6a. GET /api/settings OK: target_roles={len(settings['target_roles'])}, daily_target={settings['daily_lead_target']}")

    # PUT settings update
    updated_profile = dict(settings["candidate_profile"])
    updated_profile["name"] = "Aarav Patel (Updated)"
    r = client.put("/api/settings", json={
        "daily_lead_target": 20,
        "min_relevance_score": 70.0,
        "candidate_profile": updated_profile,
    })
    assert r.status_code == 200
    saved_settings = r.json()
    assert saved_settings["daily_lead_target"] == 20
    assert saved_settings["min_relevance_score"] == 70.0
    assert saved_settings["candidate_profile"]["name"] == "Aarav Patel (Updated)"
    print("[PASS] 6b. PUT /api/settings successfully updated and returned")

    # Verify persistence by fetching again
    r = client.get("/api/settings")
    assert r.status_code == 200
    assert r.json()["daily_lead_target"] == 20
    print("[PASS] 6c. Verified settings persisted across GET")

    # Restore daily_lead_target to 15
    client.put("/api/settings", json={"daily_lead_target": 15, "min_relevance_score": 60.0})

    # 7. Dev reset endpoint
    r = client.post("/api/dev/reset")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    print("[PASS] 7a. POST /api/dev/reset executed successfully")

    # Verify defaults restored
    r = client.get("/api/companies")
    assert len(r.json()) == 10
    r = client.get("/api/jobs")
    assert len(r.json()) == 8
    r = client.get("/api/settings")
    assert r.json()["daily_lead_target"] == 15
    print("[PASS] 7b. Verified defaults restored (10 companies, 8 jobs, settings)")

    # 8. VERIFY LEAD 1 IS STILL INTACT
    r = client.get("/api/leads/1")
    assert r.status_code == 200
    assert r.json()["name"] == "Test Engineer"
    print("[PASS] 8. CRITICAL VERIFICATION: Lead 1 is still intact in SQLite!")

    # Direct SQLite verification
    conn = sqlite3.connect("linkedin_app.db")
    c = conn.cursor()
    c.execute("SELECT count(*) FROM leads")
    lead_count = c.fetchone()[0]
    assert lead_count >= 1
    c.execute("SELECT count(*) FROM companies")
    comp_count = c.fetchone()[0]
    assert comp_count == 10
    c.execute("SELECT count(*) FROM jobs")
    job_count = c.fetchone()[0]
    assert job_count == 8
    conn.close()
    print(f"[PASS] 9. Direct SQLite verification passed: {lead_count} leads, {comp_count} companies, {job_count} jobs.")

    print("\n========================================")
    print("ALL CRM MIGRATION TESTS PASSED 100%!")
    print("========================================")

if __name__ == "__main__":
    run_all_tests()
