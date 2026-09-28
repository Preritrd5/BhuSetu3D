import os
import httpx
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
supabase_url = os.getenv("SUPABASE_URL")
service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print("Target Supabase URL:", supabase_url)

users = [
    {
        "id": "33333333-3333-4000-8000-000000000001",
        "email": "admin.official@bhusetu3d.gov.in",
        "password": "Password@123",
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Vikram Sen",
            "role": "ADMIN",
            "department": "Urban Development Directorate",
        },
    },
    {
        "id": "33333333-3333-4000-8000-000000000002",
        "email": "officer.kavita@bhusetu3d.gov.in",
        "password": "Password@123",
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Kavita Sharma",
            "role": "GOVERNMENT_OFFICER",
            "department": "Revenue & Cadastral Administration",
        },
    },
    {
        "id": "33333333-3333-4000-8000-000000000003",
        "email": "surveyor.rao@bhusetu3d.gov.in",
        "password": "Password@123",
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Sunil Rao",
            "role": "SURVEYOR",
            "department": "Directorate of Survey & Land Records",
        },
    },
    {
        "id": "33333333-3333-4000-8000-000000000004",
        "email": "analyst.priya@bhusetu3d.gov.in",
        "password": "Password@123",
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Priya Nair",
            "role": "ANALYST",
            "department": "GIS & Spatial Intelligence Unit",
        },
    },
]

headers = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
    "Content-Type": "application/json",
}

with httpx.Client(base_url=supabase_url, headers=headers, timeout=20.0) as client:
    for u in users:
        email = u["email"]
        resp = client.post("/auth/v1/admin/users", json=u)
        print(f"Created {email}: HTTP {resp.status_code}")
        if resp.status_code not in (200, 201):
            print("  Response:", resp.text)
