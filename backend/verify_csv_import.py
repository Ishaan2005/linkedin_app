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

def test_csv_import_flow():
    print("--- Simulating CSV Import Flow ---")

    # Lead 1: New lead
    lead1 = {
        "name": "CSV Engineer One",
        "title": "Senior ASIC Verification Manager",
        "company": "NVIDIA",
        "location": "Bangalore India",
        "linkedin_url": "https://www.linkedin.com/in/csv-engineer-1",
        "relevance_score": 90.0,
        "status": "NEW",
        "notes": "Source: Company website | Email: csv1@example.com | Skills: ASIC; Design Verification"
    }

    # Lead 2: New lead
    lead2 = {
        "name": "CSV Engineer Two",
        "title": "RTL Micro-Architect",
        "company": "Qualcomm",
        "location": "Hyderabad India",
        "linkedin_url": "https://www.linkedin.com/in/csv-engineer-2",
        "relevance_score": 85.0,
        "status": "NEW",
        "notes": "Source: Public directory | Email: csv2@example.com | Skills: RTL; Verilog"
    }

    # Lead 3: Duplicate of existing lead (id 1: https://linkedin.com/in/test-engineer)
    lead3_dup = {
        "name": "Duplicate of Test Engineer",
        "title": "Engineer",
        "company": "Qualcomm",
        "linkedin_url": "https://linkedin.com/in/test-engineer",
        "relevance_score": 75.0,
        "status": "NEW",
        "notes": "Duplicate"
    }

    imported = 0
    duplicates = 0
    created_ids = []

    for lead in [lead1, lead2, lead3_dup]:
        status, resp = make_request("/leads", method="POST", data=lead)
        if status == 201:
            imported += 1
            created_ids.append(resp["id"])
            print(f"[PASS] Imported: {resp['name']} (ID {resp['id']})")
        elif status == 409:
            duplicates += 1
            print(f"[PASS] Handled duplicate gracefully: {lead['name']} ({resp.get('detail', '')})")
        else:
            print(f"[FAIL] Unexpected error: {status} {resp}")

    assert imported == 2, f"Expected 2 imported, got {imported}"
    assert duplicates == 1, f"Expected 1 duplicate, got {duplicates}"

    # Verify both leads exist in SQLite
    conn = sqlite3.connect("linkedin_app.db")
    c = conn.cursor()
    c.execute("SELECT id, name, company FROM leads WHERE linkedin_url IN (?, ?)",
              ("https://www.linkedin.com/in/csv-engineer-1", "https://www.linkedin.com/in/csv-engineer-2"))
    rows = c.fetchall()
    assert len(rows) == 2, f"Expected 2 rows in SQLite, found {len(rows)}"
    print(f"[PASS] Confirmed both leads in SQLite: {rows}")
    conn.close()

    # Clean up test leads
    for cid in created_ids:
        make_request(f"/leads/{cid}", method="DELETE")
    print("[PASS] Cleaned up CSV test leads")

    print("\nCSV Import simulation successfully completed!")

if __name__ == "__main__":
    test_csv_import_flow()
