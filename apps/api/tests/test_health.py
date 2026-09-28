"""
BhuSetu 3D Backend Health Endpoint Tests
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 2: Authentication, Authorization & Application Shell
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings


@pytest.mark.asyncio
async def test_root_endpoint():
    """Verify root endpoint returns project descriptor and documentation links."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "BhuSetu" in data["project"] or "ASTATINE" in data["project"]
        assert data["team"] == "TANTRAKATHA"
        assert data["problem_statement"] == "SIH26011"
        assert "/api/v1/health" in data["health_check"]


@pytest.mark.asyncio
async def test_api_health_endpoint():
    """Verify /api/v1/health returns instantaneous operational status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == settings.PROJECT_NAME
        assert "environment" in data


@pytest.mark.asyncio
async def test_database_health_endpoint_schema():
    """Verify /api/v1/health/database returns valid telemetry structure."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health/database")
        # Can be 200 (connected) or 503 (unavailable if database not reachable in test environment)
        assert response.status_code in [200, 503]
        data = response.json()
        assert "status" in data
        assert "connected" in data
        assert "database_type" in data
        assert "postgis_enabled" in data
        assert data["database_type"] == "PostgreSQL"


@pytest.mark.asyncio
async def test_system_health_endpoint_schema():
    """Verify /api/v1/health/system aggregates API and database telemetry."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health/system")
        assert response.status_code in [200, 503]
        data = response.json()
        assert data["service"] == settings.PROJECT_NAME
        assert "api_status" in data
        assert "database" in data
        assert "timestamp" in data
        assert isinstance(data["database"], dict)
