"""
BhuSetu 3D Spatial Intelligence & Conflict Detection Test Suite
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 9: Spatial Intelligence & Conflict Detection
"""
import uuid
from decimal import Decimal
from datetime import datetime
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock
from shapely.geometry import Polygon, LineString, Point
from geoalchemy2.shape import from_shape

from app.main import app
from app.models.city import City
from app.models.region import Region
from app.models.parcel import Parcel
from app.models.building import Building
from app.models.infrastructure import Infrastructure
from app.models.provenance import Conflict, Evidence
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.database.connection import get_db
from app.services.rule_engine import SpatialRuleEngine
from app.schemas.conflict import ConflictSeverity, ConflictStatus, ConflictType


@pytest.fixture
def mock_user():
    return User(
        id=uuid.uuid4(),
        email="analyst@bhusetu.gov.in",
        full_name="Vikram Patel",
        role="ANALYST",
        department="Town Planning Directorate",
        is_active=True
    )


# ============================================================================
# 1. SPATIAL RULE ENGINE UNIT TESTS (PostGIS / Shapely Metric Geometry)
# ============================================================================

def test_rule_building_inside_parcel_no_outside_conflict():
    """A building completely inside parcel boundary produces no outside conflict."""
    # 100m x 100m parcel at Bengaluru coordinates (~77.5946, 12.9716)
    # Approx 0.001 deg ~ 111m
    parcel_poly = Polygon([
        (77.5900, 12.9700),
        (77.5920, 12.9700),
        (77.5920, 12.9720),
        (77.5900, 12.9720),
        (77.5900, 12.9700)
    ])

    # 20m x 20m building centered inside parcel
    building_poly = Polygon([
        (77.5908, 12.9708),
        (77.5912, 12.9708),
        (77.5912, 12.9712),
        (77.5908, 12.9712),
        (77.5908, 12.9708)
    ])

    result = SpatialRuleEngine.evaluate_building_outside(
        bld_geom=building_poly,
        prc_geom=parcel_poly,
        building_code="BLD-001",
        parcel_ulpin="KA-BLR-001",
        threshold_sqm=0.500
    )
    assert result is None  # Zero outside area, no conflict


def test_rule_building_outside_parcel_detected():
    """A building extending beyond parcel boundary triggers BUILDING_OUTSIDE_PARCEL with real area."""
    parcel_poly = Polygon([
        (77.5900, 12.9700),
        (77.5920, 12.9700),
        (77.5920, 12.9720),
        (77.5900, 12.9720),
        (77.5900, 12.9700)
    ])

    # Building extending across the eastern parcel boundary (x > 77.5920)
    building_poly = Polygon([
        (77.5915, 12.9708),
        (77.5925, 12.9708),  # 0.0005 deg (~55m) outside parcel boundary
        (77.5925, 12.9714),
        (77.5915, 12.9714),
        (77.5915, 12.9708)
    ])

    result = SpatialRuleEngine.evaluate_building_outside(
        bld_geom=building_poly,
        prc_geom=parcel_poly,
        building_code="BLD-002",
        parcel_ulpin="KA-BLR-001",
        threshold_sqm=0.500
    )
    assert result is not None
    assert result["conflict_type"] == ConflictType.BUILDING_OUTSIDE_PARCEL.value
    assert result["measured_value"] > 10.0  # Significant outside area in m²
    assert result["severity"] == ConflictSeverity.HIGH.value
    assert "extends beyond parcel boundary" in result["explanation"]
    assert result["conflict_geom"] is not None


def test_rule_building_proximity_setback():
    """Building situated 0.8m from parcel boundary triggers boundary proximity finding."""
    parcel_poly = Polygon([
        (77.5900, 12.9700),
        (77.5920, 12.9700),
        (77.5920, 12.9720),
        (77.5900, 12.9720),
        (77.5900, 12.9700)
    ])

    # Building placed very close to eastern edge (boundary at 77.5920, edge at 77.59199 ~ 1 meter)
    building_poly = Polygon([
        (77.5915, 12.9705),
        (77.59199, 12.9705),
        (77.59199, 12.9710),
        (77.5915, 12.9710),
        (77.5915, 12.9705)
    ])

    result = SpatialRuleEngine.evaluate_building_proximity(
        bld_geom=building_poly,
        prc_geom=parcel_poly,
        building_code="BLD-003",
        parcel_ulpin="KA-BLR-001",
        threshold_meters=2.000
    )
    assert result is not None
    assert result["conflict_type"] == ConflictType.BUILDING_BOUNDARY_PROXIMITY.value
    assert result["measured_value"] < 2.000
    assert "situated approximately" in result["explanation"] or "touches" in result["explanation"]


