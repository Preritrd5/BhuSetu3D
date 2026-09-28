"""
BhuSetu 3D 4D Temporal Property History & Infrastructure Test Suite
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 12: 4D Property History + Infrastructure Intelligence
"""
import uuid
from decimal import Decimal
from datetime import datetime, date, timezone
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock

from app.main import app
from app.models.temporal import PropertyStateVersion, ChangeEvent
from app.models.building import Building
from app.models.parcel import Parcel
from app.models.infrastructure import Infrastructure
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.database.connection import get_db
from app.services.temporal_service import TemporalService
from app.services.infrastructure_service import InfrastructureService
from app.schemas.temporal import (
    ChangeType,
    InfrastructureRelationshipType,
    TemporalCompareRequest,
    TemporalAnalyzeRequest,
)


@pytest.fixture
def mock_analyst():
    return User(
        id=uuid.uuid4(),
        email="analyst.sharma@bhusetu.gov.in",
        full_name="Pooja Sharma",
        role="ANALYST",
        department="Directorate of Survey & Cadastre",
        is_active=True,
    )


@pytest.fixture
def sample_building_id():
    return uuid.uuid4()


@pytest.fixture
def sample_versions(sample_building_id):
    v1 = PropertyStateVersion(
        id=uuid.uuid4(),
        entity_type="BUILDING",
        entity_id=sample_building_id,
        version_number=1,
        observed_at=date(2024, 6, 1),
        valid_from=date(2024, 1, 1),
        valid_to=date(2025, 12, 31),
        observed_interval="Q2 2024",
        source_name="Aerial Photogrammetry 2024",
        attributes_snapshot={
            "footprint_area_sqm": 180.20,
            "measured_area": 180.20,
            "total_floors": 2,
            "height_meters": 7.40,
            "building_use": "RESIDENTIAL",
        },
        evidence_reference={"source": "DRONE_SURVEY_2024", "confidence": 0.92},
        confidence_score=Decimal("0.920"),
        verification_status="VERIFIED",
        created_at=datetime.now(timezone.utc),
    )

    v2 = PropertyStateVersion(
        id=uuid.uuid4(),
        entity_type="BUILDING",
        entity_id=sample_building_id,
        version_number=2,
        observed_at=date(2026, 6, 1),
        valid_from=date(2026, 1, 1),
        valid_to=None,
        observed_interval="Q2 2026",
        source_name="Drone LiDAR Survey 2026",
        attributes_snapshot={
            "footprint_area_sqm": 240.70,
            "measured_area": 240.70,
            "total_floors": 3,
            "height_meters": 10.60,
            "building_use": "RESIDENTIAL",
        },
        evidence_reference={"source": "LIDAR_2026", "confidence": 0.95},
        confidence_score=Decimal("0.950"),
        verification_status="VERIFIED",
        created_at=datetime.now(timezone.utc),
    )
    return [v1, v2]


@pytest.fixture
def sample_infrastructure():
    return Infrastructure(
        id=uuid.uuid4(),
        city_id=uuid.uuid4(),
        name="MG Road Trunk Corridor (R-12)",
        utility_category="ROAD",
        is_subsurface=False,
        depth_meters=Decimal("0.0"),
        evidence_source_type="BBMP_GIS_2026",
        observation_date=date(2026, 1, 1),
        network_connectivity={"is_physically_connected": False},
        created_at=datetime.now(timezone.utc),
    )


