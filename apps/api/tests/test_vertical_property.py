"""
BhuSetu 3D Vertical Property Hierarchy & ULPIN Model Test Suite
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 7: Vertical Property Mapping + 3D ULPIN Model
"""
import uuid
from decimal import Decimal
from datetime import datetime
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch

from app.main import app
from app.models.city import City
from app.models.region import Region
from app.models.parcel import Parcel
from app.models.building import Building
from app.models.floor import Floor
from app.models.unit import Unit
from app.models.property_identity import PropertyIdentity
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.database.connection import get_db
from app.services.vertical_property_service import VerticalPropertyService
from app.core.spatial import geojson_to_wkb


@pytest.fixture
def mock_user():
    return User(
        id=uuid.uuid4(),
        email="surveyor@bhusetu.gov.in",
        full_name="Rajesh Kumar",
        role="SURVEYOR",
        department="Karnataka Revenue Department",
        is_active=True
    )


@pytest.fixture
def vertical_property_fixture():
    """Builds a complete, valid Parcel -> Building -> 3 Floors -> 6 Units fixture."""
    parcel_id = uuid.uuid4()
    building_id = uuid.uuid4()
    city_id = uuid.uuid4()
    region_id = uuid.uuid4()

    city = City(id=city_id, name="Bengaluru", code="BLR")
    region = Region(id=region_id, city_id=city_id, code="WARD-150", name="Bellandur")

    poly_geojson = {
        "type": "Polygon",
        "coordinates": [
            [
                [77.5946, 12.9716],
                [77.5956, 12.9716],
                [77.5956, 12.9726],
                [77.5946, 12.9726],
                [77.5946, 12.9716],
            ]
        ],
    }
    footprint_wkb = geojson_to_wkb(poly_geojson)

    parcel = Parcel(
        id=parcel_id,
        city_id=city_id,
        region_id=region_id,
        ulpin_2d="KA-BLR-2026-001",
        survey_number="SY-45/2B",
        recorded_area_sqm=Decimal("1500.00"),
        computed_area_sqm=Decimal("1498.50"),
        land_use="COMMERCIAL",
        elevation_base=Decimal("910.00"),
        geom_2d=footprint_wkb,
        city=city,
        region=region
    )

    building = Building(
        id=building_id,
        parcel_id=parcel_id,
        building_code="BLD-TECH-01",
        name="Silicon Heights Tower A",
        building_type="COMMERCIAL_OFFICE",
        footprint_geom=footprint_wkb,
        ground_elevation=Decimal("910.00"),
        building_height=Decimal("12.00"),
        detected_floors=3,
        sanctioned_floors=3,
        status_3d="3D_GENERATED",
        height_source="DSM_DEM_DIFFERENCE",
        extraction_method="AI_EXTRACTED",
        confidence_score=Decimal("0.920"),
        parcel=parcel
    )

    # 3 Floor Levels
    floor0_id = uuid.uuid4()
    floor1_id = uuid.uuid4()
    floor2_id = uuid.uuid4()

    floor0 = Floor(
        id=floor0_id,
        building_id=building_id,
        floor_number=0,
        floor_code="GF",
        floor_label="Ground Level",
        base_elevation=Decimal("910.00"),
        ceiling_elevation=Decimal("914.00"),
        floor_height=Decimal("4.00"),
        floor_area_sqm=Decimal("450.00"),
        status_3d="AVAILABLE",
        building=building,
        units=[]
    )

    floor1 = Floor(
        id=floor1_id,
        building_id=building_id,
        floor_number=1,
        floor_code="L1",
        floor_label="First Floor",
        base_elevation=Decimal("914.00"),
        ceiling_elevation=Decimal("918.00"),
        floor_height=Decimal("4.00"),
        floor_area_sqm=Decimal("450.00"),
        status_3d="AVAILABLE",
        building=building,
        units=[]
    )

    floor2 = Floor(
        id=floor2_id,
        building_id=building_id,
        floor_number=2,
        floor_code="L2",
        floor_label="Second Floor",
        base_elevation=Decimal("918.00"),
        ceiling_elevation=Decimal("922.00"),
        floor_height=Decimal("4.00"),
        floor_area_sqm=Decimal("450.00"),
        status_3d="AVAILABLE",
        building=building,
        units=[]
    )

    # Units
    point_geojson = {"type": "Point", "coordinates": [77.5950, 12.9720, 912.0]}
    point_wkb = geojson_to_wkb(point_geojson)

    unit01 = Unit(
        id=uuid.uuid4(),
        floor_id=floor0_id,
        building_id=building_id,
        parcel_id=parcel_id,
        ulpin_3d="BHU-3D-U001-F00-BLD-TECH-01",
        unit_number="001",
        unit_label="Retail Unit 001",
        unit_type="COMMERCIAL",
        carpet_area_sqm=Decimal("200.00"),
        spatial_centroid_z=point_wkb,
        verification_status="PENDING",
        status_3d="AVAILABLE",
        floor=floor0
    )

    unit02 = Unit(
        id=uuid.uuid4(),
        floor_id=floor0_id,
        building_id=building_id,
        parcel_id=parcel_id,
        ulpin_3d="BHU-3D-U002-F00-BLD-TECH-01",
        unit_number="002",
        unit_label="Retail Unit 002",
        unit_type="COMMERCIAL",
        carpet_area_sqm=Decimal("210.00"),
        spatial_centroid_z=point_wkb,
        verification_status="VERIFIED",
        status_3d="AVAILABLE",
        floor=floor0
    )

    floor0.units = [unit01, unit02]
    building.floors = [floor0, floor1, floor2]
    parcel.buildings = [building]

    return parcel, building, [floor0, floor1, floor2], [unit01, unit02]


