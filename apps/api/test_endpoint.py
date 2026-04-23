from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

response = client.get("/admin/metrics", headers={"X-Admin-Id": "admin", "X-Admin-Password": "password"})
print(response.status_code)
print(response.json())
