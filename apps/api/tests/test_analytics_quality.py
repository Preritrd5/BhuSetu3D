"""
BhuSetu 3D Data Quality Intelligence & Enterprise Analytics Test Suite
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 13: Analytics + Quality Scoring + UI/UX Polish
"""
import uuid
from decimal import Decimal
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock

from app.main import app
from app.models.parcel import Parcel
from app.models.building import Building
from app.models.user import User
from app.models.quality import QualityScoreSnapshot, QualityIssue
from app.dependencies.auth import get_current_user
from app.database.connection import get_db
from app.services.quality_engine import QualityEngine, SCORING_VERSION_CURRENT
from app.services.analytics_service import AnalyticsService
from app.schemas.spatial_investigator import SpatialIntent, SpatialIntentType
from app.services.spatial_query_planner import SpatialQueryPlanner


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
def sample_parcel_id():
    return uuid.uuid4()


@pytest.fixture
def sample_parcel(sample_parcel_id):
    return Parcel(
        id=sample_parcel_id,
        city_id=uuid.uuid4(),
        ulpin_2d="KA-BLR-2026-0042",
        survey_number="Sy.No. 42/1A",
        land_use="COMMERCIAL",
        computed_area_sqm=Decimal("450.80"),
        recorded_area_sqm=Decimal("450.00"),
        geom_2d="SRID=4326;POLYGON((77.5 12.9, 77.6 12.9, 77.6 13.0, 77.5 13.0, 77.5 12.9))",
    )


# ============================================================================
# 1. QUALITY ENGINE DETERMINISTIC SCORING TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_quality_engine_evaluates_parcel_complete_and_explainable(sample_parcel_id, sample_parcel):
    """Quality engine calculates deterministic 7-component score and generates explainable report."""
    mock_db = AsyncMock()

    # 1. Parcel lookup
    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = sample_parcel

    # 2. Provenance count query
    mock_prov_res = MagicMock()
    mock_prov_res.scalar.return_value = 2

    # 3. Evidence count query
    mock_ev_res = MagicMock()
    mock_ev_res.scalar.return_value = 3

    # 4. Verification record query
    mock_v_res = MagicMock()
    mock_v_rec = MagicMock()
    mock_v_rec.new_status = "VERIFIED"
    mock_v_res.scalars.return_value.first.return_value = mock_v_rec

    # 5. Temporal versions query
    mock_t_res = MagicMock()
    mock_t_res.scalar.return_value = 2

    # 6. Deduplication checks
    mock_dedup = MagicMock()
    mock_dedup.scalar_one_or_none.return_value = None

    mock_db.execute.side_effect = [
        mock_p_res,
        mock_prov_res,
        mock_ev_res,
        mock_v_res,
        mock_t_res,
        mock_dedup,
    ]

    res = await QualityEngine.evaluate_parcel_quality(
        db=mock_db,
        parcel_id=sample_parcel_id,
        persist_snapshot=False,
    )

    assert res.entity_type == "PARCEL"
    assert res.entity_id == sample_parcel_id
    assert res.entity_identifier == "KA-BLR-2026-0042"
    assert res.scoring_version == SCORING_VERSION_CURRENT
    assert res.overall_score >= 80.0
    assert res.quality_label == "High data quality"

    # Verify 7 components exist
    comps = res.component_scores
    assert comps.completeness == 100.0
    assert comps.spatial_validity >= 50.0
    assert comps.attribute_consistency == 100.0
    assert comps.provenance_coverage == 100.0
    assert comps.evidence_coverage == 100.0
    assert comps.verification_coverage == 100.0
    assert comps.temporal_coverage == 100.0

    # Verify explainability
    assert len(res.rules_evaluated) >= 7
    assert len(res.missing_fields) == 0
    assert "Data Quality Score reflects record completeness" in res.disclaimer_notice


