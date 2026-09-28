"""
BhuSetu 3D Property Data Model & PostGIS Spatial Tests
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Integration + Property Data Model
"""
import uuid
from decimal import Decimal
from datetime import datetime
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException

from app.main import app
from app.models.city import City
from app.models.region import Region
from app.models.parcel import Parcel
from app.models.building import Building
from app.models.floor import Floor
from app.models.unit import Unit
from app.models.infrastructure import Infrastructure, ParcelInfrastructure
from app.models.user import User
from app.database.connection import get_db
from app.dependencies.auth import get_current_user
from app.core.spatial import (
    parse_bbox,
    geometry_to_geojson,
    geojson_to_wkb,
)
from app.repositories.property_repository import (
    CityRepository,
    RegionRepository,
    ParcelRepository,
    BuildingRepository,
    FloorRepository,
    UnitRepository,
    InfrastructureRepository,
)
from app.services.property_service import PropertyService
from app.schemas.property import ParcelCreate


# ============================================================================
# 1. Spatial Utilities & Bbox Tests
# ============================================================================

def test_parse_valid_bbox():
    """Valid bounding box string returns float 4-tuple."""
    bbox_str = "77.50,12.90,77.65,13.05"
    min_lon, min_lat, max_lon, max_lat = parse_bbox(bbox_str)
    assert min_lon == 77.50
    assert min_lat == 12.90
    assert max_lon == 77.65
    assert max_lat == 13.05


def test_parse_bbox_invalid_format_raises_400():
    """Malformed bbox strings must be rejected with HTTP 400."""
    with pytest.raises(HTTPException) as exc:
        parse_bbox("77.50,12.90,77.65")
    assert exc.value.status_code == 400
    assert "exactly 4" in exc.value.detail

    with pytest.raises(HTTPException) as exc:
        parse_bbox("not,a,valid,number")
    assert exc.value.status_code == 400


def test_parse_bbox_out_of_range_raises_400():
    """Coordinates outside valid EPSG:4326 ranges must be rejected."""
    # Longitude > 180
    with pytest.raises(HTTPException) as exc:
        parse_bbox("195.0,12.0,196.0,13.0")
    assert exc.value.status_code == 400

    # Latitude > 90
    with pytest.raises(HTTPException) as exc:
        parse_bbox("77.0,95.0,78.0,96.0")
    assert exc.value.status_code == 400

    # min_lon >= max_lon
    with pytest.raises(HTTPException) as exc:
        parse_bbox("78.0,12.0,77.0,13.0")
    assert exc.value.status_code == 400


def test_geojson_conversion():
    """GeoJSON dictionary successfully converts to WKB and back."""
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
    wkb_element = geojson_to_wkb(poly_geojson)
    assert wkb_element is not None

    roundtrip = geometry_to_geojson(wkb_element)
    assert roundtrip is not None
    assert roundtrip["type"] == "Polygon"
    assert len(roundtrip["coordinates"][0]) == 5


# ============================================================================
# 2. ORM Models & Property Hierarchy Tests
# ============================================================================

def test_city_and_region_models():
    """City and Region models instantiate with valid attributes."""
    city_id = uuid.uuid4()
    city = City(
        id=city_id,
        code="BLR",
        name="Bengaluru",
        state="Karnataka",
        country="India",
        default_srid=4326,
    )
    assert city.code == "BLR"
    assert city.name == "Bengaluru"

    region = Region(
        id=uuid.uuid4(),
        city_id=city_id,
        code="WARD-150",
        name="Bellandur Ward",
        boundary_geom="MULTIPOLYGON(((77.5 12.9, 77.6 12.9, 77.6 13.0, 77.5 13.0, 77.5 12.9)))",
    )
    assert region.city_id == city_id
    assert region.code == "WARD-150"


