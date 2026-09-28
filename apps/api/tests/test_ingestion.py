"""
BhuSetu 3D Data Ingestion & GIS Processing Pipeline Tests
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 4: Data Ingestion + GIS Processing Pipeline
"""
import io
import json
import uuid
from datetime import datetime
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch, MagicMock
import shapely.geometry

from app.main import app
from app.models.user import User
from app.models.ingestion import IngestionJob
from app.database.connection import get_db
from app.dependencies.auth import get_current_user
from app.ingestion.validators.file_validator import FileValidator
from app.ingestion.validators.crs_validator import CrsValidator
from app.ingestion.validators.geometry_validator import GeometryValidator
from app.schemas.ingestion import DatasetType, IngestionJobStatus


@pytest.fixture
def mock_surveyor_user():
    return User(
        id=uuid.uuid4(),
        auth_user_id=uuid.uuid4(),
        email="surveyor.cadastral@bhusetu3d.gov.in",
        full_name="Rajesh Sharma",
        department="Survey & Settlement",
        role="SURVEYOR",
        is_active=True,
    )


# -------------------------------------------------------------
# 1. Unit Tests: GIS Validators
# -------------------------------------------------------------

def test_file_validator_allowed_formats():
    """Verify supported spatial formats and rejection of hazardous extensions."""
    assert FileValidator.detect_format("test.geojson") == "GEOJSON"
    assert FileValidator.detect_format("cadastre.shp") == "SHAPEFILE"
    assert FileValidator.detect_format("zones.gpkg") == "GEOPACKAGE"
    assert FileValidator.detect_format("survey_points.csv") == "CSV"
    assert FileValidator.detect_format("elevation.tif") == "GEOTIFF"
    assert FileValidator.detect_format("archive.zip") == "ZIP_ARCHIVE"

    with pytest.raises(Exception):
        FileValidator.detect_format("payload.exe")

    with pytest.raises(Exception):
        FileValidator.detect_format("script.sh")


def test_crs_validator_detection():
    """Test CRS validation using CrsValidator."""
    parsed_4326 = CrsValidator.parse_crs("EPSG:4326")
    assert parsed_4326 is not None
    assert CrsValidator.is_canonical_wgs84(parsed_4326) is True

    parsed_3857 = CrsValidator.parse_crs("EPSG:3857")
    assert parsed_3857 is not None
    assert CrsValidator.is_canonical_wgs84(parsed_3857) is False


def test_geometry_validator_valid_and_repair():
    """Verify topological checking and transparent repair of invalid geometries."""
    valid_poly = shapely.geometry.Polygon([
        (77.560, 13.000),
        (77.562, 13.000),
        (77.562, 13.002),
        (77.560, 13.002),
        (77.560, 13.000)
    ])
    result, status_code, reason = GeometryValidator.validate_and_repair(valid_poly, "POLYGON")
    assert status_code == "VALID"
    assert reason is None
    assert result.is_valid

    # Self-intersecting bowtie polygon (invalid)
    bowtie = shapely.geometry.Polygon([
        (0, 0), (2, 2), (2, 0), (0, 2), (0, 0)
    ])
    assert not bowtie.is_valid
    fixed_geom, fix_status, fix_reason = GeometryValidator.validate_and_repair(bowtie, "POLYGON")
    assert fix_status == "REPAIRED"
    assert fixed_geom.is_valid


# -------------------------------------------------------------
# 2. API Endpoints: File Upload & Inspection
# -------------------------------------------------------------