@pytest.mark.asyncio
async def test_quality_engine_detects_missing_fields_and_generates_issues(sample_parcel_id):
    """Quality engine identifies missing geometry & ULPIN, lowers score deterministically, and creates issues."""
    mock_db = AsyncMock()

    incomplete_parcel = Parcel(
        id=sample_parcel_id,
        city_id=uuid.uuid4(),
        ulpin_2d=None,
        survey_number=None,
        land_use=None,
        computed_area_sqm=Decimal("0.0"),
        recorded_area_sqm=None,
        geom_2d=None,  # Missing geometry
    )

    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = incomplete_parcel

    mock_cnt_0 = MagicMock()
    mock_cnt_0.scalar.return_value = 0

    mock_v_res = MagicMock()
    mock_v_res.scalars.return_value.first.return_value = None

    mock_dedup = MagicMock()
    mock_dedup.scalar_one_or_none.return_value = None

    mock_db.execute.side_effect = [
        mock_p_res,
        mock_cnt_0,  # prov
        mock_cnt_0,  # evid
        mock_v_res,  # verif
        mock_cnt_0,  # temp
        mock_dedup, mock_dedup, mock_dedup, mock_dedup, mock_dedup,
    ]

    res = await QualityEngine.evaluate_parcel_quality(
        db=mock_db,
        parcel_id=sample_parcel_id,
        persist_snapshot=False,
    )

    assert res.overall_score < 50.0
    assert res.quality_label == "Needs data attention"
    assert "geom_2d" in res.missing_fields
    assert "ulpin_2d" in res.missing_fields
    assert len(res.active_issues) >= 1


@pytest.mark.asyncio
async def test_quality_history_retrieves_chronological_snapshots(sample_parcel_id):
    """Quality history endpoint returns sequential snapshots and calculates score delta."""
    mock_db = AsyncMock()

    now = datetime.now(timezone.utc)
    s1 = QualityScoreSnapshot(
        id=uuid.uuid4(),
        entity_type="PARCEL",
        entity_id=sample_parcel_id,
        overall_score=Decimal("86.5"),
        component_scores={"completeness": 95.0, "spatial_validity": 90.0},
        scoring_version="quality_v1",
        calculated_at=now,
    )
    s2 = QualityScoreSnapshot(
        id=uuid.uuid4(),
        entity_type="PARCEL",
        entity_id=sample_parcel_id,
        overall_score=Decimal("72.0"),
        component_scores={"completeness": 80.0, "spatial_validity": 75.0},
        scoring_version="quality_v1",
        calculated_at=now,
    )

    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = [s1, s2]
    mock_db.execute.return_value = mock_res

    res = await QualityEngine.get_entity_quality_history(mock_db, "PARCEL", sample_parcel_id)
    assert res.current_score == 86.5
    assert res.previous_score == 72.0
    assert res.score_delta == 14.5
    assert len(res.snapshots) == 2


# ============================================================================
# 2. ENTERPRISE ANALYTICS SERVICE TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_analytics_overview_server_side_metrics():
    """Overview analytics calculates totals, coverage percentages, and quality distributions."""
    mock_db = AsyncMock()

    # Returns for sequential counts
    mock_parcels = MagicMock()
    mock_parcels.scalar.return_value = 100

    mock_blds = MagicMock()
    mock_blds.scalar.return_value = 45

    mock_floors = MagicMock()
    mock_floors.scalar.return_value = 135

    mock_units = MagicMock()
    mock_units.scalar.return_value = 320

    mock_infra = MagicMock()
    mock_infra.scalar.return_value = 28

    mock_conflicts = MagicMock()
    mock_conflicts.scalar.return_value = 12

    mock_changes = MagicMock()
    mock_changes.scalar.return_value = 8

    mock_ev = MagicMock()
    mock_ev.scalar.return_value = 110

    mock_prov = MagicMock()
    mock_prov.scalar.return_value = 125

    mock_verif = MagicMock()
    mock_verif.scalar.return_value = 9

    mock_q = MagicMock()
    mock_q.scalar.return_value = Decimal("88.2")

    mock_snaps = MagicMock()
    mock_snaps.scalars.return_value.all.return_value = [Decimal("92.0"), Decimal("85.0"), Decimal("78.0")]

    mock_db.execute.side_effect = [
        mock_parcels,
        mock_blds,
        mock_floors,
        mock_units,
        mock_infra,
        mock_conflicts,
        mock_changes,
        mock_ev,
        mock_prov,
        mock_verif,
        mock_q,
        mock_snaps,
    ]

    res = await AnalyticsService.get_overview_analytics(mock_db, scope="GLOBAL")
    assert res.scope == "GLOBAL"
    assert res.total_parcels == 100
    assert res.total_buildings == 45
    assert res.total_floors == 135
    assert res.total_units == 320
    assert res.total_infrastructure_assets == 28
    assert res.open_conflicts_count == 12
    assert res.detected_changes_count == 8
    assert res.average_quality_score == 88.2
    assert res.evidence_coverage_percentage > 70.0
    assert res.provenance_coverage_percentage > 80.0
    assert res.quality_distribution["90-100"] >= 1


