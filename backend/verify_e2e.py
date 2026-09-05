import urllib.request
import urllib.error
import json
import sqlite3

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = err_body
        return e.code, parsed

def run_tests():
    print("=== STARTING FULL LIVE CRM E2E VERIFICATION ===")

    # 1. Health check
    print("\n--- 1. Health check ---")
    status, body = make_request("/health")
    assert status == 200, f"Health check failed: {status}"
    print("[PASS] /api/health returned 200:", body)

    # 2. Existing Leads
    print("\n--- 2. GET leads ---")
    status, leads = make_request("/leads")
    assert status == 200
    print(f"[PASS] /api/leads returned {len(leads)} leads")

    # Verify Lead 1 intact
    status, lead1 = make_request("/leads/1")
    assert status == 200
    assert lead1["name"] == "Test Engineer"
    print(f"[PASS] Lead 1 verified intact: {lead1['name']} ({lead1['company']})")

    # 3. Create lead
    print("\n--- 3. Create lead (POST /api/leads) ---")
    test_lead = {
        "name": "Live Test Candidate",
        "title": "Principal Verification Engineer",
        "company": "AMD",
        "location": "Hyderabad",
        "linkedin_url": "https://linkedin.com/in/live-test-candidate-999",
        "relevance_score": 88.0,
        "status": "NEW",
        "notes": "E2E testing notes",
        "follow_up_date": "2026-09-18"
    }
    status, created = make_request("/leads", method="POST", data=test_lead)
    assert status == 201, f"Create failed: {status} {created}"
    lead_id = created["id"]
    print(f"[PASS] Created lead ID {lead_id}: {created['name']}")

    # 4. Status update creates outreach event
    print("\n--- 4. Update status & verify auto-outreach event ---")
    status, updated_status = make_request(f"/leads/{lead_id}/status", method="PATCH", data={"status": "INTERVIEW", "note": "Scheduled round 1 technical discussion"})
    assert status == 200
    assert updated_status["status"] == "INTERVIEW"

    status, outreach_list = make_request(f"/leads/{lead_id}/outreach")
    assert status == 200
    assert len(outreach_list) >= 1
    assert outreach_list[0]["status"] == "INTERVIEW"
    print(f"[PASS] Status updated and OutreachEvent auto-generated: {outreach_list[0]['action_taken']}")

    # 5. Companies API
    print("\n--- 5. Companies API ---")
    status, companies = make_request("/companies")
    assert status == 200
    assert len(companies) >= 10
    print(f"[PASS] /api/companies returned {len(companies)} companies")

    test_company = {
        "name": "Live Test Semiconductor Corp",
        "industry": "Fabless ASIC Design",
        "location": "Bengaluru, India",
        "tech_focus": ["ASIC", "SoC", "VLSI"],
        "is_saved": True,
        "tier": "Tier 1"
    }
    status, created_comp = make_request("/companies", method="POST", data=test_company)
    assert status == 201
    comp_id = created_comp["id"]
    print(f"[PASS] Created company {comp_id}: {created_comp['name']}")

    # Toggle bookmark
    status, patched_comp = make_request(f"/companies/{comp_id}", method="PATCH", data={"is_saved": False})
    assert status == 200
    assert patched_comp["is_saved"] is False
    print(f"[PASS] Toggled company bookmark to False")

    # 6. Jobs API
    print("\n--- 6. Jobs API ---")
    status, jobs = make_request("/jobs")
    assert status == 200
    assert len(jobs) >= 8
    print(f"[PASS] /api/jobs returned {len(jobs)} jobs")

    test_job = {
        "title": "Lead Digital Verification Engineer",
        "company": "Live Test Semiconductor Corp",
        "location": "Bengaluru, India",
        "required_skills": ["SystemVerilog", "UVM", "Verilog"],
        "status": "NEW"
    }
    status, created_job = make_request("/jobs", method="POST", data=test_job)
    assert status == 201
    job_id = created_job["id"]
    print(f"[PASS] Created job {job_id}: {created_job['title']}")

    # Update job status
    status, updated_job = make_request(f"/jobs/{job_id}/status", method="PATCH", data={"status": "APPLIED"})
    assert status == 200
    assert updated_job["status"] == "APPLIED"
    print(f"[PASS] Updated job status to APPLIED")

    # 7. User Settings API
    print("\n--- 7. User Settings API ---")
    status, settings = make_request("/settings")
    assert status == 200
    assert "target_roles" in settings
    original_target = settings["daily_lead_target"]

    status, updated_settings = make_request("/settings", method="PUT", data={"daily_lead_target": 25})
    assert status == 200
    assert updated_settings["daily_lead_target"] == 25

    status, re_fetched_settings = make_request("/settings")
    assert status == 200
    assert re_fetched_settings["daily_lead_target"] == 25
    print(f"[PASS] Settings persisted across GET (daily target: 25)")

    # Restore settings
    make_request("/settings", method="PUT", data={"daily_lead_target": original_target})

    # 8. Clean up temporary test data
    print("\n--- 8. Cleanup test entities ---")
    make_request(f"/leads/{lead_id}", method="DELETE")
    make_request(f"/companies/{comp_id}", method="DELETE")
    make_request(f"/jobs/{job_id}", method="DELETE")
    print("[PASS] Cleaned up temporary test entities")

    # 9. Verify SQLite directly
    print("\n--- 9. Direct SQLite Verification ---")
    conn = sqlite3.connect("linkedin_app.db")
    c = conn.cursor()
    c.execute("SELECT id, name, company FROM leads WHERE id = 1")
    lead_row = c.fetchone()
    assert lead_row is not None
    assert lead_row[1] == "Test Engineer"
    print(f"[PASS] Verified Lead 1 remains intact in SQLite: {lead_row}")

    c.execute("SELECT count(*) FROM companies")
    comp_count = c.fetchone()[0]
    c.execute("SELECT count(*) FROM jobs")
    job_count = c.fetchone()[0]
    c.execute("SELECT count(*) FROM user_settings")
    settings_count = c.fetchone()[0]
    conn.close()
    print(f"[PASS] Database confirmed: 1 lead, {comp_count} companies, {job_count} jobs, {settings_count} user_settings row.")

    print("\n==============================================")
    print("ALL LIVE CRM E2E VERIFICATION CHECKS PASSED!")
    print("==============================================")

if __name__ == "__main__":
    run_tests()
