"""
BhuSetu 3D Spatial Intelligence & Conflict Detection API Routes
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 9: Spatial Intelligence & Conflict Detection
"""
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.dependencies.auth import get_current_user, get_optional_current_user
from app.models.user import User
from app.schemas.conflict import (
    ConflictItem,
    ConflictListResponse,
    NearbyInfrastructureResponse,
    PropertySpatialAnalysisResponse,
    SpatialRelationshipItem,
    ConflictStatusUpdateRequest,
    SpatialRuleItem,
)
from app.services.spatial_service import SpatialService
from app.services.rule_engine import CANONICAL_RULES

# Main Conflicts Vault router
router = APIRouter(prefix="/conflicts", tags=["Spatial Conflicts & Findings"])

# Property-scoped Spatial Analysis router
property_spatial_router = APIRouter(prefix="/properties", tags=["Property Spatial Analysis"])

# Spatial Engine & Rules router
spatial_rules_router = APIRouter(prefix="/spatial", tags=["Spatial Rules & Engine"])


# -----------------------------------------------------------------------------
# 1. CONFLICTS FINDINGS VAULT ENDPOINTS
# -----------------------------------------------------------------------------

@router.get(
    "",
    response_model=ConflictListResponse,
    summary="List Spatial Discrepancies & Conflicts",
    description="Query paginated spatial findings with multi-dimensional filtering across types, severities, and status.",
)
async def list_conflicts(
    conflict_type: Optional[str] = Query(None, description="Conflict type (e.g., BUILDING_OUTSIDE_PARCEL, BUILDING_BOUNDARY_PROXIMITY)"),
    severity: Optional[str] = Query(None, description="Severity: HIGH, MEDIUM, LOW, INFO"),
    status: Optional[str] = Query(None, description="Status: OPEN, REVIEW_REQUIRED, RESOLVED, DISMISSED"),
    parcel_id: Optional[uuid.UUID] = Query(None, description="Filter by parcel UUID"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (PARCEL, BUILDING)"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum confidence threshold"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    items, total, summary = await SpatialService.get_conflicts(
        db=db,
        conflict_type=conflict_type,
        severity=severity,
        status=status,
        parcel_id=parcel_id,
        entity_type=entity_type,
        min_confidence=min_confidence,
        page=page,
        limit=limit,
    )
    return ConflictListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        summary=summary,
    )


@router.get(
    "/{conflict_id}",
    response_model=ConflictItem,
    summary="Get Spatial Conflict Detail",
    description="Retrieve full discrepancy details, measured values, applicable rule, conflict geometry, and Phase 8 evidence.",
)
async def get_conflict_detail(
    conflict_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    conflict = await SpatialService.get_conflict_by_id(db=db, conflict_id=conflict_id)
    if not conflict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Spatial conflict with ID '{conflict_id}' not found.",
        )
    return conflict


@router.post(
    "/{conflict_id}/status",
    response_model=ConflictItem,
    summary="Update Conflict Finding Status",
    description="Transitions lifecycle status of a conflict finding (e.g. REVIEW_REQUIRED, RESOLVED, DISMISSED).",
)
async def update_conflict_status_endpoint(
    conflict_id: uuid.UUID,
    payload: ConflictStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = await SpatialService.update_conflict_status(
        db=db,
        conflict_id=conflict_id,
        new_status=payload.status,
        comment=payload.comment,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Spatial conflict with ID '{conflict_id}' not found.",
        )
    return updated


# -----------------------------------------------------------------------------
# 2. PROPERTY SPATIAL ANALYSIS & RELATIONSHIPS ENDPOINTS
# -----------------------------------------------------------------------------

@property_spatial_router.get(
    "/{property_id}/conflicts",
    response_model=List[ConflictItem],
    summary="Get Conflicts for Property",
    description="Retrieve all active spatial conflict findings associated with a parcel or its child buildings.",
)
async def get_property_conflicts_endpoint(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    return await SpatialService.get_property_conflicts(db=db, property_id=property_id)


@property_spatial_router.get(
    "/{property_id}/relationships",
    response_model=List[SpatialRelationshipItem],
    summary="Get Spatial Relationships",
    description="Analyzes topological and metric relationships: CONTAINS, TOUCHES (adjacent parcels), OVERLAPS, and NEAR.",
)
async def get_property_relationships_endpoint(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    return await SpatialService.get_property_spatial_relationships(db=db, property_id=property_id)


@property_spatial_router.get(
    "/{property_id}/nearby-infrastructure",
    response_model=NearbyInfrastructureResponse,
    summary="Get Nearby Infrastructure Assets",
    description="Calculates metric distance to utility corridors (water, power, drainage, gas) within configurable radius.",
)
async def get_nearby_infrastructure_endpoint(
    property_id: uuid.UUID,
    radius: float = Query(50.0, ge=1.0, le=500.0, description="Search radius in meters"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    return await SpatialService.get_nearby_infrastructure(db=db, property_id=property_id, radius_meters=radius)


@property_spatial_router.post(
    "/{property_id}/analyze-spatial",
    response_model=PropertySpatialAnalysisResponse,
    summary="Execute Real Spatial Intelligence Analysis",
    description="Runs deterministic PostGIS spatial rule evaluation on parcel, buildings, and infrastructure. Persists durable findings.",
)
async def analyze_property_spatial_endpoint(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    analysis = await SpatialService.analyze_property_spatial(db=db, property_id=property_id)
    if analysis.analysis_status == "UNAVAILABLE":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property '{property_id}' not found or lacks required spatial geometry.",
        )
    return analysis


# -----------------------------------------------------------------------------
# 3. SPATIAL RULES & ENGINE ENDPOINTS
# -----------------------------------------------------------------------------

@spatial_rules_router.get(
    "/rules",
    response_model=List[SpatialRuleItem],
    summary="List Canonical Spatial Rules",
    description="Returns all active spatial rules, thresholds, target entities, and operations.",
)
async def list_spatial_rules(
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    rules = []
    for r in CANONICAL_RULES.values():
        rules.append(
            SpatialRuleItem(
                id=r.id,
                name=r.name,
                description=r.description,
                target_entity_type=r.target_entity_type,
                related_entity_type=r.related_entity_type,
                spatial_operation=r.spatial_operation,
                threshold_value=r.threshold_value,
                threshold_unit=r.threshold_unit,
                severity=r.severity,
                is_enabled=True,
                metadata_json={"version": r.analysis_version},
            )
        )
    return rules


@spatial_rules_router.get(
    "/properties/{property_id}/intelligence",
    summary="Get Spatial Intelligence by Property ID or Code",
    description="Unified endpoint retrieving PostGIS spatial intelligence for any building or parcel.",
)
async def get_property_intelligence_unified(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    from app.services.spatial_intelligence_service import SpatialIntelligenceService
    b_data = await SpatialIntelligenceService.get_building_spatial_intelligence(db, property_id)
    if b_data:
        return b_data
    p_data = await SpatialIntelligenceService.get_parcel_spatial_intelligence(db, property_id)
    if p_data:
        return p_data
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Property '{property_id}' not found for spatial intelligence."
    )
