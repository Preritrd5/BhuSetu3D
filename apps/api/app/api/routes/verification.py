"""
BhuSetu 3D Human Verification & Audit Trail API Endpoints
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 11: Human Verification Workflow + Audit Trail
"""
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.dependencies.auth import get_current_user, require_any_role
from app.models.user import User
from app.schemas.verification import (
    VerificationQueueResponse,
    VerificationQueueSummary,
    VerificationDetailResponse,
    AssignReviewerRequest,
    StartReviewRequest,
    VerificationDecisionRequest,
    ReopenReviewRequest,
    AuditLogItem,
    AuditChainVerificationResponse,
    ReviewerInfo,
)
from app.services.verification_service import VerificationService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/verification", tags=["Human Verification Workflow & Audit Trail"])


@router.get(
    "/queue",
    response_model=VerificationQueueResponse,
    summary="Get Verification Queue",
    description="Retrieve paginated findings and properties requiring human statutory verification with multidimensional filtering.",
)
async def get_verification_queue(
    status: Optional[List[str]] = Query(None, description="Filter by verification statuses: UNREVIEWED, IN_REVIEW, VERIFIED, REJECTED, NEEDS_MORE_EVIDENCE, ESCALATED"),
    severity: Optional[str] = Query(None, description="Filter by severity: CRITICAL, HIGH, MEDIUM, LOW"),
    conflict_type: Optional[str] = Query(None, description="Filter by spatial conflict type"),
    assigned_reviewer_id: Optional[UUID] = Query(None, description="Filter by assigned reviewer UUID"),
    unassigned_only: bool = Query(False, description="Filter to only unassigned findings"),
    search: Optional[str] = Query(None, description="Keyword search across rule names and explanations"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await VerificationService.get_review_queue(
        db=db,
        status_filter=status,
        severity_filter=severity,
        conflict_type=conflict_type,
        assigned_reviewer_id=assigned_reviewer_id,
        unassigned_only=unassigned_only,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/queue/summary",
    response_model=VerificationQueueSummary,
    summary="Get Verification Queue Summary Metrics",
    description="Aggregated count metrics across all verification states and severities.",
)
async def get_queue_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await VerificationService.get_queue_summary(db=db)


@router.get(
    "/reviewers",
    response_model=List[ReviewerInfo],
    summary="List Eligible Reviewers",
    description="Lists authorized officers and surveyors eligible for review assignment.",
)
async def list_eligible_reviewers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(User)
        .where(User.is_active == True)
        .order_by(User.full_name)
    )
    res = await db.execute(stmt)
    users = res.scalars().all()
    return [
        ReviewerInfo(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            role=u.role,
            department=u.department,
        )
        for u in users
    ]


@router.get(
    "/{conflict_id}",
    response_model=VerificationDetailResponse,
    summary="Get Verification Detail",
    description="Full verification dossier for a finding: rule measurement, Phase 8 evidence items, and decision history.",
)
async def get_verification_detail(
    conflict_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await VerificationService.get_verification_detail(
        db=db,
        conflict_id=conflict_id,
    )


@router.post(
    "/{conflict_id}/assign",
    response_model=VerificationDetailResponse,
    summary="Assign Reviewer",
    description="Assigns an authorized officer to review a finding. Emits audit log and verification record.",
)
async def assign_reviewer(
    conflict_id: UUID,
    req: AssignReviewerRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role(["OFFICER", "ADMIN", "SURVEYOR"])),
):
    client_ip = request.client.host if request.client else None
    return await VerificationService.assign_reviewer(
        db=db,
        conflict_id=conflict_id,
        req=req,
        officer_id=current_user.id,
        ip_address=client_ip,
    )


@router.post(
    "/{conflict_id}/start",
    response_model=VerificationDetailResponse,
    summary="Start Review",
    description="Marks finding as actively under human review (IN_REVIEW).",
)
async def start_review(
    conflict_id: UUID,
    req: StartReviewRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role(["OFFICER", "ADMIN", "SURVEYOR"])),
):
    client_ip = request.client.host if request.client else None
    return await VerificationService.start_review(
        db=db,
        conflict_id=conflict_id,
        officer_id=current_user.id,
        notes=req.notes,
        ip_address=client_ip,
    )


@router.post(
    "/{conflict_id}/decision",
    response_model=VerificationDetailResponse,
    summary="Submit Verification Decision",
    description="Submits authoritative human verification decision (CONFIRMED, NOT_CONFIRMED, INSUFFICIENT_EVIDENCE, ESCALATE).",
)
async def submit_decision(
    conflict_id: UUID,
    req: VerificationDecisionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role(["OFFICER", "ADMIN", "SURVEYOR"])),
):
    client_ip = request.client.host if request.client else None
    return await VerificationService.submit_decision(
        db=db,
        conflict_id=conflict_id,
        req=req,
        officer_id=current_user.id,
        ip_address=client_ip,
    )


@router.post(
    "/{conflict_id}/reopen",
    response_model=VerificationDetailResponse,
    summary="Reopen Completed Verification",
    description="Reopens a VERIFIED or REJECTED finding back to IN_REVIEW with mandatory justification.",
)
async def reopen_review(
    conflict_id: UUID,
    req: ReopenReviewRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role(["OFFICER", "ADMIN"])),
):
    client_ip = request.client.host if request.client else None
    return await VerificationService.reopen_review(
        db=db,
        conflict_id=conflict_id,
        req=req,
        officer_id=current_user.id,
        ip_address=client_ip,
    )


@router.get(
    "/{conflict_id}/audit",
    response_model=List[AuditLogItem],
    summary="Get Finding Audit Trail",
    description="Retrieves the ordered sequence of cryptographic audit events for a finding.",
)
async def get_finding_audit_trail(
    conflict_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await VerificationService.get_entity_audit_trail(
        db=db,
        entity_id=conflict_id,
        entity_type="CONFLICT",
    )


@router.post(
    "/audit/verify-chain",
    response_model=AuditChainVerificationResponse,
    summary="Verify Audit Chain Cryptographic Integrity",
    description="Independently verifies the complete SHA-256 hash chain across all audit log events to detect tampering or corruption.",
)
async def verify_audit_chain(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    res = await AuditService.verify_chain(db=db)
    return AuditChainVerificationResponse(**res)