# ============================================================================
# 1. Deterministic ULPIN-Oriented Prototype ID Generation Tests
# ============================================================================

def test_deterministic_ulpin_generation():
    """ULPIN-oriented prototype IDs must be deterministic, reproducible, and formatted correctly."""
    parcel_ulpin = "KA-BLR-2026-001"
    bld_code = "BLD-01"

    id1 = VerticalPropertyService.generate_property_ulpin(parcel_ulpin, bld_code)
    id2 = VerticalPropertyService.generate_property_ulpin(parcel_ulpin, bld_code)

    assert id1 == id2
    assert id1 == "BHU-3D-P-KA-BLR-2026-001-B-BLD-01"
    assert "BHU-3D" in id1

    floor_id = VerticalPropertyService.generate_floor_ulpin(bld_code, 2)
    assert floor_id == "BHU-3D-F02-BLD-01"

    unit_id = VerticalPropertyService.generate_unit_ulpin(bld_code, 2, "204")
    assert unit_id == "BHU-3D-U204-F02-BLD-01"


# ============================================================================
# 2. Vertical Geometry & Elevation Consistency Tests
# ============================================================================

def test_vertical_consistency_valid_case(vertical_property_fixture):
    """Consistent non-overlapping floors must pass vertical validation."""
    _, building, floors, _ = vertical_property_fixture
    result = VerticalPropertyService.validate_vertical_hierarchy(building, floors)

    assert result.is_valid is True
    assert len(result.discrepancies) == 0
    statuses = [c.status for c in result.checks]
    assert "FAILED" not in statuses


def test_vertical_consistency_invalid_floor_elevations(vertical_property_fixture):
    """Ceiling elevation <= base elevation must trigger FAILED check."""
    _, building, floors, _ = vertical_property_fixture
    # Invert elevations on floor 0
    floors[0].base_elevation = Decimal("914.00")
    floors[0].ceiling_elevation = Decimal("910.00")

    result = VerticalPropertyService.validate_vertical_hierarchy(building, floors)
    assert result.is_valid is False
    assert any("ceiling elevation" in d for d in result.discrepancies)


def test_vertical_consistency_floor_overlap(vertical_property_fixture):
    """Vertical overlap between floor ceiling and next floor base must be flagged."""
    _, building, floors, _ = vertical_property_fixture
    # Make floor 0 ceiling higher than floor 1 base
    floors[0].ceiling_elevation = Decimal("916.00")
    floors[1].base_elevation = Decimal("914.00")

    result = VerticalPropertyService.validate_vertical_hierarchy(building, floors)
    assert result.is_valid is False
    assert any("Vertical overlap detected" in d for d in result.discrepancies)


def test_vertical_consistency_exceeds_building_height(vertical_property_fixture):
    """Floors exceeding building top envelope must trigger WARNING discrepancy."""
    _, building, floors, _ = vertical_property_fixture
    # Building height 12m -> top is 922m. Make top floor ceiling 930m
    floors[2].ceiling_elevation = Decimal("930.00")

    result = VerticalPropertyService.validate_vertical_hierarchy(building, floors)
    assert any("VERTICAL DATA DISCREPANCY" in d for d in result.discrepancies)


def test_vertical_consistency_no_floors(vertical_property_fixture):
    """Building with no floors must report UNAVAILABLE without failing invalidly."""
    _, building, _, _ = vertical_property_fixture
    result = VerticalPropertyService.validate_vertical_hierarchy(building, [])
    assert result.is_valid is True
    assert result.checks[0].status == "UNAVAILABLE"


# ============================================================================
# 3. 3D GeoJSON Viewport Generation Tests
# ============================================================================

def test_get_building_floors_3d_geojson(vertical_property_fixture):
    """Converts building floor slabs into 3D GeoJSON features with elevations."""
    _, building, floors, _ = vertical_property_fixture
    geojson = VerticalPropertyService.get_building_floors_3d_geojson(building, floors)

    assert geojson.total_count == 3
    features = geojson.features
    assert len(features) == 3

    f0 = features[0]
    assert f0.properties["floor_number"] == 0
    assert f0.properties["base_elevation"] == 910.0
    assert f0.properties["ceiling_elevation"] == 914.0
    assert f0.properties["extruded_height"] == 4.0
    assert f0.properties["geometry_source"] == "INHERITED_FROM_BUILDING"


