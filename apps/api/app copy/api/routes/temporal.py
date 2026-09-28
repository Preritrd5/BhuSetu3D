"""
BhuSetu 3D 4D Temporal Property History & Infrastructure API Endpoints
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 12: 4D Property History + Infrastructure Intelligence
"""
from typing import Optional, List
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.dependencies.auth import get_current_user, require_any_role
from app.models.user import User
from app.schemas.temporal import (
    PropertyHistoryTimelineResponse,
    PropertyStateVersionItem,
    ChangeEventItem,
    TemporalCompareRequest,
    TemporalCompareResponse,
    TemporalAnalyzeRequest,
    PropertyInfrastructureResponse,
)
from app.services.temporal_service import TemporalService
from app.services.infrastructure_service import InfrastructureService

router = APIRouter(prefix="/temporal", tags=["4D Temporal Property History & Infrastructure"])
property_temporal_router = APIRouter(prefix="/properties", tags=["Property Temporal Intelligence"])
change_events_router = APIRouter(prefix="/change-events", tags=["Temporal Change Events"])
infrastructure_router = APIRouter(prefix="/infrastructure", tags=["Infrastructure Intelligence"])


# -----------------------------------------------------------------------------
# 1. PROPERTY HISTORY TIMELINE & STATE VERSIONS
# -----------------------------------------------------------------------------

@property_temporal_router.get(
    "/{property_id}/history",
    response_model=PropertyHistoryTimelineResponse,
    summary="Get Property History Timeline",
    description="Retrieves the discrete observation history, state versions, and change events for a property.",
)
async def get_property_history(
    property_id: UUID,
    entity_type: str = Query("PARCEL", description="Entity type: PARCEL, BUILDING, or INFRASTRUCTURE"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TemporalService.get_property_history(
        db=db,
        entity_type=entity_type,
        entity_id=property_id,
    )


@property_temporal_router.get(
    "/{property_id}/history/{version_id}",
    response_model=PropertyStateVersionItem,
    summary="Get Property State Version Detail",
    description="Retrieves a specific historical state version with GeoJSON geometry and attributes snapshot.",
)
async def get_property_version_detail(
    property_id: UUID,
    version_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TemporalService.get_version_detail(db=db, version_id=version_id)


@property_temporal_router.get(
    "/{property_id}/changes",
    response_model=List[ChangeEventItem],
    summary="Get Property Change Events",
    description="Retrieves detected and verified change events for a specific property entity.",
)
async def get_property_changes(
    property_id: UUID,
    entity_type: str = Query("BUILDING", description="Entity type: PARCEL or BUILDING"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, _ = await TemporalService.get_change_events(
        db=db,
        entity_type=entity_type,
        entity_id=property_id,
    )
    return items


# -----------------------------------------------------------------------------
# 2. TEMPORAL COMPARISON & CHANGE DETECTION
# -----------------------------------------------------------------------------

@router.post(
    "/compare",
    response_model=TemporalCompareResponse,
    summary="Compare Temporal States",
    description="Executes conformal PostGIS comparison between two discrete observation states of an entity.",
)
async def compare_temporal_states(
    req: TemporalCompareRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TemporalService.compare_temporal_states(
        db=db,
        entity_type=req.entity_type,
        entity_id=req.entity_id,
        from_version_id=req.from_version_id,
        to_version_id=req.to_version_id,
        from_date=req.from_date,
        to_date=req.to_date,
    )


@router.post(
    "/analyze",
    response_model=List[ChangeEventItem],
    summary="Detect and Record Temporal Changes",
    description="Evaluates temporal observation pairs for an entity and generates deduplicated ChangeEvents with audit records.",
)
async def analyze_temporal_changes(
    req: TemporalAnalyzeRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role(["ANALYST", "OFFICER", "ADMIN", "SURVEYOR"])),
):
    client_ip = request.client.host if request.client else None
    return await TemporalService.detect_and_record_changes(
        db=db,
        entity_type=req.entity_type,
        entity_id=req.entity_id,
        tolerance_pct=req.tolerance_percentage,
        min_area_diff=req.minimum_area_diff_sqm,
        persist_events=req.persist_events,
        officer_id=current_user.id,
        ip_address=client_ip,
    )


# -----------------------------------------------------------------------------
# 3. CHANGE EVENTS REPOSITORY
# -----------------------------------------------------------------------------

@change_events_router.get(
    "",
    response_model=List[ChangeEventItem],
    summary="List Change Events",
    description="Retrieves paginated change events across all properties with multi-dimensional filtering.",
)
async def list_change_events(
    entity_type: Optional[str] = Query(None, description="PARCEL, BUILDING, INFRASTRUCTURE"),
    change_type: Optional[str] = Query(None, description="BUILDING_EXPANDED, FLOOR_COUNT_CHANGED, etc."),
    verification_status: Optional[str] = Query(None, description="UNREVIEWED, VERIFIED, REJECTED, NEEDS_MORE_EVIDENCE"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, _ = await TemporalService.get_change_events(
        db=db,
        entity_type=entity_type,
        change_type=change_type,
        verification_status=verification_status,
        page=page,
        page_size=page_size,
    )
    return items


@change_events_router.get(
    "/{event_id}",
    response_model=ChangeEventItem,
    summary="Get Change Event Detail",
    description="Retrieves a single change event with its PostGIS diff geometry and evidence references.",
)
async def get_change_event_detail(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TemporalService.get_change_event_detail(db=db, event_id=event_id)


# -----------------------------------------------------------------------------
# 4. INFRASTRUCTURE INTELLIGENCE & PROXIMITY
# -----------------------------------------------------------------------------

@property_temporal_router.get(
    "/{property_id}/infrastructure",
    response_model=PropertyInfrastructureResponse,
    summary="Get Nearby Infrastructure for Property",
    description="Calculates conformal metric distances to roads, drainage, water, and powerlines with temporal consistency validation.",
)
async def get_property_nearby_infrastructure(
    property_id: UUID,
    property_type: str = Query("PARCEL", description="PARCEL or BUILDING"),
    max_distance_meters: float = Query(100.0, ge=1.0, le=1000.0),
    observation_date: Optional[date] = Query(None, description="Observation epoch (e.g. 2024-06-01)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await InfrastructureService.get_nearby_infrastructure(
        db=db,
        property_id=property_id,
        property_type=property_type,
        max_distance_meters=max_distance_meters,
        observation_date=observation_date,
    )


@infrastructure_router.get(
    "/{infrastructure_id}/nearby-properties",
    summary="Get Properties Along Infrastructure Corridor",
    description="Reverse proximity query identifying parcels and buildings situated along an infrastructure asset.",
)
async def get_infrastructure_nearby_properties(
    infrastructure_id: UUID,
    max_distance_meters: float = Query(50.0, ge=1.0, le=500.0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await InfrastructureService.get_infrastructure_nearby_properties(
        db=db,
        infrastructure_id=infrastructure_id,
        max_distance_meters=max_distance_meters,
    )