@pytest.mark.asyncio
async def test_upload_file_endpoint_valid_geojson(mock_surveyor_user):
    """Test uploading a valid GeoJSON file and receiving inspection metadata."""
    geojson_payload = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [77.560, 13.000],
                            [77.562, 13.000],
                            [77.562, 13.002],
                            [77.560, 13.002],
                            [77.560, 13.000]
                        ]
                    ]
                },
                "properties": {
                    "ulpin_2d": "KA-BLR-001-P001",
                    "survey_number": "101/A",
                    "land_use": "RESIDENTIAL"
                }
            }
        ]
    }
    raw_bytes = json.dumps(geojson_payload).encode("utf-8")

    app.dependency_overrides[get_current_user] = lambda: mock_surveyor_user
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute = AsyncMock(return_value=mock_result)
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            files = {"file": ("cadastre_sample.geojson", raw_bytes, "application/geo+json")}
            response = await client.post(
                "/api/v1/ingestion/upload",
                files=files,
                headers={"Authorization": "Bearer fake_token"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["file_name"] == "cadastre_sample.geojson"
            assert data["inspection"]["detected_format"] == "GEOJSON"
            assert data["inspection"]["feature_count"] == 1
            assert data["inspection"]["detected_crs"] == "EPSG:4326"
            assert "file_hash" in data
            assert "file_id" in data
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_upload_file_endpoint_empty_file_rejected(mock_surveyor_user):
    """Verify that uploading an empty 0-byte file returns HTTP 400."""
    app.dependency_overrides[get_current_user] = lambda: mock_surveyor_user
    mock_db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            files = {"file": ("empty.geojson", b"", "application/geo+json")}
            response = await client.post(
                "/api/v1/ingestion/upload",
                files=files,
                headers={"Authorization": "Bearer fake_token"}
            )
            assert response.status_code == 400
            assert "empty" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_upload_file_endpoint_unauthenticated_blocked():
    """Verify unauthenticated requests are rejected with HTTP 401."""
    app.dependency_overrides.clear()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("test.geojson", b"{}", "application/geo+json")}
        response = await client.post(
            "/api/v1/ingestion/upload",
            files=files
        )
        assert response.status_code == 401


# -------------------------------------------------------------
# 3. API Endpoints: Data Sources & Datasets Governance
# -------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_and_list_data_sources(mock_surveyor_user):
    """Verify creating and listing data source registry entries."""
    source_id = uuid.uuid4()
    mock_source = MagicMock()
    mock_source.id = source_id
    mock_source.name = "Karnataka Cadastral Department"
    mock_source.organization_type = "GOVERNMENT"
    mock_source.trust_level = "AUTHORITATIVE"
    mock_source.contact_email = "survey@karnataka.gov.in"
    mock_source.created_at = datetime.utcnow()

    app.dependency_overrides[get_current_user] = lambda: mock_surveyor_user
    mock_db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: mock_db

    with patch("app.ingestion.services.dataset_service.DatasetService.create_data_source", return_value=mock_source), \
         patch("app.ingestion.services.dataset_service.DatasetService.list_data_sources", return_value=[mock_source]):

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                # 1. Create Data Source
                create_res = await client.post(
                    "/api/v1/ingestion/data-sources",
                    json={
                        "name": "Karnataka Cadastral Department",
                        "organization_type": "GOVERNMENT",
                        "trust_level": "AUTHORITATIVE",
                        "contact_email": "survey@karnataka.gov.in",
                    },
                    headers={"Authorization": "Bearer fake_token"}
                )
                assert create_res.status_code == 201
                assert create_res.json()["name"] == "Karnataka Cadastral Department"

                # 2. List Data Sources
                list_res = await client.get(
                    "/api/v1/ingestion/data-sources",
                    headers={"Authorization": "Bearer fake_token"}
                )
                assert list_res.status_code == 200
                assert len(list_res.json()) >= 1
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_ingestion_job_by_id(mock_surveyor_user):
    """Verify querying an ingestion job by ID."""
    job_id = uuid.uuid4()
    mock_job = IngestionJob(
        id=job_id,
        file_name="malleshwaram_cadastre.geojson",
        file_size_bytes=1024,
        file_hash="a" * 64,
        dataset_type="PARCEL",
        status="COMPLETED",
        stage="COMPLETED",
        progress_percent=100,
        records_total=42,
        records_accepted=42,
        records_rejected=0,
        records_warnings=0,
        target_crs="EPSG:4326",
        processing_version="v1.0",
        created_at=datetime.utcnow(),
    )

    app.dependency_overrides[get_current_user] = lambda: mock_surveyor_user
    mock_db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: mock_db

    with patch("app.ingestion.services.job_service.JobService.get_job", return_value=mock_job):
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                res = await client.get(
                    f"/api/v1/ingestion/jobs/{job_id}",
                    headers={"Authorization": "Bearer fake_token"}
                )
                assert res.status_code == 200
                data = res.json()
                assert data["id"] == str(job_id)
                assert data["status"] == "COMPLETED"
                assert data["progress_percent"] == 100
                assert data["records_total"] == 42
        finally:
            app.dependency_overrides.clear()