# ============================================================================
# 1. TEMPORAL COMPARISON & CHANGE DETECTION TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_compare_temporal_states_expansion_and_floors(sample_building_id, sample_versions):
    """Temporal comparison calculates area diff (+60.5 m²), percentage change (+33.57%), and floor diff (+1)."""
    mock_db = AsyncMock()

    v1, v2 = sample_versions
    # Mock versions query
    mock_res = MagicMock()
    mock_res.all.return_value = [
        (v1, '{"type":"Polygon","coordinates":[[[77.5,12.9],[77.6,12.9],[77.6,13.0],[77.5,13.0],[77.5,12.9]]]}'),
        (v2, '{"type":"Polygon","coordinates":[[[77.5,12.9],[77.65,12.9],[77.65,13.0],[77.5,13.0],[77.5,12.9]]]}'),
    ]

    # Mock change events query
    mock_chg_res = MagicMock()
    mock_chg_res.all.return_value = []

    mock_db.execute.side_effect = [mock_res, mock_chg_res]

    res = await TemporalService.compare_temporal_states(
        db=mock_db,
        entity_type="BUILDING",
        entity_id=sample_building_id,
        from_version_id=v1.id,
        to_version_id=v2.id,
    )

    assert res.entity_type == "BUILDING"
    assert res.entity_id == sample_building_id
    assert res.from_version.version_number == 1
    assert res.to_version.version_number == 2
    assert res.comparison_metrics["area_difference_sqm"] == 60.5
    assert res.comparison_metrics["percentage_change"] == pytest.approx(33.57, 0.1)
    assert res.comparison_metrics["floor_difference"] == 1
    assert res.comparison_metrics["height_difference_m"] == 3.2
    assert res.is_identical is False
    assert len(res.evidence_chain) == 2


@pytest.mark.asyncio
async def test_detect_and_record_changes_generates_classified_events(sample_building_id, sample_versions):
    """Detect and record classifies BUILDING_EXPANDED, FLOOR_COUNT_CHANGED, and HEIGHT_CHANGED."""
    mock_db = AsyncMock()
    v1, v2 = sample_versions

    mock_res = MagicMock()
    mock_res.all.return_value = [
        (v1, None),
        (v2, None),
    ]

    # Deduplication query returns None (not yet recorded)
    mock_dedup = MagicMock()
    mock_dedup.scalar_one_or_none.return_value = None

    # Latest audit hash
    mock_hash = MagicMock()
    mock_hash.scalar_one_or_none.return_value = "0" * 64

    mock_db.execute.side_effect = [
        mock_res,
        mock_dedup, mock_hash,
        mock_dedup, mock_hash,
        mock_dedup, mock_hash,
    ]

    events = await TemporalService.detect_and_record_changes(
        db=mock_db,
        entity_type="BUILDING",
        entity_id=sample_building_id,
        tolerance_pct=2.0,
        min_area_diff=1.0,
        persist_events=True,
    )

    types = [e.change_type for e in events]
    assert ChangeType.BUILDING_EXPANDED in types
    assert ChangeType.FLOOR_COUNT_CHANGED in types
    assert ChangeType.HEIGHT_CHANGED in types
    assert mock_db.commit.called


# ============================================================================
# 2. INFRASTRUCTURE PROXIMITY & TEMPORAL CONSISTENCY TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_infrastructure_proximity_and_temporal_mismatch_notice(sample_infrastructure):
    """Proximity analysis returns metric distance and emits temporal notice if dates differ."""
    mock_db = AsyncMock()
    parcel_id = uuid.uuid4()

    # 1. Parcel geometry lookup
    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = MagicMock()

    # 2. Proximity query
    mock_infra_res = MagicMock()
    mock_infra_res.all.return_value = [
        (sample_infrastructure, 8.72, False, '{"type":"LineString","coordinates":[[77.5,12.9],[77.6,12.9]]}'),
    ]

    mock_db.execute.side_effect = [mock_p_res, mock_infra_res]

    # Query with 2024 observation epoch against 2026 infrastructure
    res = await InfrastructureService.get_nearby_infrastructure(
        db=mock_db,
        property_id=parcel_id,
        property_type="PARCEL",
        max_distance_meters=50.0,
        observation_date=date(2024, 6, 1),
    )

    assert len(res.nearby_infrastructure) == 1
    item = res.nearby_infrastructure[0]
    assert item.name == "MG Road Trunk Corridor (R-12)"
    assert item.distance_meters == 8.72
    assert item.relationship_type == InfrastructureRelationshipType.WITHIN
    # Check temporal consistency warning (Requirement 63)
    assert res.is_historical_aligned is False
    assert "Current infrastructure is shown for reference" in res.temporal_notice


