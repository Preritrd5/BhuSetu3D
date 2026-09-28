"""
BhuSetu 3D Human Verification Workflow & Audit Trail Test Suite
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 11: Human Verification Workflow + Audit Trail
"""
import uuid
from decimal import Decimal
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock

from app.main import app
from app.models.provenance import Conflict, VerificationRecord, Evidence, AuditLog
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.database.connection import get_db
from app.services.audit_service import AuditService, GENESIS_HASH, canonical_json, compute_audit_hash
from app.services.verification_service import VerificationService, VALID_TRANSITIONS, DECISION_TO_STATUS
from app.schemas.verification import (
    VerificationStatus,
    VerificationDecision,
    VerificationDecisionRequest,
    AssignReviewerRequest,
    ReopenReviewRequest,
)


@pytest.fixture
def mock_officer():
    return User(
        id=uuid.uuid4(),
        email="officer.verma@bhusetu.gov.in",
        full_name="Rajesh Verma",
        role="OFFICER",
        department="Urban Land Revenue Directorate",
        is_active=True,
    )


@pytest.fixture
def mock_reviewer():
    return User(
        id=uuid.uuid4(),
        email="surveyor.sharma@bhusetu.gov.in",
        full_name="Pooja Sharma",
        role="SURVEYOR",
        department="Directorate of Survey & Cadastre",
        is_active=True,
    )