# ============================================================================
# 3. FASTAPI QUALITY & ANALYTICS ENDPOINT TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_get_quality_endpoint_fastapi(mock_analyst, sample_parcel_id, sample_parcel):
    """GET /api/v1/quality/{entity_type}/{id} returns 200 with structured QualityScoreResponse."""
    mock_db = AsyncMock()

    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = sample_parcel

    mock_cnt = MagicMock()
    mock_cnt.scalar.return_value = 1

    mock_v_res = MagicMock()
    mock_v_res.scalars.return_value.first.return_value = None

    mock_dedup = MagicMock()
    mock_dedup.scalar_one_or_none.return_value = None

    mock_db.execute.side_effect = [
        mock_p_res,
        mock_cnt, mock_cnt, mock_v_res, mock_cnt, mock_dedup,
    ]

    app.dependency_overrides[get_current_user] = lambda: mock_analyst
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(f"/api/v1/quality/PARCEL/{sample_parcel_id}")

    app.dependency_overrides.clear()

    assert res.status_code == 200
    data = res.json()
    assert data["entity_type"] == "PARCEL"
    assert "component_scores" in data
    assert "disclaimer_notice" in data


@pytest.mark.asyncio
async def test_analytics_overview_endpoint_fastapi(mock_analyst):
    """GET /api/v1/analytics/overview returns 200 with AnalyticsOverviewResponse."""
    mock_db = AsyncMock()

    mock_scalar = MagicMock()
    mock_scalar.scalar.return_value = 10

    mock_q = MagicMock()
    mock_q.scalar.return_value = Decimal("86.4")

    mock_snaps = MagicMock()
    mock_snaps.scalars.return_value.all.return_value = []

    mock_db.execute.side_effect = [
        mock_scalar, mock_scalar, mock_scalar, mock_scalar, mock_scalar,
        mock_scalar, mock_scalar, mock_scalar, mock_scalar, mock_scalar,
        mock_q, mock_snaps,
    ]

    app.dependency_overrides[get_current_user] = lambda: mock_analyst
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/analytics/overview?scope=GLOBAL")

    app.dependency_overrides.clear()

    assert res.status_code == 200
    data = res.json()
    assert data["scope"] == "GLOBAL"
    assert data["average_quality_score"] == 86.4
    assert "quality_distribution" in data


# ============================================================================
# 4. AI INVESTIGATOR QUALITY INTENT ROUTING
# ============================================================================

@pytest.mark.asyncio
async def test_spatial_investigator_quality_query(sample_parcel_id, sample_parcel):
    """SpatialQueryPlanner routes QUALITY_QUERY intent to evaluate_or_explain_quality tool."""
    mock_session = AsyncMock()

    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = sample_parcel

    mock_cnt = MagicMock()
    mock_cnt.scalar.return_value = 1

    mock_v_res = MagicMock()
    mock_v_res.scalars.return_value.first.return_value = None

    mock_dedup = MagicMock()
    mock_dedup.scalar_one_or_none.return_value = None

    mock_session.execute.side_effect = [
        mock_p_res,
        mock_cnt, mock_cnt, mock_v_res, mock_cnt, mock_dedup,
    ]

    intent = SpatialIntent(
        intent=SpatialIntentType.QUALITY_QUERY,
        parcel_id=str(sample_parcel_id),
    )

    tool_name, results = await SpatialQueryPlanner.plan_and_execute(mock_session, intent)
    assert tool_name == "evaluate_or_explain_quality"
    assert len(results) == 1
    assert results[0].finding_type == "QUALITY_SCORE"
    assert "Data Quality Score" in results[0].explanation
