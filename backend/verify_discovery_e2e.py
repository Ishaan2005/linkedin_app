import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import sqlite3
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def verify_discovery_e2e():
    print("=== RUNNING FULL DISCOVERY PIPELINE E2E VERIFICATION ===")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] 1. Health check OK")

    # 2. Settings check
    res = client.get("/api/settings")
    assert res.status_code == 200
    settings = res.json()
    assert "target_roles" in settings
    assert "daily_lead_target" in settings
    print(f"[PASS] 2. Settings OK: daily target = {settings['daily_lead_target']}, min score = {settings['min_relevance_score']}")

    # 3. Generate daily batch (force=True)
    res = client.post("/api/discovery/generate?force=true&target_count=15")
    assert res.status_code == 200, f"Generate failed: {res.text}"
    batch = res.json()
    assert batch["target_count"] == 15
    assert len(batch["items"]) == 15
    print(f"[PASS] 3. POST /api/discovery/generate created batch for {batch['date']} with {len(batch['items'])} ranked leads")

    # 4. Verify rank and descending scores
    scores = [item["score"] for item in batch["items"]]
    assert scores == sorted(scores, reverse=True), f"Batch items not in descending score order: {scores}"
    print(f"[PASS] 4. Batch items verified strictly ranked by score descending: max={scores[0]}, min={scores[-1]}")

    # 5. GET /api/discovery/today
    res_today = client.get("/api/discovery/today")
    assert res_today.status_code == 200
    today_batch = res_today.json()
    assert today_batch is not None
    assert today_batch["id"] == batch["id"]
    assert len(today_batch["items"]) == 15
    print(f"[PASS] 5. GET /api/discovery/today retrieved active batch (ID {today_batch['id']})")

    # 6. GET /api/discovery/batches
    res_batches = client.get("/api/discovery/batches")
    assert res_batches.status_code == 200
    batches = res_batches.json()
    assert len(batches) >= 1
    print(f"[PASS] 6. GET /api/discovery/batches returned {len(batches)} history records")

    # 7. GET /api/discovery/batches/{id}
    res_single_batch = client.get(f"/api/discovery/batches/{batch['id']}")
    assert res_single_batch.status_code == 200
    assert res_single_batch.json()["id"] == batch["id"]
    print(f"[PASS] 7. GET /api/discovery/batches/{batch['id']} retrieved batch by ID")

    # 8. Check item transparency and details
    first_item = batch["items"][0]
    lead = first_item["lead"]
    assert lead is not None
    assert "score_breakdown" in lead
    sb = lead["score_breakdown"]
    assert "rolePoints" in sb and "technicalPoints" in sb and "companyPoints" in sb and "jobPoints" in sb and "locationPoints" in sb
    assert lead["recommendation_reason"] is not None and len(lead["recommendation_reason"]) > 0
    assert lead["role_category"] is not None
    assert isinstance(lead["technical_areas"], list)
    print(f"[PASS] 8. Candidate transparency verified:")
    print(f"       Top candidate: {lead['name']} ({lead['title']} at {lead['company']})")
    print(f"       Score: {lead['relevance_score']}/100 | Category: {lead['role_category']}")
    print(f"       Recommendation reason: {lead['recommendation_reason']}")
    print(f"       Breakdown: role={sb['rolePoints']}, tech={sb['technicalPoints']}, company={sb['companyPoints']}, location={sb['locationPoints']}")

    # 9. Rescore all leads
    res_rescore_all = client.post("/api/leads/rescore-all")
    assert res_rescore_all.status_code == 200
    rescore_data = res_rescore_all.json()
    rescore_data_count = rescore_data["rescored_count"]
    assert rescore_data_count > 0
    print(f"[PASS] 9. POST /api/leads/rescore-all rescored {rescore_data_count} leads successfully")

    # 10. Rescore single lead
    lead_id = lead["id"]
    res_single = client.post(f"/api/leads/{lead_id}/rescore")
    assert res_single.status_code == 200
    rescored_lead = res_single.json()
    assert rescored_lead["id"] == lead_id
    assert rescored_lead["relevance_score"] > 0
    print(f"[PASS] 10. POST /api/leads/{lead_id}/rescore successfully rescored single lead")

    # 11. Direct SQLite database inspection
    db_path = BASE_DIR / "linkedin_app.db"
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM daily_lead_batches;")
    batch_count = cur.fetchone()[0]
    assert batch_count >= 1

    cur.execute("SELECT COUNT(*) FROM daily_lead_batch_items WHERE batch_id = ?;", (batch["id"],))
    item_count = cur.fetchone()[0]
    assert item_count == 15

    cur.execute("SELECT COUNT(*) FROM leads WHERE score_breakdown IS NOT NULL;")
    scored_leads = cur.fetchone()[0]
    assert scored_leads >= 15

    conn.close()
    print(f"[PASS] 11. Direct SQLite verification passed: {batch_count} batches, {item_count} items in batch {batch['id']}, {scored_leads} scored leads in DB")

    print("\n=======================================================")
    print("ALL DISCOVERY PIPELINE E2E VERIFICATION CHECKS PASSED!")
    print("=======================================================\n")


if __name__ == "__main__":
    verify_discovery_e2e()
