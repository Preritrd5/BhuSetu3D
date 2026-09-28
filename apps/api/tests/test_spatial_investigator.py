"""
BhuSetu 3D AI Spatial Investigator Test Suite
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 10: Natural-Language Spatial Query + AI Spatial Investigator
"""
import uuid
from decimal import Decimal
from datetime import datetime
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock
from shapely.geometry import Polygon
from geoalchemy2.shape import from_shape

from app.main import app
from app.models.parcel import Parcel
from app.models.building import Building
from app.models.provenance import Conflict, Evidence
from app.models.user import User
from app.models.investigation import SpatialInvestigation
from app.dependencies.auth import get_current_user
from app.database.connection import get_db
from app.schemas.spatial_investigator import (
    SpatialIntent,
    SpatialIntentType,
    EntityType,
    InfrastructureTypeEnum,
)
from app.services.spatial_intent_validator import SpatialIntentValidator
from app.services.gemini_spatial_client import GeminiSpatialClient
from app.services.spatial_query_planner import SpatialQueryPlanner, SpatialToolRegistry
from app.services.spatial_grounder import SpatialResultGrounder


@pytest.fixture
def mock_user():
    return User(
        id=uuid.uuid4(),
        email="surveyor@bhusetu.gov.in",
        full_name="Radha Sharma",
        role="SURVEYOR",
        department="Survey of India Directorate",
        is_active=True
    )


# ============================================================================
# 1. INTENT VALIDATOR & INJECTION DEFENSE TESTS
# ============================================================================

def test_validator_rejects_destructive_mutation_queries():
    """Confirms that mutation and administration keywords are strictly blocked."""
    forbidden_queries = [
        "Delete all properties near the highway",
        "DROP TABLE parcels CASCADE;",
        "UPDATE conflicts SET status = 'RESOLVED'",
        "Insert into buildings values ('fake')",
        "Truncate table evidence;",
        "Grant all privileges to public;",
        "Shutdown the server",
    ]
    for q in forbidden_queries:
        err = SpatialIntentValidator.validate_user_query(q)
        assert err is not None
        assert "strictly read-only" in err


def test_validator_accepts_read_only_spatial_queries():
    """Confirms that valid natural language spatial questions pass pre-flight checks."""
    valid_queries = [
        "Show buildings that extend beyond their parcels.",
        "Which properties are within 10 meters of a road?",
        "Why was this property flagged?",
        "What evidence supports this building?",
        "Show parcels overlapping each other.",
    ]
    for q in valid_queries:
        err = SpatialIntentValidator.validate_user_query(q)
        assert err is None


def test_validator_enforces_distance_boundaries():
    """Distance queries must not exceed maximum 2000m limit."""
    # Absurd distance
    absurd_intent = SpatialIntent(
        intent=SpatialIntentType.INFRASTRUCTURE_PROXIMITY_QUERY,
        distance_meters=50000.0
    )
    is_valid, sanitized, msg = SpatialIntentValidator.validate_and_sanitize(absurd_intent)
    assert not is_valid
    assert "exceeds the maximum allowed radius" in msg

    # Valid distance
    valid_intent = SpatialIntent(
        intent=SpatialIntentType.INFRASTRUCTURE_PROXIMITY_QUERY,
        distance_meters=15.0
    )
    is_valid, sanitized, msg = SpatialIntentValidator.validate_and_sanitize(valid_intent)
    assert is_valid
    assert sanitized.distance_meters == 15.0


def test_validator_clamps_result_limits():
    """Result limits are safely clamped to avoid server exhaustion."""
    oversized_intent = SpatialIntent(
        intent=SpatialIntentType.BOUNDARY_DISCREPANCY_QUERY,
        limit=500
    )
    is_valid, sanitized, _ = SpatialIntentValidator.validate_and_sanitize(oversized_intent)
    assert sanitized.limit == 50  # Clamped to MAX_RESULT_LIMIT


# ============================================================================
# 2. DETERMINISTIC INTENT EXTRACTION TESTS
# ============================================================================

def test_intent_parser_building_outside_parcel():
    """Extracts BOUNDARY_DISCREPANCY_QUERY for footprint encroachment questions."""
    intent = GeminiSpatialClient.parse_intent_deterministic(
        "Show buildings that extend outside their parcels."
    )
    assert intent.intent == SpatialIntentType.BOUNDARY_DISCREPANCY_QUERY
    assert intent.entity_type == EntityType.BUILDING
    assert intent.conflict_type == "BUILDING_OUTSIDE_PARCEL"


def test_intent_parser_road_proximity_query():
    """Extracts distance and infrastructure type from proximity question."""
    intent = GeminiSpatialClient.parse_intent_deterministic(
        "Which properties are within 10 meters of a road?"
    )
    assert intent.intent == SpatialIntentType.INFRASTRUCTURE_PROXIMITY_QUERY
    assert intent.infrastructure_type == InfrastructureTypeEnum.ROAD
    assert intent.distance_meters == 10.0


def test_intent_parser_parcel_overlap_query():
    """Extracts OVERLAP_QUERY for parcel collision questions."""
    intent = GeminiSpatialClient.parse_intent_deterministic(
        "Show parcels overlapping each other."
    )
    assert intent.intent == SpatialIntentType.OVERLAP_QUERY
    assert intent.entity_type == EntityType.PARCEL


def test_intent_parser_why_flagged_with_context():
    """Maintains active context binding for 'Why' questions."""
    prop_id = str(uuid.uuid4())
    intent = GeminiSpatialClient.parse_intent_deterministic(
        "Why was this property flagged?",
        context_entity_type="PARCEL",
        context_entity_id=prop_id
    )
    assert intent.intent == SpatialIntentType.CONFLICT_EXPLANATION
    assert intent.property_id == prop_id