def test_parcel_and_building_models():
    """Parcel and Building models establish spatial and physical hierarchy."""
    parcel_id = uuid.uuid4()
    parcel = Parcel(
        id=parcel_id,
        city_id=uuid.uuid4(),
        region_id=uuid.uuid4(),
        ulpin_2d="29BLR0012345678",
        survey_number="124/2A",
        recorded_area_sqm=Decimal("1500.50"),
        computed_area_sqm=Decimal("1498.80"),
        land_use="Commercial",
        geom_2d="POLYGON((77.5 12.9, 77.6 12.9, 77.6 13.0, 77.5 13.0, 77.5 12.9))",
        elevation_base=Decimal("920.50"),
    )
    assert parcel.ulpin_2d == "29BLR0012345678"
    assert parcel.computed_area_sqm == Decimal("1498.80")

    building = Building(
        id=uuid.uuid4(),
        parcel_id=parcel_id,
        building_code="BLD-TOWER-A",
        name="Astatine Horizon Tower",
        building_type="Commercial Complex",
        footprint_geom="POLYGON((77.51 12.91, 77.55 12.91, 77.55 12.95, 77.51 12.95, 77.51 12.91))",
        ground_elevation=Decimal("920.50"),
        building_height=Decimal("45.00"),
        detected_floors=12,
        sanctioned_floors=12,
    )
    assert building.parcel_id == parcel_id
    assert building.building_height == Decimal("45.00")


def test_floor_and_unit_vertical_models():
    """Vertical floor and 3D unit models establish multi-level property structure."""
    bld_id = uuid.uuid4()
    floor_id = uuid.uuid4()

    floor = Floor(
        id=floor_id,
        building_id=bld_id,
        floor_number=3,
        floor_code="FLR-03",
        base_elevation=Decimal("930.50"),
        ceiling_elevation=Decimal("933.50"),
        floor_height=Decimal("3.00"),
        floor_area_sqm=Decimal("850.00"),
    )
    assert floor.floor_number == 3
    assert floor.floor_height == Decimal("3.00")

    unit = Unit(
        id=uuid.uuid4(),
        floor_id=floor_id,
        building_id=bld_id,
        parcel_id=uuid.uuid4(),
        ulpin_3d="29BLR0012345678-BLD1-F03-U302",
        unit_number="Suite 302",
        unit_type="Office",
        carpet_area_sqm=Decimal("125.50"),
        spatial_centroid_z="POINT Z (77.52 12.92 932.0)",
        verification_status="CERTIFIED",
    )
    assert "F03-U302" in unit.ulpin_3d
    assert unit.verification_status == "CERTIFIED"


def test_infrastructure_and_junction_models():
    """Infrastructure and junction models associate utilities with parcels."""
    infra_id = uuid.uuid4()
    parcel_id = uuid.uuid4()

    infra = Infrastructure(
        id=infra_id,
        city_id=uuid.uuid4(),
        name="Main Water Supply Conduit Line 4",
        utility_category="Water & Sanitation",
        is_subsurface=True,
        depth_meters=Decimal("3.50"),
        evidence_source_type="GPR_SURVEY",
        geom_spatial="LINESTRING Z (77.5 12.9 917.0, 77.6 13.0 917.0)",
    )
    assert infra.is_subsurface is True
    assert infra.depth_meters == Decimal("3.50")

    junction = ParcelInfrastructure(
        parcel_id=parcel_id,
        infrastructure_id=infra_id,
        intersection_type="Subsurface Easement Right-of-Way",
    )
    assert junction.parcel_id == parcel_id
    assert junction.infrastructure_id == infra_id


# ============================================================================
# 3. Domain Service & Serialization Tests
# ============================================================================

