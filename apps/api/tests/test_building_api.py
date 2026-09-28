"""
BhuSetu 3D AI Building Extraction & 3D API Tests
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 6: AI Building Extraction + 3D Generation
"""
import uuid
from decimal import Decimal
from datetime import datetime
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch, MagicMock
import shapely.geometry
from geoalchemy2.elements import WKBElement

from app.main import app
from app.models.user import User
from app.models.building import Building
from app.models.parcel import Parcel
from app.models.ai_job import AIExtractionJob
from app.database.connection import get_db
from app.dependencies.auth import get_current_user


@pytest.fixture
def mock_surveyor():
    return User(
        id=uuid.uuid4(),
        auth_user_id=uuid.uuid4(),
        email="surveyor.phase6@bhusetu3d.gov.in",
        full_name="Anil Kumar",
        role="SURVEYOR",
        is_active=True,
    )


@pytest.fixture
def mock_public_user():
    return User(
        id=uuid.uuid4(),
        auth_user_id=uuid.uuid4(),
        email="citizen@public.gov.in",
        full_name="Citizen User",
        role="PUBLIC_USER",
        is_active=True,
    )


@pytest.fixture
def sample_building_with_footprint():
    b_id = uuid.uuid4()
    p_id = uuid.uuid4()

    poly = shapely.geometry.Polygon([
        (77.590, 12.970),
        (77.592, 12.970),
        (77.592, 12.972),
        (77.590, 12.972),
        (77.590, 12.970)
    ])
    wkb_poly = WKBElement(poly.wkb, srid=4326)

    building = Building(
        id=b_id,
        parcel_id=p_id,
        building_code="BLD-TEST-3D-001",
        name="Test 3D Structure",
        building_type="COMMERCIAL",
        footprint_geom=wkb_poly,
        ground_elevation=Decimal("915.00"),
        building_height=Decimal("18.00"),
        detected_floors=6,
        sanctioned_floors=6,
        height_source="SURVEY",
        extraction_method="AI_SEGMENTATION_UNET",
        confidence_score=Decimal("0.890"),
        processing_version="v1.0",
        status_3d="3D_GENERATED",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    return building


@pytest.mark.asyncio
async def test_list_extraction_jobs_authenticated(mock_surveyor):
    """Verify listing extraction jobs for authenticated surveyor."""
    app.dependency_overrides[get_current_user] = lambda: mock_surveyor
    mock_db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_job = AIExtractionJob(
        id=uuid.uuid4(),
        model_name="building-segmentation-unet",
        model_version="v1.0",
        status="COMPLETED",
        stage="COMPLETED",
        progress_percent=100,
        buildings_detected=12,
        buildings_extracted=12,
        buildings_rejected=0,
        buildings_3d_generated=12,
        execution_logs=[],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    with patch("app.ai.services.extraction_job_service.AIExtractionJobService.list_jobs", return_value=[mock_job]):
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                res = await client.get("/api/v1/buildings/extraction-jobs", headers={"Authorization": "Bearer token"})
                assert res.status_code == 200
                data = res.json()
                assert len(data) == 1
                assert data[0]["model_name"] == "building-segmentation-unet"
                assert data[0]["status"] == "COMPLETED"
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_extraction_job_unauthorized_role_blocked(mock_public_user):
    """Verify PUBLIC_USER cannot trigger AI extraction jobs (HTTP 403)."""
    app.dependency_overrides[get_current_user] = lambda: mock_public_user
    mock_db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.post(
                "/api/v1/buildings/extraction-jobs",
                json={"model_name": "building-segmentation-unet"},
                headers={"Authorization": "Bearer token"}
            )
            assert res.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_buildings_geojson_3d_viewport(mock_surveyor, sample_building_with_footprint):
    """Verify viewport query for 3D building models."""
    app.dependency_overrides[get_current_user] = lambda: mock_surveyor
    mock_db = AsyncMock()

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [sample_building_with_footprint]
    mock_db.execute = AsyncMock(return_value=mock_result)
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get(
                "/api/v1/buildings/geojson/3d?bbox=77.58,12.96,77.60,12.98",
                headers={"Authorization": "Bearer token"}
            )
            assert res.status_code == 200
            data = res.json()
            assert data["type"] == "FeatureCollection"
            assert len(data["features"]) == 1
            props = data["features"][0]["properties"]
            assert props["building_code"] == "BLD-TEST-3D-001"
            assert props["extruded_height"] == 18.0
            assert props["base_elevation"] == 915.0
            assert props["top_elevation"] == 933.0
            assert props["status_3d"] == "3D_GENERATED"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_building_3d_detail(mock_surveyor, sample_building_with_footprint):
    """Verify fetching single 3D building detail with parent parcel context."""
    app.dependency_overrides[get_current_user] = lambda: mock_surveyor
    mock_db = AsyncMock()

    # Mock building and parcel queries
    b_result = MagicMock()
    b_result.scalar_one_or_none.return_value = sample_building_with_footprint

    p_result = MagicMock()
    p_result.scalar_one_or_none.return_value = None  # No parcel found is fine

    mock_db.execute = AsyncMock(side_effect=[b_result, p_result])
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get(
                f"/api/v1/buildings/{sample_building_with_footprint.id}/3d",
                headers={"Authorization": "Bearer token"}
            )
            assert res.status_code == 200
            data = res.json()
            assert data["building_code"] == "BLD-TEST-3D-001"
            assert data["building_height"] == 18.0
            assert data["confidence_score"] == 0.890
            assert data["status_3d"] == "3D_GENERATED"
    finally:
        app.dependency_overrides.clear()