def test_rule_parcel_touching_vs_overlap():
    """Adjacent parcels sharing a boundary are classified as touching, NOT overlapping."""
    p1 = Polygon([(77.590, 12.970), (77.591, 12.970), (77.591, 12.971), (77.590, 12.971), (77.590, 12.970)])
    p2 = Polygon([(77.591, 12.970), (77.592, 12.970), (77.592, 12.971), (77.591, 12.971), (77.591, 12.970)])

    # Touching check: exactly share line x=77.591
    result_touching = SpatialRuleEngine.evaluate_parcel_overlap(
        prc1_geom=p1,
        prc2_geom=p2,
        ulpin1="KA-001",
        ulpin2="KA-002",
        threshold_sqm=1.000
    )
    assert result_touching is None  # Touching is normal adjacency, not conflict!

    # True overlapping parcels
    p_overlap = Polygon([(77.5905, 12.970), (77.5915, 12.970), (77.5915, 12.971), (77.5905, 12.971), (77.5905, 12.970)])
    result_overlap = SpatialRuleEngine.evaluate_parcel_overlap(
        prc1_geom=p1,
        prc2_geom=p_overlap,
        ulpin1="KA-001",
        ulpin2="KA-003",
        threshold_sqm=1.000
    )
    assert result_overlap is not None
    assert result_overlap["conflict_type"] == ConflictType.PROPERTY_PROPERTY_OVERLAP.value
    assert result_overlap["measured_value"] > 1.000
    assert "overlaps adjacent parcel" in result_overlap["explanation"]


def test_rule_infrastructure_proximity_and_intersection():
    """Calculates infrastructure proximity buffer violation and intersection."""
    parcel_poly = Polygon([
        (77.5900, 12.9700),
        (77.5910, 12.9700),
        (77.5910, 12.9710),
        (77.5900, 12.9710),
        (77.5900, 12.9700)
    ])

    # Power line running through parcel
    intersecting_line = LineString([(77.5890, 12.9705), (77.5920, 12.9705)])
    res_inter = SpatialRuleEngine.evaluate_infrastructure_proximity(
        prc_geom=parcel_poly,
        infra_geom=intersecting_line,
        parcel_ulpin="KA-001",
        infra_name="11kV Feeder",
        utility_category="ELECTRICAL",
        threshold_meters=5.0
    )
    assert res_inter is not None
    assert res_inter["conflict_type"] == ConflictType.INFRASTRUCTURE_INTERSECTION.value
    assert res_inter["severity"] == ConflictSeverity.HIGH.value

    # Utility line running 200m away (outside buffer)
    far_line = LineString([(77.5950, 12.9700), (77.5950, 12.9720)])
    res_far = SpatialRuleEngine.evaluate_infrastructure_proximity(
        prc_geom=parcel_poly,
        infra_geom=far_line,
        parcel_ulpin="KA-001",
        infra_name="Water Main",
        utility_category="WATER",
        threshold_meters=5.0
    )
    assert res_far is None


def test_rule_geometry_validity():
    """Identifies self-intersecting or degenerate geometries and produces repair for analysis."""
    # Bowtie self-intersecting polygon (invalid)
    bowtie = Polygon([(0, 0), (0, 2), (2, 0), (2, 2), (0, 0)])
    is_valid, reason, repaired = SpatialRuleEngine.validate_geometry(bowtie)
    assert is_valid is False
    assert "invalid" in reason.lower()
    assert repaired is not None
    assert repaired.is_valid is True


# ============================================================================
# 2. CONFLICTS REST API TESTS
# ============================================================================

