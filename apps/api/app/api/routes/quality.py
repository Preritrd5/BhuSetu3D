"""
BhuSetu 3D Data Quality Intelligence API Routes
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 13: Analytics + Quality Scoring + UI/UX Polish
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.dependencies.auth import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.quality import QualityIssue, QualityScoreSnapshot
from app.schemas.quality import (
    QualityScoreResponse,
    QualityRecalculateRequest,
    QualityHistoryResponse,
    QualityIssueItem,
    QualityIssueUpdate,
    QualityIssueStatus,
    QualityCategory,
    QualitySeverity,
)
from app.services.quality_engine import QualityEngine

router = APIRouter(prefix="/quality", tags=["Data Quality Intelligence"])


@router.get(
    "/{entity_type}/{entity_id}",
    response_model=QualityScoreResponse,
    summary="Get Explainable Entity Quality Score",
    description="Evaluates or retrieves deterministic quality score across 7 components for a parcel or building.",
)
async def get_entity_quality(
    entity_type: str,
    entity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    type_upper = entity_type.upper()
    if type_upper == "PARCEL":
        return await QualityEngine.evaluate_parcel_quality(db, entity_id, persist_snapshot=False)
    elif type_upper == "BUILDING":
        return await QualityEngine.evaluate_building_quality(db, entity_id, persist_snapshot=False)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported entity type '{entity_type}'. Must be 'PARCEL' or 'BUILDING'.",
        )


@router.post(
    "/recalculate",
    response_model=QualityScoreResponse,
    summary="Recalculate and Persist Quality Score Snapshot",
    description="Forces server-side recomputation of all 7 components and saves a historical snapshot.",
)
async def recalculate_quality(
    payload: QualityRecalculateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    type_upper = payload.entity_type.upper()
    if type_upper == "PARCEL":
        return await QualityEngine.evaluate_parcel_quality(
            db, payload.entity_id, persist_snapshot=payload.persist_snapshot, user_id=current_user.id
        )
    elif type_upper == "BUILDING":
        return await QualityEngine.evaluate_building_quality(
            db, payload.entity_id, persist_snapshot=payload.persist_snapshot, user_id=current_user.id
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported entity type '{payload.entity_type}'.",
        )


@router.get(
    "/{entity_type}/{entity_id}/history",
    response_model=QualityHistoryResponse,
    summary="Get Quality Score History & Deltas",
    description="Returns chronological quality snapshots showing score trajectory over time.",
)
async def get_quality_history(
    entity_type: str,
    entity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    return await QualityEngine.get_entity_quality_history(db, entity_type, entity_id)


@router.get(
    "/issues",
    response_model=List[QualityIssueItem],
    summary="List Actionable Data Quality Issues",
    description="Filterable feed of data quality issues requiring cadastral, evidence, or spatial attention.",
)
async def list_quality_issues(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[UUID] = Query(None),
    category: Optional[QualityCategory] = Query(None),
    severity: Optional[QualitySeverity] = Query(None),
    status: Optional[QualityIssueStatus] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    stmt = select(QualityIssue).order_by(desc(QualityIssue.detected_at))
    filters = []
    if entity_type:
        filters.append(QualityIssue.entity_type == entity_type.upper())
    if entity_id:
        filters.append(QualityIssue.entity_id == entity_id)
    if category:
        filters.append(QualityIssue.category == category.value)
    if severity:
        filters.append(QualityIssue.severity == severity.value)
    if status:
        filters.append(QualityIssue.status == status.value)

    if filters:
        stmt = stmt.where(and_(*filters))

    stmt = stmt.limit(limit).offset(offset)
    res = await db.execute(stmt)
    issues = res.scalars().all()
    return [QualityIssueItem.model_validate(i) for i in issues]


@router.patch(
    "/issues/{issue_id}",
    response_model=QualityIssueItem,
    summary="Update Quality Issue Status",
    description="Update issue status (e.g. ACKNOWLEDGED, RESOLVED, WONT_FIX).",
)
async def update_quality_issue(
    issue_id: UUID,
    payload: QualityIssueUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(QualityIssue).where(QualityIssue.id == issue_id)
    res = await db.execute(stmt)
    issue = res.scalar_one_or_none()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quality issue with ID '{issue_id}' not found.",
        )

    issue.status = payload.status.value
    if payload.status == QualityIssueStatus.RESOLVED:
        issue.resolved_at = datetime.now(timezone.utc)
        issue.resolved_by = current_user.id

    if payload.resolution_notes:
        details = dict(issue.discrepancy_details or {})
        details["resolution_notes"] = payload.resolution_notes
        issue.discrepancy_details = details

    await db.commit()
    await db.refresh(issue)
    return QualityIssueItem.model_validate(issue)
