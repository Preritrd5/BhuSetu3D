"""
BhuSetu 3D Enterprise Analytics API Routes
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 13: Analytics + Quality Scoring + UI/UX Polish
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    AnalyticsPropertiesResponse,
    AnalyticsQualityResponse,
    AnalyticsConflictsResponse,
    AnalyticsVerificationResponse,
    AnalyticsChangesResponse,
    AnalyticsInfrastructureResponse,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Enterprise Analytics"])


@router.get(
    "/overview",
    response_model=AnalyticsOverviewResponse,
    summary="Get High-Level Spatial & Quality Telemetry",
    description="Returns city/region summary metrics, coverage percentages, and quality distributions.",
)
async def get_analytics_overview(
    scope: str = Query("GLOBAL", description="GLOBAL, CITY, REGION"),
    city_id: Optional[UUID] = Query(None),
    region_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AnalyticsService.get_overview_analytics(db, scope, city_id, region_id)


@router.get(
    "/properties",
    response_model=AnalyticsPropertiesResponse,
    summary="Get Property Distribution & Density Telemetry",
    description="Returns land use breakdowns, vertical hierarchy counts, and density averages.",
)
async def get_analytics_properties(
    scope: str = Query("GLOBAL"),
    city_id: Optional[UUID] = Query(None),
    region_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AnalyticsService.get_properties_analytics(db, scope, city_id, region_id)


@router.get(
    "/quality",
    response_model=AnalyticsQualityResponse,
    summary="Get Data Quality Breakdown & Top Issues",
    description="Aggregates component scores, missing fields, and active quality issue categories.",
)
async def get_analytics_quality(
    scope: str = Query("GLOBAL"),
    city_id: Optional[UUID] = Query(None),
    region_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AnalyticsService.get_quality_analytics(db, scope, city_id, region_id)


@router.get(
    "/conflicts",
    response_model=AnalyticsConflictsResponse,
    summary="Get Spatial Conflict Analytics",
    description="Aggregates conflict distributions by rule, severity, and resolution status.",
)
async def get_analytics_conflicts(
    scope: str = Query("GLOBAL"),
    city_id: Optional[UUID] = Query(None),
    region_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AnalyticsService.get_conflicts_analytics(db, scope, city_id, region_id)


@router.get(
    "/verification",
    response_model=AnalyticsVerificationResponse,
    summary="Get Statutory Verification Workflow Telemetry",
    description="Returns verification turnaround metrics, decision outcomes, and open queue status.",
)
async def get_analytics_verification(
    scope: str = Query("GLOBAL"),
    city_id: Optional[UUID] = Query(None),
    region_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AnalyticsService.get_verification_analytics(db, scope, city_id, region_id)


@router.get(
    "/changes",
    response_model=AnalyticsChangesResponse,
    summary="Get Multi-Epoch Change Event Telemetry",
    description="Aggregates detected 4D physical transitions by type and verification status.",
)
async def get_analytics_changes(
    scope: str = Query("GLOBAL"),
    city_id: Optional[UUID] = Query(None),
    region_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AnalyticsService.get_changes_analytics(db, scope, city_id, region_id)


@router.get(
    "/infrastructure",
    response_model=AnalyticsInfrastructureResponse,
    summary="Get Municipal Utility Proximity Telemetry",
    description="Returns infrastructure assets count by category, subsurface depth metrics, and connectivity.",
)
async def get_analytics_infrastructure(
    scope: str = Query("GLOBAL"),
    city_id: Optional[UUID] = Query(None),
    region_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AnalyticsService.get_infrastructure_analytics(db, scope, city_id, region_id)
