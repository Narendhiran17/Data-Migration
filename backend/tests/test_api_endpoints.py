import pytest
import io
import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Zoho" in data["service"]

def test_create_and_get_project():
    payload = {
        "name": "Acme Corp CRM Migration",
        "description": "Migration of contacts and accounts",
        "source_type": "File",
        "target_product": "CRM"
    }
    response = client.post("/api/v1/projects", json=payload)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["success"] is True
    project_data = res_json["data"]
    assert project_data["name"] == payload["name"]
    project_id = project_data["id"]

    # Retrieve project
    get_res = client.get(f"/api/v1/projects/{project_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == project_id

def test_upload_and_analyse_csv_file():
    # 1. Create a project
    proj_res = client.post("/api/v1/projects", json={
        "name": "CSV Ingestion Project",
        "target_product": "Creator"
    })
    project_id = proj_res.json()["data"]["id"]

    # 2. Upload CSV file
    csv_content = (
        "Lead_ID,Company,Email,Phone,Created_Date\n"
        "L100,Zoho Corp,contact@zoho.com,9876543210,2026-01-15\n"
        "L101,Advent Tech,info@advent.com,9876543211,2026-01-16\n"
        "L102,Beta Labs,invalid_email_format,9876543212,2026-01-17\n"
    )
    file_bytes = io.BytesIO(csv_content.encode("utf-8"))
    upload_res = client.post(
        "/api/v1/sources/upload",
        data={"project_id": project_id},
        files={"file": ("leads.csv", file_bytes, "text/csv")}
    )
    assert upload_res.status_code == 201
    file_id = upload_res.json()["data"]["file_id"]

    # 3. Trigger analysis
    analyse_res = client.post(f"/api/v1/sources/{file_id}/analyse")
    assert analyse_res.status_code == 200
    profile_data = analyse_res.json()["data"]
    assert profile_data["total_rows"] == 3
    assert profile_data["total_columns"] == 5
    assert len(profile_data["sheets"]) == 1

    # 4. Fetch profile
    profile_res = client.get(f"/api/v1/sources/{file_id}/profile")
    assert profile_res.status_code == 200

    # 5. Fetch preview
    preview_res = client.get(f"/api/v1/sources/{file_id}/preview?page=1&page_size=2")
    assert preview_res.status_code == 200
    preview_data = preview_res.json()["data"]
    assert preview_data["total_rows"] == 3
    assert len(preview_data["records"]) == 2
    assert preview_data["page"] == 1
    assert preview_data["total_pages"] == 2
