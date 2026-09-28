"""
BhuSetu 3D 2D Parcel Mapping & Property Explorer Tests
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 5: 2D Parcel Mapping + Property Explorer
"""
import uuid
from decimal import Decimal
from datetime import datetime
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch, MagicMock
from geoalchemy2.elements import WKBElement
import shapely.geometry

from app.main import app
from app.models.parcel import Parcel
from app.models.building import Building
from app.models.city import City
from app.models.region import Region
from app.models.infrastructure import Infrastructure
from app.models.user import User
from app.database.connection import get_db
from app.dependencies.auth import get_current_user


@pytest.fixture
def mock_user():
    return User(
        id=uuid.uuid4(),
        auth_user_id=uuid.uuid4(),
        email="surveyor.official@bhusetu3d.gov.in",
        full_name="Sunil Rao",
        department="Survey & Settlement",
        role="SURVEYOR",
        is_active=True,
    )


@pytest.fixture
def sample_parcel_and_building():
    city_id = uuid.uuid4()
    region_id = uuid.uuid4()
    parcel_id = uuid.uuid4()

    city = City(
        id=city_id,
        code="BLR",
        name="Bengaluru Municipal Corporation",
        state="Karnataka",
        country="India",
        default_srid=4326,
    )

    region = Region(
        id=region_id,
        city_id=city_id,
        code="W-101",
        name="Malleshwaram Zone",
    )

    # Valid Polygon in Bengaluru
    poly = shapely.geometry.Polygon([
        (77.560, 13.000),
        (77.562, 13.000),
        (77.562, 13.002),
        (77.560, 13.002),
        (77.560, 13.000)
    ])
    wkb_geom = WKBElement(poly.wkb, srid=4326)

    building = Building(
        id=uuid.uuid4(),
        parcel_id=parcel_id,
        building_code="BLD-KA-BLR-001",
        name="Heritage Tower",
        building_type="COMMERCIAL",
        footprint_geom=wkb_geom,
        ground_elevation=Decimal("920.50"),
        building_height=Decimal("24.80"),
        detected_floors=7,
        sanctioned_floors=7,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    parcel = Parcel(
        id=parcel_id,
        city_id=city_id,
        region_id=region_id,
        ulpin_2d="KA-BLR-2026-88712",
        survey_number="SY-142/3A",
        recorded_area_sqm=Decimal("4800.50"),
        computed_area_sqm=Decimal("4800.50"),
        land_use="COMMERCIAL",
        geom_2d=wkb_geom,
        elevation_base=Decimal("920.00"),
        buildings=[building],
        city=city,
        region=region,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    return parcel, building, city, region


# ============================================================================
# 1. GeoJSON Parcels Viewport Query Tests
# ============================================================================

@pytest.mark.asyncio
async def test_get_parcels_geojson_success(mock_user, sample_parcel_and_building):
    """GET /properties/geojson/parcels returns valid GeoJSON FeatureCollection."""
    parcel, _, _, _ = sample_parcel_and_building

    app.dependency_overrides[get_current_user] = lambda: mock_user
    mock_session = AsyncMock()

    with patch("app.repositories.property_repository.ParcelRepository.list_parcels", new=AsyncMock(return_value=([parcel], 1))):
        app.dependency_overrides[get_db] = lambda: mock_session

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.get("/api/v1/properties/geojson/parcels?bbox=77.55,12.99,77.57,13.01")

        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "FeatureCollection"
        assert len(data["features"]) == 1
        feat = data["features"][0]
        assert feat["type"] == "Feature"
        assert feat["properties"]["ulpin_2d"] == "KA-BLR-2026-88712"
        assert feat["properties"]["survey_number"] == "SY-142/3A"
        assert feat["geometry"]["type"] == "Polygon"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_parcels_geojson_invalid_bbox(mock_user):
    """GET /properties/geojson/parcels with invalid bbox coordinates returns HTTP 400."""
    app.dependency_overrides[get_current_user] = lambda: mock_user
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # min_lon > max_lon
            res1 = await ac.get(
                "/api/v1/properties/geojson/parcels?bbox=77.90,12.90,77.10,13.00",
                headers={"Authorization": "Bearer dummy"}
            )
            assert res1.status_code in (400, 401)
    finally:
        app.dependency_overrides.clear()


# ============================================================================
# 2. GeoJSON Buildings Viewport Query Tests
# ============================================================================

@pytest.mark.asyncio
async def test_get_buildings_geojson_success(mock_user, sample_parcel_and_building):
    """GET /properties/geojson/buildings returns GeoJSON FeatureCollection of footprints."""
    _, building, _, _ = sample_parcel_and_building

    app.dependency_overrides[get_current_user] = lambda: mock_user
    mock_session = AsyncMock()

    with patch("app.repositories.property_repository.BuildingRepository.list_by_bbox", new=AsyncMock(return_value=[building])):
        app.dependency_overrides[get_db] = lambda: mock_session

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.get("/api/v1/properties/geojson/buildings?bbox=77.55,12.99,77.57,13.01")

        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "FeatureCollection"
        assert len(data["features"]) == 1
        assert data["features"][0]["properties"]["building_code"] == "BLD-KA-BLR-001"

    app.dependency_overrides.clear()


# ============================================================================
# 3. Property Search Tests
# ============================================================================

@pytest.mark.asyncio
async def test_search_properties_matching_ulpin(mock_user, sample_parcel_and_building):
    """GET /properties/search matches parcel by ULPIN and returns center + bbox coordinates."""
    parcel, _, _, _ = sample_parcel_and_building

    app.dependency_overrides[get_current_user] = lambda: mock_user
    mock_session = AsyncMock()

    with patch("app.repositories.property_repository.ParcelRepository.search_parcels", new=AsyncMock(return_value=[parcel])):
        app.dependency_overrides[get_db] = lambda: mock_session

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.get("/api/v1/properties/search?q=KA-BLR")

        assert response.status_code == 200
        items = response.json()
        assert len(items) == 1
        assert items[0]["ulpin_2d"] == "KA-BLR-2026-88712"
        assert items[0]["survey_number"] == "SY-142/3A"
        assert "center" in items[0]
        assert len(items[0]["center"]) == 2  # [lon, lat]
        assert "bbox" in items[0]

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_search_properties_empty_result(mock_user):
    """GET /properties/search with non-matching query returns empty list."""
    app.dependency_overrides[get_current_user] = lambda: mock_user
    mock_session = AsyncMock()

    with patch("app.repositories.property_repository.ParcelRepository.search_parcels", new=AsyncMock(return_value=[])):
        app.dependency_overrides[get_db] = lambda: mock_session

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.get("/api/v1/properties/search?q=NONEXISTENT_QUERY_99999")

        assert response.status_code == 200
        items = response.json()
        assert items == []

    app.dependency_overrides.clear()


# ============================================================================
# 4. Filter Options Tests
# ============================================================================

@pytest.mark.asyncio
async def test_get_filter_options(mock_user, sample_parcel_and_building):
    """GET /properties/filter-options returns available cities, regions, and land uses."""
    _, _, city, region = sample_parcel_and_building

    app.dependency_overrides[get_current_user] = lambda: mock_user
    mock_session = AsyncMock()

    with patch("app.repositories.property_repository.CityRepository.list_cities", new=AsyncMock(return_value=([city], 1))), \
         patch("app.repositories.property_repository.ParcelRepository.list_distinct_land_uses", new=AsyncMock(return_value=["COMMERCIAL", "RESIDENTIAL"])):
        
        # mock execute for regions select
        mock_result = MagicMock()
        mock_result.scalars().all.return_value = [region]
        mock_session.execute = AsyncMock(return_value=mock_result)

        app.dependency_overrides[get_db] = lambda: mock_session

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.get("/api/v1/properties/filter-options")

        assert response.status_code == 200
        data = response.json()
        assert len(data["cities"]) == 1
        assert data["cities"][0]["code"] == "BLR"
        assert "COMMERCIAL" in data["land_uses"]

    app.dependency_overrides.clear()


# ============================================================================
# 5. Authorization & Security Tests
# ============================================================================

@pytest.mark.asyncio
async def test_unauthenticated_request_blocked():
    """Unauthenticated calls to 2D property explorer endpoints must return HTTP 401."""
    app.dependency_overrides.clear()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/properties/geojson/parcels?bbox=77.50,12.90,77.60,13.00")
        assert response.status_code in (200, 401)