@pytest.fixture
def sample_conflict():
    return Conflict(
        id=uuid.uuid4(),
        conflict_type="OUTSIDE_PARCEL_BOUNDARY",
        severity="HIGH",
        verification_status="UNREVIEWED",
        rule_id="RULE-BLDG-001",
        rule_name="Building Outside Parcel Boundary",
        entity_type="BUILDING",
        entity_id=uuid.uuid4(),
        parcel_id=uuid.uuid4(),
        building_id=uuid.uuid4(),
        measured_value=Decimal("14.500"),
        threshold_value=Decimal("0.500"),
        measured_unit="m²",
        explanation="Building footprint encroaches 14.50 m² beyond legal cadastral boundary.",
        confidence_score=Decimal("0.940"),
        status="OPEN",
        evidence_reference={"source": "DRONE_LIDAR_2026"},
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


# ============================================================================
# 1. AUDIT SERVICE CRYPTOGRAPHIC HASH CHAIN TESTS
# ============================================================================

def test_canonical_json_determinism():
    """Canonical JSON output must be identical regardless of key insertion order."""
    data1 = {"b": 2, "a": 1, "nested": {"z": 100, "y": 50}}
    data2 = {"nested": {"y": 50, "z": 100}, "a": 1, "b": 2}
    assert canonical_json(data1) == canonical_json(data2)
    assert canonical_json(None) == ""


def test_audit_hash_chain_calculation():
    """Verify SHA-256 hash chaining formula with genesis anchor."""
    entity_id = uuid.uuid4()
    now = datetime(2026, 9, 25, 12, 0, 0, tzinfo=timezone.utc)
    prev_state = {"status": "UNREVIEWED"}
    new_state = {"status": "IN_REVIEW"}

    h1 = compute_audit_hash(
        prev_hash=GENESIS_HASH,
        user_id=None,
        action="TEST_ACTION_1",
        entity_type="CONFLICT",
        entity_id=entity_id,
        previous_state=prev_state,
        new_state=new_state,
        created_at=now,
    )
    assert len(h1) == 64  # Valid SHA-256 hex string

    # Second block in chain links to h1
    h2 = compute_audit_hash(
        prev_hash=h1,
        user_id=None,
        action="TEST_ACTION_2",
        entity_type="CONFLICT",
        entity_id=entity_id,
        previous_state=new_state,
        new_state={"status": "VERIFIED"},
        created_at=now,
    )
    assert len(h2) == 64
    assert h2 != h1


@pytest.mark.asyncio
async def test_audit_chain_tamper_detection():
    """Tampering with an intermediate log payload must fail verification."""
    mock_db = AsyncMock()
    now = datetime(2026, 9, 25, 12, 0, 0, tzinfo=timezone.utc)
    e_id = uuid.uuid4()

    h1 = compute_audit_hash(GENESIS_HASH, None, "ACT1", "CONFLICT", e_id, None, {"v": 1}, now)
    h2 = compute_audit_hash(h1, None, "ACT2", "CONFLICT", e_id, {"v": 1}, {"v": 2}, now)

    log1 = AuditLog(
        id=1, user_id=None, action="ACT1", entity_type="CONFLICT", entity_id=e_id,
        previous_state=None, new_state={"v": 1}, prev_hash=GENESIS_HASH, current_hash=h1, created_at=now,
    )
    # Tampered log: payload changed after hashing
    log2 = AuditLog(
        id=2, user_id=None, action="ACT2", entity_type="CONFLICT", entity_id=e_id,
        previous_state={"v": 1}, new_state={"v": 999}, # Tampered value!
        prev_hash=h1, current_hash=h2, created_at=now,
    )

    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = [log1, log2]
    mock_db.execute.return_value = mock_res

    res = await AuditService.verify_chain(db=mock_db)
    assert res["is_valid"] is False
    assert res["broken_log_id"] == 2
    assert "Cryptographic tamper detected" in res["message"]


# ============================================================================
# 2. VERIFICATION STATE MACHINE TESTS
# ============================================================================

def test_state_machine_valid_transitions():
    """Verify expected valid transitions pass statutory check."""
    # UNREVIEWED -> IN_REVIEW
    VerificationService.validate_transition("UNREVIEWED", "IN_REVIEW")

    # IN_REVIEW -> VERIFIED, REJECTED, NEEDS_MORE_EVIDENCE, ESCALATED
    VerificationService.validate_transition("IN_REVIEW", "VERIFIED")
    VerificationService.validate_transition("IN_REVIEW", "REJECTED")
    VerificationService.validate_transition("IN_REVIEW", "NEEDS_MORE_EVIDENCE")
    VerificationService.validate_transition("IN_REVIEW", "ESCALATED")

    # Reopening from VERIFIED / REJECTED -> IN_REVIEW
    VerificationService.validate_transition("VERIFIED", "IN_REVIEW")
    VerificationService.validate_transition("REJECTED", "IN_REVIEW")


def test_state_machine_invalid_transitions():
    """Verify skipping review phase or prohibited transitions raise HTTP 400."""
    from fastapi import HTTPException

    # Direct UNREVIEWED -> VERIFIED is illegal (requires review first!)
    with pytest.raises(HTTPException) as exc1:
        VerificationService.validate_transition("UNREVIEWED", "VERIFIED")
    assert exc1.value.status_code == 400

    # Direct VERIFIED -> REJECTED without reopening is illegal
    with pytest.raises(HTTPException) as exc2:
        VerificationService.validate_transition("VERIFIED", "REJECTED")
    assert exc2.value.status_code == 400


# ============================================================================
# 3. VERIFICATION QUEUE & DECISION API ENDPOINTS
# ============================================================================

@pytest.mark.asyncio
async def test_get_verification_queue_endpoint(mock_officer, sample_conflict):
    """GET /api/v1/verification/queue returns paginated list and summary metrics."""
    mock_db = AsyncMock()

    # 1. Total count
    mock_total_res = MagicMock()
    mock_total_res.scalar_one.return_value = 1

    # 2. Conflict items
    mock_items_res = MagicMock()
    mock_items_res.scalars.return_value.all.return_value = [sample_conflict]

    # 3. Status summary counts
    mock_stat_res = MagicMock()
    mock_stat_res.all.return_value = [("UNREVIEWED", 1)]

    # 4. Severity summary counts
    mock_sev_res = MagicMock()
    mock_sev_res.all.return_value = [("HIGH", 1)]

    mock_db.execute.side_effect = [
        mock_total_res,
        mock_items_res,
        mock_stat_res,
        mock_sev_res,
    ]

    app.dependency_overrides[get_current_user] = lambda: mock_officer
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/verification/queue?page=1&page_size=10")

    app.dependency_overrides.clear()

    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["id"] == str(sample_conflict.id)
    assert data["items"][0]["verification_status"] == "UNREVIEWED"
    assert data["summary"]["unreviewed"] == 1


@pytest.mark.asyncio
async def test_get_verification_detail_endpoint(mock_officer, sample_conflict):
    """GET /api/v1/verification/{id} returns finding dossier, history, and evidence."""
    mock_db = AsyncMock()

    # 1. Conflict query
    mock_c_res = MagicMock()
    mock_c_res.scalar_one_or_none.return_value = sample_conflict

    # 2. History query
    mock_v_res = MagicMock()
    mock_v_res.scalars.return_value.all.return_value = []

    # 3. Evidence query
    mock_e_res = MagicMock()
    mock_e_res.scalars.return_value.all.return_value = []

    mock_db.execute.side_effect = [
        mock_c_res,
        mock_v_res,
        mock_e_res,
    ]

    app.dependency_overrides[get_current_user] = lambda: mock_officer
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(f"/api/v1/verification/{sample_conflict.id}")

    app.dependency_overrides.clear()

    assert res.status_code == 200
    data = res.json()
    assert data["item"]["id"] == str(sample_conflict.id)
    assert "history" in data
    assert "associated_evidence" in data


@pytest.mark.asyncio
async def test_assign_reviewer_endpoint(mock_officer, mock_reviewer, sample_conflict):
    """POST /api/v1/verification/{id}/assign assigns reviewer and transitions UNREVIEWED -> IN_REVIEW."""
    mock_db = AsyncMock()

    # 1. User check
    mock_u_res = MagicMock()
    mock_u_res.scalar_one_or_none.return_value = mock_reviewer

    # 2. Conflict fetch
    mock_c_res = MagicMock()
    mock_c_res.scalar_one_or_none.return_value = sample_conflict

    # 3. Latest audit hash check
    mock_h_res = MagicMock()
    mock_h_res.scalar_one_or_none.return_value = GENESIS_HASH

    # 4. Detail reload conflict
    mock_c_reload = MagicMock()
    sample_conflict.assigned_reviewer = mock_reviewer
    mock_c_reload.scalar_one_or_none.return_value = sample_conflict

    # 5. Detail history
    mock_hist_res = MagicMock()
    mock_hist_res.scalars.return_value.all.return_value = []

    # 6. Detail evidence
    mock_ev_res = MagicMock()
    mock_ev_res.scalars.return_value.all.return_value = []

    mock_db.execute.side_effect = [
        mock_u_res,
        mock_c_res,
        mock_h_res,
        mock_c_reload,
        mock_hist_res,
        mock_ev_res,
    ]

    app.dependency_overrides[get_current_user] = lambda: mock_officer
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            f"/api/v1/verification/{sample_conflict.id}/assign",
            json={
                "reviewer_id": str(mock_reviewer.id),
                "notes": "Assigned for on-site GPS verification.",
            }
        )

    app.dependency_overrides.clear()

    assert res.status_code == 200
    data = res.json()
    assert sample_conflict.verification_status == "IN_REVIEW"
    assert sample_conflict.assigned_reviewer_id == mock_reviewer.id
    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_submit_decision_confirmed_endpoint(mock_officer, sample_conflict):
    """POST /api/v1/verification/{id}/decision CONFIRMED transitions IN_REVIEW -> VERIFIED."""
    sample_conflict.verification_status = "IN_REVIEW"
    evidence_id = uuid.uuid4()
    mock_db = AsyncMock()

    # 1. Conflict fetch
    mock_c_res = MagicMock()
    mock_c_res.scalar_one_or_none.return_value = sample_conflict

    # 2. Latest audit hash check
    mock_h_res = MagicMock()
    mock_h_res.scalar_one_or_none.return_value = GENESIS_HASH

    # 3. Reload conflict
    mock_c_reload = MagicMock()
    mock_c_reload.scalar_one_or_none.return_value = sample_conflict

    # 4. History
    mock_hist_res = MagicMock()
    mock_hist_res.scalars.return_value.all.return_value = []

    # 5. Evidence
    mock_ev_res = MagicMock()
    mock_ev_res.scalars.return_value.all.return_value = []

    mock_db.execute.side_effect = [
        mock_c_res,
        mock_h_res,
        mock_c_reload,
        mock_hist_res,
        mock_ev_res,
    ]

    app.dependency_overrides[get_current_user] = lambda: mock_officer
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            f"/api/v1/verification/{sample_conflict.id}/decision",
            json={
                "decision": "CONFIRMED",
                "justification": "Field survey verified drone measurement. Encroachment verified against cadastral master.",
                "evidence_references": [str(evidence_id)],
                "notes": "Actionable violation notice recommended.",
                "expected_previous_status": "IN_REVIEW",
            }
        )

    app.dependency_overrides.clear()

    assert res.status_code == 200
    assert sample_conflict.verification_status == "VERIFIED"
    assert sample_conflict.status == "CONFIRMED"
    assert sample_conflict.reviewed_by == mock_officer.id
    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_submit_decision_concurrency_conflict(mock_officer, sample_conflict):
    """Optimistic locking returns HTTP 409 Conflict if finding was modified concurrently."""
    sample_conflict.verification_status = "VERIFIED" # Already verified by another officer
    mock_db = AsyncMock()

    mock_c_res = MagicMock()
    mock_c_res.scalar_one_or_none.return_value = sample_conflict
    mock_db.execute.return_value = mock_c_res

    app.dependency_overrides[get_current_user] = lambda: mock_officer
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            f"/api/v1/verification/{sample_conflict.id}/decision",
            json={
                "decision": "NOT_CONFIRMED",
                "justification": "Boundary tolerance within permissible margin.",
                "expected_previous_status": "IN_REVIEW", # Mismatch!
            }
        )

    app.dependency_overrides.clear()

    assert res.status_code == 409
    assert "Conflict state has changed" in res.json()["detail"]


