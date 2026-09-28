"""
BhuSetu 3D Vertical Property Hierarchy & ULPIN Model API Endpoints
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 7: Vertical Property Mapping + 3D ULPIN Model
"""
import uuid
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database.connection import get_db
from app.dependencies.auth import get_current_user, require_any_role
from app.models.user import User
from app.models.building import Building
from app.models.floor import Floor
from app.models.unit import Unit
from app.models.parcel import Parcel
from app.schemas.vertical_property import (
    PropertyHierarchyResponse,
    FloorHierarchyItem,
    UnitHierarchyItem,
    VerticalValidationResult,
    FloorCreateRequest,
    UnitCreateRequest,
)
from app.schemas.property import (
    FloorDetail,
    UnitDetail,
    GeoJSONFeatureCollection,
)
from app.services.vertical_property_service import VerticalPropertyService
from app.services.property_service import PropertyService
from app.core.spatial import geojson_to_wkb
from app.core.logging import logger

router = APIRouter(prefix="/properties", tags=["Vertical Property Mapping & 3D ULPIN"])

ALLOWED_SURVEY_ROLES = ["ADMIN", "SURVEYOR", "PLANNER"]


@router.get(
    "/{property_id}/hierarchy",
    response_model=PropertyHierarchyResponse,
    summary="Get complete vertical property hierarchy (Parcel -> Building -> Floor -> Unit)",
    description="Assembles the multi-level vertical property tree with deterministic ULPIN-oriented prototype identity."
)
async def get_property_hierarchy(
    property_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PropertyHierarchyResponse:
    try:
        p_uuid = uuid.UUID(property_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid property UUID: '{property_id}'."
        )

    try:
        hierarchy = await VerticalPropertyService.build_property_hierarchy(db, p_uuid)
        return hierarchy
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to assemble property hierarchy for '{property_id}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve vertical property hierarchy."
        )


