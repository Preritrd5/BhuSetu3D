"""
BhuSetu 3D AI Building Extraction & 3D Building API Endpoints
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 6: AI Building Extraction + 3D Generation
"""
import uuid
import asyncio
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from geoalchemy2.shape import to_shape

from app.database.connection import get_db
from app.dependencies.auth import get_current_user, require_any_role
from app.models.user import User
from app.models.building import Building
from app.models.parcel import Parcel
from app.schemas.building_ai import (
    ExtractionJobCreate,
    ExtractionJobResponse,
    Generate3DRequest,
    Building3DResponse,
)
from app.schemas.property import GeoJSONFeatureCollection, GeoJSONFeature
from app.ai.services.extraction_job_service import AIExtractionJobService
from app.ai.pipeline.extrusion_service import Building3DExtrusionService
from app.core.spatial import parse_bbox, geometry_to_geojson
from app.core.logging import logger

router = APIRouter(prefix="/buildings", tags=["AI Building Extraction & 3D Models"])

ALLOWED_EXTRACTION_ROLES = ["ADMIN", "SURVEYOR", "PLANNER"]


@router.post(
    "/extraction-jobs",
    response_model=ExtractionJobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger AI building footprint extraction job",
    description="Initializes a durable AI building segmentation and 3D generation run."
)
async def create_extraction_job(
    job_in: ExtractionJobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role(ALLOWED_EXTRACTION_ROLES)),
) -> ExtractionJobResponse:
    job = await AIExtractionJobService.create_job(db=db, job_in=job_in, user_id=current_user.id)
    # Execute extraction job (in async task or synchronously for testing)
    await AIExtractionJobService.execute_job(db=db, job_id=job.id, job_in=job_in)
    refreshed_job = await AIExtractionJobService.get_job(db, job.id)
    return ExtractionJobResponse.model_validate(refreshed_job)


@router.get(
    "/extraction-jobs",
    response_model=List[ExtractionJobResponse],
    summary="List recent AI building extraction jobs"
)
async def list_extraction_jobs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ExtractionJobResponse]:
    jobs = await AIExtractionJobService.list_jobs(db=db, limit=limit, offset=offset)
    return [ExtractionJobResponse.model_validate(j) for j in jobs]


@router.get(
    "/extraction-jobs/{job_id}",
    response_model=ExtractionJobResponse,
    summary="Get status and telemetry of an extraction job"
)
async def get_extraction_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExtractionJobResponse:
    try:
        j_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: '{job_id}'")

    job = await AIExtractionJobService.get_job(db, j_uuid)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    return ExtractionJobResponse.model_validate(job)


@router.get(
    "/geojson/3d",
    response_model=GeoJSONFeatureCollection,
    summary="Viewport 3D buildings GeoJSON for CesiumJS",
    description="Queries 3D buildings intersecting the viewport bounding box."
)
async def get_buildings_geojson_3d(
    bbox: str = Query(..., description="min_lon,min_lat,max_lon,max_lat"),
    limit: int = Query(300, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GeoJSONFeatureCollection:
    min_lon, min_lat, max_lon, max_lat = parse_bbox(bbox)
    envelope = func.ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)

    query = (
        select(Building)
        .where(func.ST_Intersects(Building.footprint_geom, envelope))
        .limit(limit)
    )
    result = await db.execute(query)
    buildings = list(result.scalars().all())

    features = []
    for b in buildings:
        geom_mapping = geometry_to_geojson(b.footprint_geom)
        if not geom_mapping:
            continue

        props = {
            "id": str(b.id),
            "parcel_id": str(b.parcel_id),
            "building_code": b.building_code,
            "name": b.name,
            "building_type": b.building_type,
            "ground_elevation": float(b.ground_elevation),
            "building_height": float(b.building_height),
            "base_elevation": float(b.ground_elevation),
            "extruded_height": float(b.building_height),
            "top_elevation": float(b.ground_elevation + b.building_height),
            "detected_floors": b.detected_floors,
            "height_source": b.height_source or "UNKNOWN",
            "extraction_method": b.extraction_method or "SURVEY",
            "confidence_score": float(b.confidence_score) if b.confidence_score else 0.85,
            "status_3d": b.status_3d or "FOOTPRINT_ONLY",
        }
        features.append(GeoJSONFeature(id=str(b.id), geometry=geom_mapping, properties=props))

    return GeoJSONFeatureCollection(features=features, total_count=len(features))


@router.get(
    "/{building_id}/3d",
    response_model=Building3DResponse,
    summary="Get 3D building details with evidence and provenance"
)
async def get_building_3d_detail(
    building_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Building3DResponse:
    try:
        b_uuid = uuid.UUID(building_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: '{building_id}'")

    res = await db.execute(select(Building).where(Building.id == b_uuid))
    b = res.scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail=f"Building '{building_id}' not found.")

    # Get parent parcel context
    p_res = await db.execute(select(Parcel).where(Parcel.id == b.parcel_id))
    parent_parcel = p_res.scalar_one_or_none()

    footprint_json = geometry_to_geojson(b.footprint_geom)

    return Building3DResponse(
        id=b.id,
        parcel_id=b.parcel_id,
        building_code=b.building_code,
        name=b.name,
        building_type=b.building_type,
        footprint_geojson=footprint_json,
        geom_3d_wkt=str(b.geom_3d) if b.geom_3d else None,
        ground_elevation=float(b.ground_elevation),
        building_height=float(b.building_height),
        detected_floors=b.detected_floors,
        sanctioned_floors=b.sanctioned_floors,
        height_source=b.height_source,
        extraction_method=b.extraction_method,
        confidence_score=float(b.confidence_score) if b.confidence_score else None,
        processing_version=b.processing_version,
        status_3d=b.status_3d,
        metadata_json=b.metadata_json,
        parent_parcel_ulpin=parent_parcel.ulpin_2d if parent_parcel else None,
        parent_parcel_survey=parent_parcel.survey_number if parent_parcel else None,
    )


@router.post(
    "/{building_id}/generate-3d",
    response_model=Building3DResponse,
    summary="Generate or re-extrude 3D PolyhedralSurfaceZ model"
)
async def generate_building_3d(
    building_id: str,
    req: Generate3DRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role(ALLOWED_EXTRACTION_ROLES)),
) -> Building3DResponse:
    try:
        b_uuid = uuid.UUID(building_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: '{building_id}'")

    res = await db.execute(select(Building).where(Building.id == b_uuid))
    b = res.scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail=f"Building '{building_id}' not found.")

    height = req.height_m if req.height_m is not None else float(b.building_height)
    elevation = req.ground_elevation_m if req.ground_elevation_m is not None else float(b.ground_elevation)

    if height <= 0:
        raise HTTPException(status_code=400, detail="Building height must be strictly positive.")

    poly_shape = to_shape(b.footprint_geom)
    wkt_elem, _, _ = Building3DExtrusionService.extrude_footprint(
        polygon_2d=poly_shape,
        ground_elevation=elevation,
        height=height,
        srid=4326
    )

    b.geom_3d = wkt_elem
    b.building_height = Decimal(str(round(height, 2)))
    b.ground_elevation = Decimal(str(round(elevation, 2)))
    b.height_source = req.height_source or b.height_source or "SURVEY"
    b.status_3d = "3D_GENERATED"

    await db.commit()
    await db.refresh(b)

    return await get_building_3d_detail(building_id=building_id, db=db, current_user=current_user)