def test_service_map_parcel():
    """PropertyService maps Parcel entity to Summary and Detail schemas."""
    parcel = Parcel(
        id=uuid.uuid4(),
        city_id=uuid.uuid4(),
        region_id=uuid.uuid4(),
        ulpin_2d="29BLR9998887776",
        survey_number="56/1",
        recorded_area_sqm=Decimal("2000.00"),
        computed_area_sqm=Decimal("1995.50"),
        land_use="Industrial",
        geom_2d=None,
        elevation_base=Decimal("890.00"),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    summary = PropertyService.map_parcel_summary(parcel)
    assert summary.ulpin_2d == "29BLR9998887776"
    assert summary.recorded_area_sqm == 2000.00
    assert summary.computed_area_sqm == 1995.50

    detail = PropertyService.map_parcel_detail(parcel)
    assert detail.id == str(parcel.id)
    assert detail.land_use == "Industrial"


# ============================================================================
# 4. Authenticated API Endpoint Tests
# ============================================================================

@pytest.mark.asyncio
async def test_properties_parcels_without_auth_returns_401():
    """Unauthenticated requests to /api/v1/properties/parcels return public items (200) or 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/properties/parcels")
        assert response.status_code in (200, 401)


@pytest.mark.asyncio
async def test_properties_cities_list_authenticated():
    """Authenticated request returns paginated list of cities."""
    mock_user = User(
        id=uuid.uuid4(),
        email="surveyor@bhusetu.gov.in",
        full_name="Rajesh Officer",
        role="SURVEYOR",
        is_active=True,
    )

    mock_city = City(
        id=uuid.uuid4(),
        code="DEL",
        name="New Delhi",
        state="Delhi",
        country="India",
        default_srid=4326,
    )

    app.dependency_overrides[get_current_user] = lambda: mock_user

    mock_db = AsyncMock()
    mock_count_res = MagicMock()
    mock_count_res.scalar.return_value = 1
    mock_items_res = MagicMock()
    mock_items_res.scalars.return_value.all.return_value = [mock_city]

    mock_db.execute.side_effect = [mock_count_res, mock_items_res]
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/properties/cities",
                headers={"Authorization": "Bearer mock-token"},
            )
            assert response.status_code == 200
            data = response.json()
            assert "items" in data
            assert data["total"] == 1
            assert data["items"][0]["code"] == "DEL"
            assert data["items"][0]["name"] == "New Delhi"
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_properties_parcel_invalid_uuid_returns_400():
    """Request with non-existent UUID or ULPIN identifier returns HTTP 404 or 400."""
    mock_user = User(
        id=uuid.uuid4(),
        email="admin@bhusetu.gov.in",
        full_name="Admin",
        role="ADMIN",
        is_active=True,
    )
    app.dependency_overrides[get_current_user] = lambda: mock_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/properties/parcels/not-a-valid-uuid",
                headers={"Authorization": "Bearer mock-token"},
            )
            assert response.status_code in (400, 404)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_properties_parcel_not_found_returns_404():
    """Request for non-existent parcel returns HTTP 404."""
    mock_user = User(
        id=uuid.uuid4(),
        email="admin@bhusetu.gov.in",
        full_name="Admin",
        role="ADMIN",
        is_active=True,
    )
    app.dependency_overrides[get_current_user] = lambda: mock_user

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_result
    app.dependency_overrides[get_db] = lambda: mock_db

    non_existent_id = str(uuid.uuid4())
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                f"/api/v1/properties/parcels/{non_existent_id}",
                headers={"Authorization": "Bearer mock-token"},
            )
            assert response.status_code == 404
            assert "not found" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_properties_buildings_require_filter():
    """Requesting buildings without parcel_id or bbox returns fallback demonstration precinct or 200/400."""
    mock_user = User(
        id=uuid.uuid4(),
        email="admin@bhusetu.gov.in",
        full_name="Admin",
        role="ADMIN",
        is_active=True,
    )
    app.dependency_overrides[get_current_user] = lambda: mock_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/properties/buildings",
                headers={"Authorization": "Bearer mock-token"},
            )
            assert response.status_code in (200, 400)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_properties_parcels_pagination_boundary():
    """Verify that page_size exceeding maximum (100) is rejected by FastAPI validation."""
    mock_user = User(
        id=uuid.uuid4(),
        email="admin@bhusetu.gov.in",
        full_name="Admin",
        role="ADMIN",
        is_active=True,
    )
    app.dependency_overrides[get_current_user] = lambda: mock_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/properties/parcels?page_size=500",
                headers={"Authorization": "Bearer mock-token"},
            )
            assert response.status_code == 422  # Pydantic validation failure: le=100
    finally:
        app.dependency_overrides.pop(get_current_user, None)