@router.get(
    "/buildings/{building_id}/floors",
    response_model=List[FloorHierarchyItem],
    summary="List vertical floors for a building structure"
)
async def list_building_floors(
    building_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[FloorHierarchyItem]:
    try:
        b_uuid = uuid.UUID(building_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: '{building_id}'.")

    stmt = (
        select(Floor)
        .where(Floor.building_id == b_uuid)
        .order_by(Floor.floor_number)
        .options(selectinload(Floor.units))
    )
    res = await db.execute(stmt)
    floors = list(res.scalars().all())

    items: List[FloorHierarchyItem] = []
    for f in floors:
        units_count = len(f.units) if f.units else 0
        items.append(FloorHierarchyItem(
            id=str(f.id),
            building_id=str(f.building_id),
            floor_number=f.floor_number,
            floor_code=f.floor_code,
            floor_label=getattr(f, "floor_label", None) or f"Level {f.floor_number}",
            base_elevation=float(f.base_elevation),
            ceiling_elevation=float(f.ceiling_elevation),
            floor_height=float(f.floor_height),
            floor_area_sqm=float(f.floor_area_sqm),
            status_3d=getattr(f, "status_3d", "AVAILABLE") or "AVAILABLE",
            height_source=getattr(f, "height_source", None),
            extraction_method=getattr(f, "extraction_method", None),
            confidence_score=float(f.confidence_score) if getattr(f, "confidence_score", None) else None,
            units_count=units_count,
            units=[]
        ))
    return items


@router.get(
    "/buildings/{building_id}/floors/3d",
    response_model=GeoJSONFeatureCollection,
    summary="Get 3D volumetric floor slabs GeoJSON for CesiumJS",
    description="Produces floor polygons with base and ceiling elevations for 3D extrusion."
)
async def get_building_floors_3d(
    building_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GeoJSONFeatureCollection:
    try:
        b_uuid = uuid.UUID(building_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: '{building_id}'.")

    b_res = await db.execute(select(Building).where(Building.id == b_uuid))
    building = b_res.scalar_one_or_none()
    if not building:
        raise HTTPException(status_code=404, detail=f"Building '{building_id}' not found.")

    f_res = await db.execute(
        select(Floor)
        .where(Floor.building_id == b_uuid)
        .order_by(Floor.floor_number)
    )
    floors = list(f_res.scalars().all())

    return VerticalPropertyService.get_building_floors_3d_geojson(building, floors)


@router.get(
    "/floors/{floor_id}",
    response_model=FloorDetail,
    summary="Get floor details and atomic units list"
)
async def get_floor_detail(
    floor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FloorDetail:
    try:
        f_uuid = uuid.UUID(floor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: '{floor_id}'.")

    stmt = select(Floor).where(Floor.id == f_uuid).options(selectinload(Floor.units))
    res = await db.execute(stmt)
    floor = res.scalar_one_or_none()
    if not floor:
        raise HTTPException(status_code=404, detail=f"Floor '{floor_id}' not found.")

    return PropertyService.map_floor_detail(floor)


@router.get(
    "/floors/{floor_id}/units",
    response_model=List[UnitHierarchyItem],
    summary="List property units on a vertical floor level"
)
async def list_floor_units(
    floor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[UnitHierarchyItem]:
    try:
        f_uuid = uuid.UUID(floor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: '{floor_id}'.")

    stmt = select(Unit).where(Unit.floor_id == f_uuid).order_by(Unit.unit_number)
    res = await db.execute(stmt)
    units = list(res.scalars().all())

    items: List[UnitHierarchyItem] = []
    for u in units:
        c_coords = None
        if u.spatial_centroid_z is not None:
            c_json = geometry_to_geojson(u.spatial_centroid_z)
            if c_json and "coordinates" in c_json:
                c_coords = c_json["coordinates"]

        items.append(UnitHierarchyItem(
            id=str(u.id),
            floor_id=str(u.floor_id),
            building_id=str(u.building_id),
            parcel_id=str(u.parcel_id),
            ulpin_3d=u.ulpin_3d,
            unit_number=u.unit_number,
            unit_label=getattr(u, "unit_label", None) or f"Unit {u.unit_number}",
            unit_type=u.unit_type,
            carpet_area_sqm=float(u.carpet_area_sqm),
            has_centroid_z=c_coords is not None,
            centroid_z_coords=c_coords,
            has_geom_3d=u.geom_3d is not None,
            verification_status=u.verification_status,
            status_3d=getattr(u, "status_3d", "AVAILABLE") or "AVAILABLE",
            extraction_method=getattr(u, "extraction_method", None),
            confidence_score=float(u.confidence_score) if getattr(u, "confidence_score", None) else None,
            provenance_source="REGISTRY_SURVEY"
        ))
    return items


@router.get(
    "/floors/{floor_id}/units/3d",
    response_model=GeoJSONFeatureCollection,
    summary="Get 3D unit centroids and geometries GeoJSON for CesiumJS"
)
async def get_floor_units_3d(
    floor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GeoJSONFeatureCollection:
    try:
        f_uuid = uuid.UUID(floor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: '{floor_id}'.")

    stmt = select(Unit).where(Unit.floor_id == f_uuid).order_by(Unit.unit_number)
    res = await db.execute(stmt)
    units = list(res.scalars().all())

    return VerticalPropertyService.get_floor_units_3d_geojson(units)


@router.get(
    "/units/{unit_id}",
    response_model=UnitDetail,
    summary="Get 3D property unit detail"
)
async def get_unit_detail(
    unit_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UnitDetail:
    try:
        u_uuid = uuid.UUID(unit_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: '{unit_id}'.")

    stmt = select(Unit).where(Unit.id == u_uuid)
    res = await db.execute(stmt)
    unit = res.scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=404, detail=f"Unit '{unit_id}' not found.")

    return PropertyService.map_unit_detail(unit)


@router.post(
    "/buildings/{building_id}/validate-vertical",
    response_model=VerticalValidationResult,
    summary="Validate vertical geometry and elevation consistency"
)
async def validate_building_vertical(
    building_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VerticalValidationResult:
    try:
        b_uuid = uuid.UUID(building_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid UUID: '{building_id}'.")

    b_res = await db.execute(
        select(Building)
        .where(Building.id == b_uuid)
        .options(selectinload(Building.floors))
    )
    building = b_res.scalar_one_or_none()
    if not building:
        raise HTTPException(status_code=404, detail=f"Building '{building_id}' not found.")

    return VerticalPropertyService.validate_vertical_hierarchy(building, building.floors or [])
