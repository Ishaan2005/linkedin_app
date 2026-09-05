from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
    print("[OK] Health endpoint OK")

def test_leads_crud():
    # 1. GET /api/leads
    r = client.get("/api/leads")
    assert r.status_code == 200
    initial_leads = r.json()
    print(f"[OK] GET /api/leads returned {len(initial_leads)} leads")

    # 2. GET /api/leads/{id}
    r = client.get("/api/leads/1")
    assert r.status_code == 200
    lead_1 = r.json()
    assert lead_1["id"] == 1
    print(f"[OK] GET /api/leads/1 OK: {lead_1['name']}")

    # 3. GET 404
    r = client.get("/api/leads/999999")
    assert r.status_code == 404
    print("[OK] GET /api/leads/999999 returns 404")

    # 4. Duplicate LinkedIn URL
    r = client.post("/api/leads", json={
        "name": "Duplicate Candidate",
        "linkedin_url": "https://linkedin.com/in/test-engineer"
    })
    assert r.status_code == 409
    print("[OK] Duplicate linkedin_url rejected with 409 Conflict")

    # 5. POST create a new lead
    new_lead_data = {
        "name": "Automated Test Candidate",
        "title": "Staff ASIC Engineer",
        "company": "NVIDIA",
        "location": "Bengaluru",
        "linkedin_url": "https://linkedin.com/in/auto-test-candidate-12345",
        "relevance_score": 92.5,
        "status": "NEW",
        "notes": "Testing notes persistence",
        "follow_up_date": "2026-09-20"
    }
    r = client.post("/api/leads", json=new_lead_data)
    assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"
    created = r.json()
    new_id = created["id"]
    assert created["name"] == "Automated Test Candidate"
    assert created["follow_up_date"] == "2026-09-20"
    assert created["notes"] == "Testing notes persistence"
    print(f"[OK] POST /api/leads created lead with id {new_id}")

    # 6. PATCH /api/leads/{id} notes & follow_up_date
    r = client.patch(f"/api/leads/{new_id}", json={
        "notes": "Updated notes via PATCH",
        "follow_up_date": "2026-09-25"
    })
    assert r.status_code == 200
    patched = r.json()
    assert patched["notes"] == "Updated notes via PATCH"
    assert patched["follow_up_date"] == "2026-09-25"
    print("[OK] PATCH /api/leads/{id} updated notes and follow_up_date")

    # 7. PATCH /api/leads/{id}/status
    r = client.patch(f"/api/leads/{new_id}/status", json={"status": "CONNECTED"})
    assert r.status_code == 200
    status_updated = r.json()
    assert status_updated["status"] == "CONNECTED"
    print("[OK] PATCH /api/leads/{id}/status updated status")

    # 8. DELETE /api/leads/{id}
    r = client.delete(f"/api/leads/{new_id}")
    assert r.status_code == 200
    assert r.json()["message"] == "Lead deleted successfully"
    print(f"[OK] DELETE /api/leads/{new_id} OK")

    # 9. Verify deleted
    r = client.get(f"/api/leads/{new_id}")
    assert r.status_code == 404
    print(f"[OK] Verified lead {new_id} is deleted")

if __name__ == "__main__":
    test_health()
    test_leads_crud()
    print("\nAll backend integration tests passed successfully!")