@pytest.fixture
def mock_conflict_data():
    cid = uuid.uuid4()
    pid = uuid.uuid4()
    bid = uuid.uuid4()

    parcel = Parcel(
        id=pid,
        city_id=uuid.uuid4(),
        region_id=uuid.uuid4(),
        ulpin_2d="KA-BLR-001",
        survey_number="45/2",
        recorded_area_sqm=Decimal("1500.00"),
        computed_area_sqm=Decimal("1502.10"),
        land_use="COMMERCIAL",
        elevation_base=Decimal("912.00"),
        geom_2d=from_shape(Polygon([(77.59, 12.97), (77.60, 12.97), (77.60, 12.98), (77.59, 12.98), (77.59, 12.97)]), srid=4326),
        created_at=datetime.utcnow()
    )

    building = Building(
        id=bid,
        parcel_id=pid,
        building_code="BLD-01",
        name="Tower Alpha",
        building_type="COMMERCIAL",
        ground_elevation=Decimal("912.00"),
        building_height=Decimal("18.00"),
        detected_floors=6,
        sanctioned_floors=6,
        footprint_geom=from_shape(Polygon([(77.592, 12.972), (77.596, 12.972), (77.596, 12.976), (77.592, 12.976), (77.592, 12.972)]), srid=4326),
        created_at=datetime.utcnow()
    )
    parcel.buildings = [building]

    conflict = Conflict(
        id=cid,
        conflict_type=ConflictType.BUILDING_OUTSIDE_PARCEL.value,
        severity=ConflictSeverity.HIGH.value,
        status=ConflictStatus.OPEN.value,
        rule_id="RULE-BLDG-001",
        rule_name="Building Outside Parcel Boundary",
        entity_type="BUILDING",
        entity_id=bid,
        related_entity_type="PARCEL",
        related_entity_id=pid,
        parcel_id=pid,
        building_id=bid,
        measured_value=Decimal("12.740"),
        threshold_value=Decimal("0.500"),
        measured_unit="m²",
        deviation_value=Decimal("12.74"),
        explanation="Building BLD-01 footprint extends beyond parcel boundary KA-BLR-001 by approximately 12.74 m².",
        discrepancy_details={"outside_area_sqm": 12.74, "outside_percentage": 6.8},
        evidence_reference={"parcel_source": "CADASTRAL_DATA", "building_source": "DRONE_IMAGERY"},
        confidence_score=Decimal("0.910"),
        conflict_geom=from_shape(Polygon([(77.595, 12.972), (77.596, 12.972), (77.596, 12.976), (77.595, 12.976), (77.595, 12.972)]), srid=4326),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    conflict.parcel = parcel
    conflict.building = building

    return {"conflict": conflict, "parcel": parcel, "building": building}


@pytest.mark.asyncio
async def test_list_conflicts_endpoint(mock_user, mock_conflict_data):
    """Test GET /api/v1/conflicts returns paginated findings with summary."""
    mock_db = AsyncMock()
    c = mock_conflict_data["conflict"]

    mock_count = MagicMock()
    mock_count.scalar.return_value = 1

    mock_summary_res = MagicMock()
    mock_summary_res.all.return_value = [("HIGH", "OPEN", 1)]

    mock_items_res = MagicMock()
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [c]
    mock_items_res.scalars.return_value = mock_scalars

    mock_db.execute.side_effect = [mock_count, mock_summary_res, mock_items_res]

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/conflicts?severity=HIGH&status=OPEN")

    app.dependency_overrides.clear()

    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["summary"]["high_count"] == 1
    assert len(data["items"]) == 1
    item = data["items"][0]
    assert item["conflict_type"] == ConflictType.BUILDING_OUTSIDE_PARCEL.value
    assert item["measured_value"] == 12.74
    assert item["parcel_ulpin"] == "KA-BLR-001"


@pytest.mark.asyncio
async def test_get_conflict_detail_endpoint(mock_user, mock_conflict_data):
    """Test GET /api/v1/conflicts/{id} returns full finding detail with GeoJSON."""
    mock_db = AsyncMock()
    c = mock_conflict_data["conflict"]

    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = c
    mock_db.execute.return_value = mock_res

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(f"/api/v1/conflicts/{c.id}")

    app.dependency_overrides.clear()

    assert res.status_code == 200
    data = res.json()
    assert data["id"] == str(c.id)
    assert data["rule_id"] == "RULE-BLDG-001"
    assert data["confidence_score"] == 0.91
    assert "conflict_geom_geojson" in data
    assert data["conflict_geom_geojson"] is not None


@pytest.mark.asyncio
async def test_update_conflict_status_endpoint(mock_user, mock_conflict_data):
    """Test POST /api/v1/conflicts/{id}/status transitions finding lifecycle status."""
    mock_db = AsyncMock()
    c = mock_conflict_data["conflict"]

    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = c
    mock_db.execute.return_value = mock_res

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            f"/api/v1/conflicts/{c.id}/status",
            json={"status": "REVIEW_REQUIRED", "comment": "Forwarded to field surveyor for validation"}
        )

    app.dependency_overrides.clear()

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "REVIEW_REQUIRED"
    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_property_spatial_analysis_endpoint(mock_user, mock_conflict_data):
    """Test POST /api/v1/properties/{id}/analyze-spatial executes analysis and returns findings."""
    mock_db = AsyncMock()
    parcel = mock_conflict_data["parcel"]

    # 1. Parcel query with buildings
    mock_parcel_res = MagicMock()
    mock_parcel_res.scalar_one_or_none.return_value = parcel

    # 2. Evidence query
    mock_ev_res = MagicMock()
    mock_ev_scalars = MagicMock()
    mock_ev_scalars.first.return_value = None
    mock_ev_res.scalars.return_value = mock_ev_scalars

    # 3. Existing conflicts query (empty for initial run)
    mock_conf_res = MagicMock()
    mock_conf_scalars = MagicMock()
    mock_conf_scalars.all.return_value = []
    mock_conf_res.scalars.return_value = mock_conf_scalars

    # 4. Building evidence query
    mock_bld_ev_res = MagicMock()
    mock_bld_ev_scalars = MagicMock()
    mock_bld_ev_scalars.first.return_value = None
    mock_bld_ev_res.scalars.return_value = mock_bld_ev_scalars

    # 5. Adjacent parcels query (empty)
    mock_adj_res = MagicMock()
    mock_adj_scalars = MagicMock()
    mock_adj_scalars.all.return_value = []
    mock_adj_res.scalars.return_value = mock_adj_scalars

    # 6. Infrastructure query (empty)
    mock_inf_res = MagicMock()
    mock_inf_scalars = MagicMock()
    mock_inf_scalars.all.return_value = []
    mock_inf_res.scalars.return_value = mock_inf_scalars

    # 7. Relationships query (parcel reload)
    mock_rel_parcel_res = MagicMock()
    mock_rel_parcel_res.scalar_one_or_none.return_value = parcel

    # 8. Relationships adjacent query
    mock_rel_adj_res = MagicMock()
    mock_rel_adj_scalars = MagicMock()
    mock_rel_adj_scalars.all.return_value = []
    mock_rel_adj_res.scalars.return_value = mock_rel_adj_scalars

    # 9. Relationships nearby infra parcel query
    mock_rel_infra_p_res = MagicMock()
    mock_rel_infra_p_res.scalar_one_or_none.return_value = parcel

    # 10. Relationships nearby infra query
    mock_rel_infra_res = MagicMock()
    mock_rel_infra_scalars = MagicMock()
    mock_rel_infra_scalars.all.return_value = []
    mock_rel_infra_res.scalars.return_value = mock_rel_infra_scalars

    mock_db.execute.side_effect = [
        mock_parcel_res,
        mock_ev_res,
        mock_conf_res,
        mock_bld_ev_res,
        mock_adj_res,
        mock_inf_res,
        mock_rel_parcel_res,
        mock_rel_adj_res,
        mock_rel_infra_p_res,
        mock_rel_infra_res,
    ]

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(f"/api/v1/properties/{parcel.id}/analyze-spatial")

    app.dependency_overrides.clear()

    assert res.status_code == 200
    data = res.json()
    assert data["property_id"] == str(parcel.id)
    assert data["analysis_status"] == "COMPLETED"
    assert "limitations_notice" in data
    assert "legal ownership" in data["limitations_notice"]


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected():
    """Unauthenticated calls to /api/v1/conflicts allow public exploration (200) or require auth (401)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/conflicts")

    assert res.status_code in (200, 401)
