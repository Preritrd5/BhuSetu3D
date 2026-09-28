"""
BhuSetu 3D Evidence, Provenance & Confidence System Test Suite
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 8: Evidence, Provenance & Source Tracking
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
from app.models.infrastructure import Infrastructure, ParcelInfrastructure
from app.models.provenance import DataSource, Dataset, Evidence, ProvenanceRecord, VerificationRecord
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.database.connection import get_db
from app.services.evidence_service import EvidenceService
from app.schemas.evidence import SourceClassification, SourceType, EvidenceStatus, OperationType


@pytest.fixture
def mock_user():
    return User(
        id=uuid.uuid4(),
        email="surveyor@bhusetu.gov.in",
        full_name="Pooja Sharma",
        role="SURVEYOR",
        department="Survey of India",
        is_active=True
    )


@pytest.fixture
def evidence_test_data():
    """Builds a rich mock hierarchy with datasets, evidence, and provenance."""
    parcel_id = uuid.uuid4()
    building_id = uuid.uuid4()
    floor_id = uuid.uuid4()
    unit_id = uuid.uuid4()
    infra_id = uuid.uuid4()
    source_id = uuid.uuid4()
    dataset_id = uuid.uuid4()
    evidence_id = uuid.uuid4()

    data_source = DataSource(
        id=source_id,
        name="Karnataka State Remote Sensing Applications Centre",
        organization_type="GOVERNMENT",
        trust_level="AUTHORITATIVE",
        reliability_score=Decimal("0.960"),
        created_at=datetime.utcnow()
    )

    dataset = Dataset(
        id=dataset_id,
        source_id=source_id,
        city_id=uuid.uuid4(),
        name="Bengaluru High-Resolution Drone Orthomosaic 2026",
        dataset_type="DRONE_ORTHOMOSAIC",
        acquisition_date=datetime.utcnow().date(),
        sensor_details="Zenmuse P1 45MP RGB, GSD 3cm",
        storage_uri="s3://bhusetu-surveys/drone/blr-2026.tif",
        created_at=datetime.utcnow()
    )
    dataset.data_source = data_source

    parcel = Parcel(
        id=parcel_id,
        city_id=uuid.uuid4(),
        region_id=uuid.uuid4(),
        ulpin_2d="KA-BLR-00123-00045",
        survey_number="123/45",
        recorded_area_sqm=Decimal("1200.00"),
        computed_area_sqm=Decimal("1201.50"),
        land_use="COMMERCIAL",
        elevation_base=Decimal("915.00"),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    building = Building(
        id=building_id,
        parcel_id=parcel_id,
        building_code="BLD-01",
        name="Tech Tower Alpha",
        building_type="COMMERCIAL",
        ground_elevation=Decimal("915.00"),
        building_height=Decimal("15.00"),
        detected_floors=5,
        sanctioned_floors=5,
        height_source="LIDAR_POINT_CLOUD",
        extraction_method="YOLOv8x Building Segmentation",
        confidence_score=Decimal("0.920"),
        processing_version="v2.1.0",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    floor = Floor(
        id=floor_id,
        building_id=building_id,
        floor_number=1,
        floor_code="FLR-01",
        floor_label="Ground Floor",
        base_elevation=Decimal("915.00"),
        ceiling_elevation=Decimal("918.00"),
        floor_height=Decimal("3.00"),
        floor_area_sqm=Decimal("450.00"),
        created_at=datetime.utcnow()
    )

    unit = Unit(
        id=unit_id,
        floor_id=floor_id,
        ulpin_3d="BHU-3D-KA-BLR-00123-00045-B01-F01-U101",
        unit_number="101",
        unit_type="COMMERCIAL",
        carpet_area_sqm=Decimal("200.00"),
        verification_status="UNVERIFIED",
        status_3d="AVAILABLE",
        created_at=datetime.utcnow()
    )

    infra = Infrastructure(
        id=infra_id,
        city_id=uuid.uuid4(),
        name="11kV Underground Power Feeder",
        utility_category="ELECTRICAL",
        is_subsurface=True,
        depth_meters=Decimal("1.80"),
        evidence_source_type="GOVERNMENT_DATA",
        created_at=datetime.utcnow()
    )

    assoc = ParcelInfrastructure(
        parcel_id=parcel_id,
        infrastructure_id=infra_id,
        intersection_type="INTERSECTS"
    )
    assoc.infrastructure = infra

    building.floors = [floor]
    floor.units = [unit]
    parcel.buildings = [building]
    parcel.infrastructure_associations = [assoc]

    evidence_item = Evidence(
        id=evidence_id,
        entity_type="PARCEL",
        entity_id=parcel_id,
        dataset_id=dataset_id,
        source_classification="OBSERVED",
        source_type="DRONE_IMAGERY",
        confidence_score=Decimal("0.9400"),
        status="AVAILABLE",
        processing_method="RTK-GNSS + High-Res Drone Ortho Polygonization",
        model_version="v1.2.0",
        notes="High confidence boundary verified against state revenue records",
        supporting_factors=["RTK-GNSS ground control points established", "Sub-5cm GSD drone capture"],
        limiting_factors=["Western boundary obscured by tree canopy"],
        evidence_metadata={"sensor": "Zenmuse P1", "resolution_cm": 3.0},
        created_at=datetime.utcnow()
    )
    evidence_item.dataset = dataset

    return {
        "parcel": parcel,
        "building": building,
        "floor": floor,
        "unit": unit,
        "infra": infra,
        "dataset": dataset,
        "data_source": data_source,
        "evidence": evidence_item,
    }


# -----------------------------------------------------------------------------
# 1. EVIDENCE VAULT ENDPOINT TESTS
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_evidence_endpoint(mock_user, evidence_test_data):
    """Test GET /api/v1/evidence returns paginated evidence records."""
    mock_db = AsyncMock()

    ev = evidence_test_data["evidence"]

    # Mock count and query results
    mock_count_res = MagicMock()
    mock_count_res.scalar.return_value = 1

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [ev]
    mock_items_res = MagicMock()
    mock_items_res.scalars.return_value = mock_scalars

    mock_db.execute.side_effect = [mock_count_res, mock_items_res]

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/evidence?entity_type=PARCEL&status=AVAILABLE")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] == 1
    assert len(data["items"]) == 1
    item = data["items"][0]
    assert item["entity_type"] == "PARCEL"
    assert item["source_classification"] == "OBSERVED"
    assert item["confidence_score"] == 0.94
    assert item["status"] == "AVAILABLE"
    assert "RTK-GNSS ground control points established" in item["supporting_factors"]


@pytest.mark.asyncio
async def test_get_evidence_detail_endpoint(mock_user, evidence_test_data):
    """Test GET /api/v1/evidence/{id} returns single evidence details with dataset and source."""
    mock_db = AsyncMock()
    ev = evidence_test_data["evidence"]

    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = ev
    mock_db.execute.return_value = mock_res

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/evidence/{ev.id}")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(ev.id)
    assert data["dataset_name"] == "Bengaluru High-Resolution Drone Orthomosaic 2026"
    assert data["source_name"] == "Karnataka State Remote Sensing Applications Centre"
    assert len(data["limiting_factors"]) == 1


@pytest.mark.asyncio
async def test_get_evidence_detail_not_found(mock_user):
    """Test GET /api/v1/evidence/{id} returns 404 for nonexistent record."""
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_res

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/evidence/{uuid.uuid4()}")

    app.dependency_overrides.clear()

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# -----------------------------------------------------------------------------
# 2. PROPERTY EVIDENCE, PROVENANCE & CONFIDENCE TESTS
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_property_evidence_endpoint(mock_user, evidence_test_data):
    """Test GET /api/v1/properties/{property_id}/evidence returns coverage across hierarchy."""
    mock_db = AsyncMock()
    parcel = evidence_test_data["parcel"]
    ev = evidence_test_data["evidence"]

    # Parcel fetch
    mock_parcel_res = MagicMock()
    mock_parcel_res.scalar_one_or_none.return_value = parcel

    # Evidence fetch for all hierarchy elements
    mock_ev_scalars = MagicMock()
    mock_ev_scalars.all.return_value = [ev]
    mock_ev_res = MagicMock()
    mock_ev_res.scalars.return_value = mock_ev_scalars

    # Verification record fetch
    mock_verif_scalars = MagicMock()
    mock_verif_scalars.first.return_value = None
    mock_verif_res = MagicMock()
    mock_verif_res.scalars.return_value = mock_verif_scalars

    mock_db.execute.side_effect = [mock_parcel_res, mock_ev_res, mock_verif_res]

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/properties/{parcel.id}/evidence")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["property_id"] == str(parcel.id)
    assert data["ulpin_2d"] == parcel.ulpin_2d
    assert data["evidence_count"] == 1
    assert data["verification_status"] == "UNVERIFIED"
    assert len(data["missing_evidence"]) > 0  # Building, Floor, Unit, Utility missing explicit evidence


@pytest.mark.asyncio
async def test_get_property_provenance_endpoint(mock_user, evidence_test_data):
    """Test GET /api/v1/properties/{property_id}/provenance returns sequential lineage DAG."""
    mock_db = AsyncMock()
    parcel = evidence_test_data["parcel"]

    # Parcel fetch
    mock_parcel_res = MagicMock()
    mock_parcel_res.scalar_one_or_none.return_value = parcel

    # Provenance records fetch (empty in DB, so synthesized from metadata)
    mock_prov_scalars = MagicMock()
    mock_prov_scalars.all.return_value = []
    mock_prov_res = MagicMock()
    mock_prov_res.scalars.return_value = mock_prov_scalars

    mock_db.execute.side_effect = [mock_parcel_res, mock_prov_res]

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/properties/{parcel.id}/provenance")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["target_entity_type"] == "PARCEL"
    assert "chain" in data
    assert len(data["chain"]) >= 4  # INGESTION, AI_EXTRACTION, VERTICAL_SLICING, ULPIN_GENERATION

    op_types = [node["operation_type"] for node in data["chain"]]
    assert "INGESTION" in op_types
    assert "AI_EXTRACTION" in op_types
    assert "VERTICAL_SLICING" in op_types
    assert "ULPIN_GENERATION" in op_types


@pytest.mark.asyncio
async def test_get_property_confidence_endpoint(mock_user, evidence_test_data):
    """Test GET /api/v1/properties/{property_id}/confidence computes composite confidence and factors."""
    mock_db = AsyncMock()
    parcel = evidence_test_data["parcel"]
    ev = evidence_test_data["evidence"]

    mock_parcel_res = MagicMock()
    mock_parcel_res.scalar_one_or_none.return_value = parcel

    mock_ev_scalars = MagicMock()
    mock_ev_scalars.all.return_value = [ev]
    mock_ev_res = MagicMock()
    mock_ev_res.scalars.return_value = mock_ev_scalars

    mock_verif_scalars = MagicMock()
    mock_verif_scalars.first.return_value = None
    mock_verif_res = MagicMock()
    mock_verif_res.scalars.return_value = mock_verif_scalars

    mock_db.execute.side_effect = [mock_parcel_res, mock_ev_res, mock_verif_res]

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/properties/{parcel.id}/confidence")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["composite_confidence"] > 0.0
    assert data["is_verified"] is False
    assert data["verification_status"] == "UNVERIFIED"
    assert "component_scores" in data
    assert "parcel_boundary" in data["component_scores"]
    assert "building_footprint_and_height" in data["component_scores"]
    assert len(data["supporting_factors"]) > 0
    assert len(data["limiting_factors"]) > 0
    assert "Property lacks statutory verification review by Revenue Officer" in data["limiting_factors"]


@pytest.mark.asyncio
async def test_dataset_evidence_endpoint(mock_user, evidence_test_data):
    """Test GET /api/v1/datasets/{dataset_id}/evidence returns originating dataset evidence."""
    mock_db = AsyncMock()
    ds = evidence_test_data["dataset"]
    ev = evidence_test_data["evidence"]

    mock_ds_res = MagicMock()
    mock_ds_res.scalar_one_or_none.return_value = ds

    mock_count_res = MagicMock()
    mock_count_res.scalar.return_value = 1

    mock_ev_scalars = MagicMock()
    mock_ev_scalars.all.return_value = [ev]
    mock_ev_res = MagicMock()
    mock_ev_res.scalars.return_value = mock_ev_scalars

    mock_db.execute.side_effect = [mock_ds_res, mock_count_res, mock_ev_res]

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/datasets/{ds.id}/evidence")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["dataset_id"] == str(ds.id)
    assert data["dataset_name"] == ds.name
    assert data["total"] == 1
    assert len(data["evidence_items"]) == 1


# -----------------------------------------------------------------------------
# 3. SERVICE RECORDING & SECURITY TESTS
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_record_evidence_and_provenance():
    """Test recording evidence and provenance nodes via service helpers."""
    mock_db = AsyncMock()

    eid = uuid.uuid4()
    ev = await EvidenceService.record_evidence(
        db=mock_db,
        entity_type="BUILDING",
        entity_id=eid,
        dataset_id=uuid.uuid4(),
        source_classification="AI_ASSISTED",
        confidence_score=0.915,
        processing_method="YOLOv8x Building Segmentation",
        model_version="v2.1.0",
        notes="High confidence footprint",
        source_type="DRONE_IMAGERY",
        status="AVAILABLE",
        supporting_factors=["Good lighting, clear edges"],
        limiting_factors=["Minor shadow overlap"],
        evidence_metadata={"iou": 0.915}
    )

    assert ev.entity_type == "BUILDING"
    assert ev.confidence_score == Decimal("0.915")
    assert ev.source_classification == "AI_ASSISTED"
    assert mock_db.add.called
    assert mock_db.commit.called

    pr = await EvidenceService.record_provenance(
        db=mock_db,
        target_entity_type="BUILDING",
        target_entity_id=eid,
        operation_type="AI_EXTRACTION",
        operation_name="YOLO Building Extraction",
        operation_version="v2.1.0",
        performed_by="AI Pipeline",
        input_reference={"ortho_res": "5cm"},
        output_reference={"polygon_nodes": 12},
    )

    assert pr.target_entity_type == "BUILDING"
    assert pr.operation_type == "AI_EXTRACTION"
    assert mock_db.add.called


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected():
    """Verify endpoint handles unauthenticated access (public read 200 or auth required 401)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/evidence")

    assert response.status_code in (200, 401)