# ============================================================================
# 3. FASTAPI TEMPORAL ENDPOINT TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_get_property_history_endpoint(mock_analyst, sample_building_id, sample_versions):
    """GET /api/v1/properties/{id}/history returns discrete versions, events, and observation dates."""
    mock_db = AsyncMock()

    # 1. Building current state query
    mock_b_res = MagicMock()
    b = Building(
        id=sample_building_id,
        parcel_id=uuid.uuid4(),
        building_code="BLDG-KA-001",
        name="Tech Park Tower B",
        building_type="COMMERCIAL",
        ground_elevation=Decimal("0.0"),
        building_height=Decimal("10.60"),
        detected_floors=3,
        sanctioned_floors=3,
        footprint_geom="SRID=4326;POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))",
    )
    mock_b_res.scalar_one_or_none.return_value = b

    # 2. Versions query
    mock_v_res = MagicMock()
    mock_v_res.all.return_value = [
        (sample_versions[0], None),
        (sample_versions[1], None),
    ]

    # 3. Change events query
    mock_c_res = MagicMock()
    mock_c_res.all.return_value = []

    mock_db.execute.side_effect = [mock_b_res, mock_v_res, mock_c_res]

    app.dependency_overrides[get_current_user] = lambda: mock_analyst
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(f"/api/v1/properties/{sample_building_id}/history?entity_type=BUILDING")

    app.dependency_overrides.clear()

    assert res.status_code == 200
    data = res.json()
    assert data["entity_type"] == "BUILDING"
    assert data["entity_identifier"] == "BLDG-KA-001"
    assert len(data["versions"]) == 2
    assert "2024-06-01" in data["observation_dates"]
    assert "2026-06-01" in data["observation_dates"]


@pytest.mark.asyncio
async def test_compare_temporal_endpoint(mock_analyst, sample_building_id, sample_versions):
    """POST /api/v1/temporal/compare executes PostGIS metric comparison."""
    mock_db = AsyncMock()
    v1, v2 = sample_versions

    mock_res = MagicMock()
    mock_res.all.return_value = [(v1, None), (v2, None)]

    mock_chg_res = MagicMock()
    mock_chg_res.all.return_value = []

    mock_db.execute.side_effect = [mock_res, mock_chg_res]

    app.dependency_overrides[get_current_user] = lambda: mock_analyst
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/temporal/compare",
            json={
                "entity_type": "BUILDING",
                "entity_id": str(sample_building_id),
                "from_version_id": str(v1.id),
                "to_version_id": str(v2.id),
            }
        )

    app.dependency_overrides.clear()

    assert res.status_code == 200
    data = res.json()
    assert data["comparison_metrics"]["area_difference_sqm"] == 60.5
    assert data["comparison_metrics"]["floor_difference"] == 1
    assert "disclaimer_notice" in data


@pytest.mark.asyncio
async def test_get_property_infrastructure_endpoint(mock_analyst, sample_infrastructure):
    """GET /api/v1/properties/{id}/infrastructure returns nearby utilities with metric distances."""
    mock_db = AsyncMock()
    parcel_id = uuid.uuid4()

    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = MagicMock()

    mock_infra_res = MagicMock()
    mock_infra_res.all.return_value = [
        (sample_infrastructure, 14.5, False, None),
    ]

    mock_db.execute.side_effect = [mock_p_res, mock_infra_res]

    app.dependency_overrides[get_current_user] = lambda: mock_analyst
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(f"/api/v1/properties/{parcel_id}/infrastructure?property_type=PARCEL")

    app.dependency_overrides.clear()

    assert res.status_code == 200
    data = res.json()
    assert len(data["nearby_infrastructure"]) == 1
    assert data["nearby_infrastructure"][0]["distance_meters"] == 14.5