def test_intent_parser_evidence_query():
    """Extracts EVIDENCE_QUERY for sensor dataset questions."""
    intent = GeminiSpatialClient.parse_intent_deterministic(
        "What evidence supports this building?"
    )
    assert intent.intent == SpatialIntentType.EVIDENCE_QUERY
    assert intent.entity_type == EntityType.BUILDING


def test_intent_parser_ambiguous_near_triggers_clarification():
    """Ambiguous questions without infrastructure type trigger clarification."""
    intent = GeminiSpatialClient.parse_intent_deterministic(
        "Show properties near"
    )
    assert intent.intent == SpatialIntentType.CLARIFICATION_NEEDED
    assert intent.clarification_needed is True
    assert "Which infrastructure corridor" in intent.clarification_question


# ============================================================================
# 3. SPATIAL GROUNDING & MAP DIRECTIVE TESTS
# ============================================================================

def test_spatial_result_grounder_builds_valid_directive():
    """Grounder constructs clean MapActionDirective from real items."""
    from app.schemas.spatial_investigator import InvestigationResultItem

    items = [
        InvestigationResultItem(
            entity_id="bld-101",
            entity_type="BUILDING",
            entity_code="BLD-KA-001",
            title="Building 101",
            finding_type="BUILDING_OUTSIDE_PARCEL",
            measured_value=12.5,
            confidence_score=0.91,
            geom_geojson={"type": "Point", "coordinates": [77.59, 12.97]}
        )
    ]
    intent = SpatialIntent(intent=SpatialIntentType.BOUNDARY_DISCREPANCY_QUERY)
    directive = SpatialResultGrounder.ground_and_build_map_directive(intent, items)

    assert directive is not None
    assert directive.target_ids == ["bld-101"]
    assert directive.primary_id == "bld-101"
    assert len(directive.highlight_features) == 1


# ============================================================================
# 4. API ENDPOINT INTEGRATION TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_api_get_suggested_questions():
    """API endpoint returns pre-curated question catalog."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/spatial-investigator/suggested-questions")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 5
        assert any("Show buildings that extend" in q["question"] for q in data)


@pytest.mark.asyncio
async def test_api_execute_investigation_query(mock_user):
    """API executes natural language query and returns grounded explanation."""
    mock_session = AsyncMock()

    # Mock scalar conflicts
    conflict_mock = MagicMock()
    conflict_mock.id = uuid.uuid4()
    conflict_mock.parcel_id = uuid.uuid4()
    conflict_mock.building_id = uuid.uuid4()
    conflict_mock.rule_id = "RULE-BLDG-001"
    conflict_mock.rule_name = "Building Outside Parcel"
    conflict_mock.conflict_type = "BUILDING_OUTSIDE_PARCEL"
    conflict_mock.severity = "HIGH"
    conflict_mock.status = "OPEN"
    conflict_mock.measured_value = Decimal("14.52")
    conflict_mock.threshold_value = Decimal("0.10")
    conflict_mock.measured_unit = "m²"
    conflict_mock.deviation_value = Decimal("14.42")
    conflict_mock.confidence_score = Decimal("0.910")
    conflict_mock.explanation = "Footprint extends 14.52 m² outside parcel boundary."
    conflict_mock.conflict_geom = None
    conflict_mock.parcel = None
    conflict_mock.building = None

    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = [conflict_mock]
    mock_res.scalar.return_value = 1  # evidence count
    mock_session.execute.return_value = mock_res
    mock_session.commit.return_value = None
    mock_session.add = MagicMock()

    async def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            payload = {
                "question": "Show buildings that extend outside their parcels."
            }
            res = await client.post("/api/v1/spatial-investigator/query", json=payload)
            assert res.status_code == 200
            data = res.json()
            assert data["status"] in ("SUCCESS", "NO_RESULTS")
            assert "interpreted_intent" in data
            assert data["interpreted_intent"]["intent"] == "BOUNDARY_DISCREPANCY_QUERY"
            assert "explanation" in data
            assert "Mandatory Governance Notice" in data["explanation"]["governance_notice"]
            assert data["results_count"] == 1
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_api_mutation_rejection():
    """Confirms API rejects mutation attempts like DROP or DELETE."""
    mock_session = AsyncMock()

    async def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            payload = {
                "question": "DROP TABLE parcels;"
            }
            res = await client.post("/api/v1/spatial-investigator/query", json=payload)
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "UNSUPPORTED"
            assert data["results_count"] == 0
            assert "strictly read-only" in data["explanation"]["summary"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_api_investigation_history():
    """API endpoint returns recent investigation records."""
    mock_session = AsyncMock()

    rec_mock = MagicMock()
    rec_mock.id = uuid.uuid4()
    rec_mock.request_id = "inv_test123"
    rec_mock.question = "Show parcels overlapping each other."
    rec_mock.intent = "OVERLAP_QUERY"
    rec_mock.tool_executed = "find_parcel_overlaps"
    rec_mock.model_used = "gemini-2.0-flash"
    rec_mock.status = "SUCCESS"
    rec_mock.result_count = 2
    rec_mock.duration_ms = 45
    rec_mock.created_at = datetime.utcnow()

    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = [rec_mock]
    mock_session.execute.return_value = mock_res

    async def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/v1/spatial-investigator/history")
            assert res.status_code == 200
            data = res.json()
            assert len(data) == 1
            assert data[0]["request_id"] == "inv_test123"
    finally:
        app.dependency_overrides.clear()