def test_get_floor_units_3d_geojson(vertical_property_fixture):
    """Converts floor units into GeoJSON features with centroid coordinates."""
    _, _, _, units = vertical_property_fixture
    geojson = VerticalPropertyService.get_floor_units_3d_geojson(units)

    assert geojson.total_count == 2
    u0 = geojson.features[0]
    assert u0.properties["unit_number"] == "001"
    assert u0.geometry["type"] == "Point"


# ============================================================================
# 4. API Route Endpoints Integration Tests
# ============================================================================

@pytest.mark.asyncio
async def test_get_property_hierarchy_endpoint(mock_user, vertical_property_fixture):
    """GET /api/v1/properties/{id}/hierarchy returns complete vertical tree."""
    parcel, building, floors, units = vertical_property_fixture

    app.dependency_overrides[get_current_user] = lambda: mock_user
    mock_session = AsyncMock()

    parcel_result = MagicMock()
    parcel_result.scalar_one_or_none.return_value = parcel

    identity_result = MagicMock()
    identity_result.scalar_one_or_none.return_value = None

    mock_session.execute.side_effect = [parcel_result, identity_result]
    app.dependency_overrides[get_db] = lambda: mock_session

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get(f"/api/v1/properties/{parcel.id}/hierarchy")
            assert res.status_code == 200
            data = res.json()
            assert data["property_id"] == str(parcel.id)
            assert "BHU-3D-P" in data["ulpin_oriented_id"]
            assert data["identity_status"] == "PROTOTYPE"
            assert "NOT claim official" in data["disclaimer"]
            assert data["completeness"]["floors"] == "AVAILABLE"
            assert len(data["buildings"]) == 1
            assert len(data["buildings"][0]["floors"]) == 3
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_building_floors_endpoint(mock_user, vertical_property_fixture):
    """GET /api/v1/properties/buildings/{id}/floors returns floor levels."""
    _, building, floors, _ = vertical_property_fixture

    app.dependency_overrides[get_current_user] = lambda: mock_user
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = floors
    mock_session.execute.return_value = mock_result
    app.dependency_overrides[get_db] = lambda: mock_session

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get(f"/api/v1/properties/buildings/{building.id}/floors")
            assert res.status_code == 200
            data = res.json()
            assert len(data) == 3
            assert data[0]["floor_number"] == 0
            assert data[0]["floor_code"] == "GF"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_building_floors_3d_endpoint(mock_user, vertical_property_fixture):
    """GET /api/v1/properties/buildings/{id}/floors/3d returns GeoJSON FeatureCollection."""
    _, building, floors, _ = vertical_property_fixture

    app.dependency_overrides[get_current_user] = lambda: mock_user
    mock_session = AsyncMock()

    b_res = MagicMock()
    b_res.scalar_one_or_none.return_value = building
    f_res = MagicMock()
    f_res.scalars.return_value.all.return_value = floors

    mock_session.execute.side_effect = [b_res, f_res]
    app.dependency_overrides[get_db] = lambda: mock_session

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get(f"/api/v1/properties/buildings/{building.id}/floors/3d")
            assert res.status_code == 200
            data = res.json()
            assert data["type"] == "FeatureCollection"
            assert data["total_count"] == 3
            assert data["features"][0]["properties"]["base_elevation"] == 910.0
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_validate_building_vertical_endpoint(mock_user, vertical_property_fixture):
    """POST /api/v1/properties/buildings/{id}/validate-vertical runs consistency checks."""
    _, building, floors, _ = vertical_property_fixture

    app.dependency_overrides[get_current_user] = lambda: mock_user
    mock_session = AsyncMock()
    b_res = MagicMock()
    b_res.scalar_one_or_none.return_value = building
    mock_session.execute.return_value = b_res
    app.dependency_overrides[get_db] = lambda: mock_session

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.post(f"/api/v1/properties/buildings/{building.id}/validate-vertical")
            assert res.status_code == 200
            data = res.json()
            assert data["is_valid"] is True
            assert len(data["checks"]) > 0
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_invalid_uuid_returns_400(mock_user):
    """Invalid UUID string in property hierarchy returns 400 Bad Request."""
    app.dependency_overrides[get_current_user] = lambda: mock_user
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get("/api/v1/properties/not-a-valid-uuid/hierarchy")
            assert res.status_code == 400
            assert "Invalid property UUID" in res.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected():
    """Unauthenticated requests without Bearer token must be rejected."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        dummy_id = str(uuid.uuid4())
        res = await ac.get(f"/api/v1/properties/{dummy_id}/hierarchy")
        assert res.status_code in (401, 403)