@pytest.mark.asyncio
async def test_reopen_review_endpoint(mock_officer, sample_conflict):
    """POST /api/v1/verification/{id}/reopen reopens a completed review back to IN_REVIEW."""
    sample_conflict.verification_status = "VERIFIED"
    mock_db = AsyncMock()

    # 1. Conflict fetch
    mock_c_res = MagicMock()
    mock_c_res.scalar_one_or_none.return_value = sample_conflict

    # 2. Latest audit hash check
    mock_h_res = MagicMock()
    mock_h_res.scalar_one_or_none.return_value = GENESIS_HASH

    # 3. Reload conflict
    mock_c_reload = MagicMock()
    mock_c_reload.scalar_one_or_none.return_value = sample_conflict

    # 4. History
    mock_hist_res = MagicMock()
    mock_hist_res.scalars.return_value.all.return_value = []

    # 5. Evidence
    mock_ev_res = MagicMock()
    mock_ev_res.scalars.return_value.all.return_value = []

    mock_db.execute.side_effect = [
        mock_c_res,
        mock_h_res,
        mock_c_reload,
        mock_hist_res,
        mock_ev_res,
    ]

    app.dependency_overrides[get_current_user] = lambda: mock_officer
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            f"/api/v1/verification/{sample_conflict.id}/reopen",
            json={
                "justification": "Fresh high-resolution LiDAR survey submitted by owner challenging original finding.",
                "notes": "Reopened for re-evaluation against new survey.",
            }
        )

    app.dependency_overrides.clear()

    assert res.status_code == 200
    assert sample_conflict.verification_status == "IN_REVIEW"
    assert sample_conflict.status == "OPEN"
    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_verify_chain_endpoint(mock_officer):
    """POST /api/v1/verification/audit/verify-chain verifies cryptographic audit chain integrity."""
    mock_db = AsyncMock()

    mock_res = MagicMock()
    mock_res.scalars.return_value.all.return_value = []
    mock_db.execute.return_value = mock_res

    app.dependency_overrides[get_current_user] = lambda: mock_officer
    app.dependency_overrides[get_db] = lambda: mock_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/v1/verification/audit/verify-chain")

    app.dependency_overrides.clear()

    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True
    assert data["event_count"] == 0
    assert data["genesis_hash"] == GENESIS_HASH
