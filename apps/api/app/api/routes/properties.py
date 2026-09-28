"""
BhuSetu 3D Property API Endpoints
PostGIS Spatial Hierarchy & Digital Twin Property Model
"""
import uuid
import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.dependencies.auth import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.region import Region
from app.schemas.common import PaginatedResponse
from app.schemas.property import (
    CitySummary,
    CityDetail,
    RegionSummary,
    RegionDetail,
    ParcelSummary,
    ParcelDetail,
    BuildingSummary,
    BuildingDetail,
    FloorDetail,
    UnitDetail,
    InfrastructureSummary,
    InfrastructureDetail,
    EncroachmentCheckResponse,
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    PropertySearchResult,
    FilterOptionsResponse,
    SpatialHierarchyTreeResponse,
)
from app.repositories.property_repository import (
    CityRepository,
    RegionRepository,
    ParcelRepository,
    BuildingRepository,
    FloorRepository,
    UnitRepository,
    InfrastructureRepository,
)
from app.services.property_service import PropertyService
from app.services.spatial_intelligence_service import SpatialIntelligenceService
from app.schemas.spatial_intelligence import (
    BuildingSpatialIntelligence,
    ParcelSpatialIntelligence,
    ViewportSpatialSummary,
)
from app.core.spatial import parse_bbox, geometry_to_geojson
import shapely.geometry

router = APIRouter(prefix="/properties", tags=["Property Intelligence & Hierarchy"])


# ============================================================================
# Cities Endpoints
# ============================================================================

@router.get(
    "/cities",
    response_model=PaginatedResponse[CitySummary],
    summary="List administrative cities",
    description="Retrieves a paginated list of municipal jurisdictions."
)
async def list_cities(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> PaginatedResponse[CitySummary]:
    skip = (page - 1) * page_size
    items, total = await CityRepository.list_cities(db, skip=skip, limit=page_size)
    return PaginatedResponse(
        items=[PropertyService.map_city_summary(c) for c in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get(
    "/cities/{city_id}",
    response_model=CityDetail,
    summary="Get city details and boundary geometry",
    description="Retrieves city metadata, spatial boundary polygon, and region counts."
)
async def get_city(
    city_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> CityDetail:
    try:
        city_uuid = uuid.UUID(city_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid UUID string for city_id: '{city_id}'."
        )

    city = await CityRepository.get_by_id(db, city_uuid)
    if not city:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"City with id '{city_id}' not found."
        )
    return PropertyService.map_city_detail(city)


# ============================================================================
# Regions Endpoints
# ============================================================================

@router.get(
    "/regions",
    response_model=PaginatedResponse[RegionSummary],
    summary="List regions within a city",
    description="Retrieves administrative regions or wards belonging to a city."
)
async def list_regions(
    city_id: str = Query(..., description="UUID of the parent city"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> PaginatedResponse[RegionSummary]:
    try:
        city_uuid = uuid.UUID(city_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid UUID string for city_id: '{city_id}'."
        )

    skip = (page - 1) * page_size
    items, total = await RegionRepository.list_by_city(db, city_uuid, skip=skip, limit=page_size)
    return PaginatedResponse(
        items=[PropertyService.map_region_summary(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get(
    "/regions/{region_id}",
    response_model=RegionDetail,
    summary="Get region details and boundary geometry",
    description="Retrieves region metadata and MultiPolygon boundary."
)
async def get_region(
    region_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> RegionDetail:
    try:
        region_uuid = uuid.UUID(region_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid UUID string for region_id: '{region_id}'."
        )

    region = await RegionRepository.get_by_id(db, region_uuid)
    if not region:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Region with id '{region_id}' not found."
        )
    return PropertyService.map_region_detail(region)


# ============================================================================
# Parcels Endpoints
# ============================================================================

@router.get(
    "/parcels",
    response_model=PaginatedResponse[ParcelSummary],
    summary="List land parcels with spatial filtering",
    description="Retrieves a paginated list of 2D cadastral parcels. Supports city, region, and bbox filters."
)
async def list_parcels(
    city_id: Optional[str] = Query(None, description="Filter by City UUID"),
    region_id: Optional[str] = Query(None, description="Filter by Region UUID"),
    bbox: Optional[str] = Query(
        None, description="Spatial bounding box query: min_lon,min_lat,max_lon,max_lat (EPSG:4326)"
    ),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> PaginatedResponse[ParcelSummary]:
    city_uuid = None
    if city_id:
        try:
            city_uuid = uuid.UUID(city_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid UUID string for city_id: '{city_id}'."
            )

    region_uuid = None
    if region_id:
        try:
            region_uuid = uuid.UUID(region_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid UUID string for region_id: '{region_id}'."
            )

    parsed_bbox = parse_bbox(bbox) if bbox else None

    skip = (page - 1) * page_size
    items, total = await ParcelRepository.list_parcels(
        db=db,
        city_id=city_uuid,
        region_id=region_uuid,
        bbox=parsed_bbox,
        skip=skip,
        limit=page_size
    )

    return PaginatedResponse(
        items=[PropertyService.map_parcel_summary(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get(
    "/parcels/{parcel_id}",
    response_model=ParcelDetail,
    summary="Get parcel detail by UUID or code",
    description="Retrieves complete parcel geometry, physical buildings, and intersecting infrastructure corridors."
)
async def get_parcel(
    parcel_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> ParcelDetail:
    parcel = await ParcelRepository.get_by_identifier(db, parcel_id, load_relations=True)
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parcel with identifier '{parcel_id}' not found."
        )
    return PropertyService.map_parcel_detail(parcel)


# ============================================================================
# Buildings Endpoints
# ============================================================================

@router.get(
    "/buildings",
    response_model=List[BuildingSummary],
    summary="List buildings by parcel or bounding box",
    description="Retrieves buildings located on a parcel or within a spatial bounding box."
)
async def list_buildings(
    parcel_id: Optional[str] = Query(None, description="Filter by Parcel UUID or identifier"),
    bbox: Optional[str] = Query(None, description="min_lon,min_lat,max_lon,max_lat"),
    limit: int = Query(50, ge=1, le=100, description="Maximum items to return"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> List[BuildingSummary]:
    if parcel_id:
        parcel = await ParcelRepository.get_by_identifier(db, parcel_id, load_relations=False)
        if not parcel:
            return []
        buildings = await BuildingRepository.list_by_parcel(db, parcel.id)
    else:
        # Default to the demonstration precinct bounding box if not provided
        parsed_bbox = parse_bbox(bbox) if bbox else (77.56, 12.99, 77.58, 13.01)
        buildings = await BuildingRepository.list_by_bbox(db, parsed_bbox, limit=limit)

    return [PropertyService.map_building_summary(b) for b in buildings]


@router.get(
    "/buildings/{building_id}",
    response_model=BuildingDetail,
    summary="Get building detail and floor hierarchy",
    description="Retrieves building footprints, 3D extruded geometry, and vertical floors."
)
async def get_building(
    building_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> BuildingDetail:
    building = await BuildingRepository.get_by_identifier(db, building_id)
    if not building:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Building with identifier '{building_id}' not found."
        )
    return PropertyService.map_building_detail(building)


@router.get(
    "/buildings/{building_id}/spatial-intelligence",
    response_model=BuildingSpatialIntelligence,
    summary="Get building PostGIS spatial intelligence",
    description="Retrieves live PostGIS calculations: centroid, metric area, parcel containment, setback, and nearby buildings."
)
async def get_building_spatial_intelligence(
    building_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> BuildingSpatialIntelligence:
    data = await SpatialIntelligenceService.get_building_spatial_intelligence(db, building_id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Building '{building_id}' not found for spatial intelligence."
        )
    return data


@router.get(
    "/parcels/{parcel_id}/spatial-intelligence",
    response_model=ParcelSpatialIntelligence,
    summary="Get parcel PostGIS spatial intelligence",
    description="Retrieves live PostGIS calculations: centroid, metric area, area discrepancy, and nearby parcels."
)
async def get_parcel_spatial_intelligence(
    parcel_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> ParcelSpatialIntelligence:
    data = await SpatialIntelligenceService.get_parcel_spatial_intelligence(db, parcel_id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parcel '{parcel_id}' not found for spatial intelligence."
        )
    return data


@router.get(
    "/spatial/viewport",
    response_model=ViewportSpatialSummary,
    summary="Query properties within viewport bounding box",
    description="Returns all parcels and buildings inside the specified geographic bounding box."
)
async def get_viewport_spatial_summary(
    bbox: str = Query("77.56,12.99,77.58,13.01", description="min_lon,min_lat,max_lon,max_lat in EPSG:4326"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> ViewportSpatialSummary:
    parsed_bbox = list(parse_bbox(bbox))
    return await SpatialIntelligenceService.get_viewport_summary(db, parsed_bbox)


# ============================================================================
# Floors Endpoints
# ============================================================================

@router.get(
    "/floors/{floor_id}",
    response_model=FloorDetail,
    summary="Get floor detail and units",
    description="Retrieves vertical elevations, 3D volumetric envelope, and property units."
)
async def get_floor(
    floor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> FloorDetail:
    try:
        flr_uuid = uuid.UUID(floor_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid UUID string for floor_id: '{floor_id}'."
        )

    floor = await FloorRepository.get_by_id(db, flr_uuid)
    if not floor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Floor with id '{floor_id}' not found."
        )
    return PropertyService.map_floor_detail(floor)


# ============================================================================
# Units Endpoints
# ============================================================================

@router.get(
    "/units/{unit_id}",
    response_model=UnitDetail,
    summary="Get 3D unit detail and ULPIN",
    description="Retrieves unit 3D centroid, 3D envelope, carpet area, and 3D ULPIN."
)
async def get_unit(
    unit_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> UnitDetail:
    try:
        unit_uuid = uuid.UUID(unit_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid UUID string for unit_id: '{unit_id}'."
        )

    unit = await UnitRepository.get_by_id(db, unit_uuid)
    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unit with id '{unit_id}' not found."
        )
    return PropertyService.map_unit_detail(unit)


# ============================================================================
# Infrastructure Endpoints
# ============================================================================

@router.get(
    "/infrastructure",
    response_model=PaginatedResponse[InfrastructureSummary],
    summary="List infrastructure assets in a city",
    description="Retrieves utilities, subsurface pipelines, and transit corridors."
)
async def list_infrastructure(
    city_id: str = Query(..., description="UUID of the city"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> PaginatedResponse[InfrastructureSummary]:
    try:
        city_uuid = uuid.UUID(city_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid UUID string for city_id: '{city_id}'."
        )

    skip = (page - 1) * page_size
    items, total = await InfrastructureRepository.list_by_city(
        db, city_uuid, skip=skip, limit=page_size
    )
    return PaginatedResponse(
        items=[PropertyService.map_infrastructure_summary(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get(
    "/infrastructure/{infrastructure_id}",
    response_model=InfrastructureDetail,
    summary="Get infrastructure asset detail and geometry",
    description="Retrieves 3D spatial geometry and intersecting parcel identifiers."
)
async def get_infrastructure(
    infrastructure_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> InfrastructureDetail:
    try:
        infra_uuid = uuid.UUID(infrastructure_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid UUID string for infrastructure_id: '{infrastructure_id}'."
        )

    infra = await InfrastructureRepository.get_by_id(db, infra_uuid)
    if not infra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Infrastructure asset with id '{infrastructure_id}' not found."
        )
    return PropertyService.map_infrastructure_detail(infra)


# ============================================================================
# Stored PostGIS RPC Function Endpoint
# ============================================================================

@router.get(
    "/buildings/{building_id}/encroachment/{parcel_id}",
    response_model=EncroachmentCheckResponse,
    summary="Evaluate boundary encroachment via PostGIS RPC",
    description="Invokes PostGIS stored function to compute spatial discrepancy between building and parcel."
)
async def check_building_encroachment(
    building_id: str,
    parcel_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> EncroachmentCheckResponse:
    try:
        bld_uuid = uuid.UUID(building_id)
        prc_uuid = uuid.UUID(parcel_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format for building_id or parcel_id."
        )

    return await PropertyService.evaluate_encroachment(db, bld_uuid, prc_uuid)


# ============================================================================
# Phase 5: 2D GIS Workspace & GeoJSON Layer Endpoints
# ============================================================================

def _compute_center_and_bounds(geom_dict: Optional[dict]):
    if not geom_dict:
        return [77.5946, 12.9716], None
    try:
        s = shapely.geometry.shape(geom_dict)
        c = [float(s.centroid.x), float(s.centroid.y)]
        b = [float(x) for x in s.bounds]
        return c, b
    except Exception:
        return [77.5946, 12.9716], None


@router.get(
    "/geojson/parcels",
    response_model=GeoJSONFeatureCollection,
    summary="Get 2D cadastral parcels as GeoJSON FeatureCollection",
    description="Spatial viewport query returning parcel boundaries and attributes for MapLibre GL rendering."
)
async def get_parcels_geojson(
    bbox: str = Query(..., description="min_lon,min_lat,max_lon,max_lat in EPSG:4326"),
    city_id: Optional[str] = Query(None),
    region_id: Optional[str] = Query(None),
    land_use: Optional[str] = Query(None),
    limit: int = Query(500, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> GeoJSONFeatureCollection:
    parsed_bbox = parse_bbox(bbox)
    city_uuid = uuid.UUID(city_id) if city_id else None
    region_uuid = uuid.UUID(region_id) if region_id else None

    parcels, total = await ParcelRepository.list_parcels(
        db=db,
        city_id=city_uuid,
        region_id=region_uuid,
        bbox=parsed_bbox,
        skip=0,
        limit=limit,
    )

    features = []
    for p in parcels:
        if land_use and p.land_use.upper() != land_use.upper():
            continue

        geom_geojson = geometry_to_geojson(p.geom_2d)
        if not geom_geojson:
            continue

        features.append(GeoJSONFeature(
            type="Feature",
            id=str(p.id),
            geometry=geom_geojson,
            properties={
                "id": str(p.id),
                "ulpin_2d": p.ulpin_2d,
                "survey_number": p.survey_number,
                "land_use": p.land_use,
                "recorded_area_sqm": float(p.recorded_area_sqm),
                "computed_area_sqm": float(p.computed_area_sqm),
                "elevation_base": float(p.elevation_base or 0.0),
                "buildings_count": len(p.buildings) if p.buildings else 0,
            }
        ))

    return GeoJSONFeatureCollection(
        type="FeatureCollection",
        features=features,
        bbox=list(parsed_bbox),
        total_count=len(features),
    )


@router.get(
    "/geojson/buildings",
    response_model=GeoJSONFeatureCollection,
    summary="Get building footprints as GeoJSON FeatureCollection",
    description="Spatial viewport query returning building footprint polygons."
)
async def get_buildings_geojson(
    bbox: str = Query(..., description="min_lon,min_lat,max_lon,max_lat in EPSG:4326"),
    limit: int = Query(500, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> GeoJSONFeatureCollection:
    parsed_bbox = parse_bbox(bbox)
    buildings = await BuildingRepository.list_by_bbox(db=db, bbox=parsed_bbox, limit=limit)

    features = []
    for b in buildings:
        geom_geojson = geometry_to_geojson(b.footprint_geom)
        if not geom_geojson:
            continue

        features.append(GeoJSONFeature(
            type="Feature",
            id=str(b.id),
            geometry=geom_geojson,
            properties={
                "id": str(b.id),
                "parcel_id": str(b.parcel_id),
                "building_code": b.building_code,
                "name": b.name,
                "building_type": b.building_type,
                "building_height": float(b.building_height),
                "detected_floors": b.detected_floors,
                "sanctioned_floors": b.sanctioned_floors,
            }
        ))

    return GeoJSONFeatureCollection(
        type="FeatureCollection",
        features=features,
        bbox=list(parsed_bbox),
        total_count=len(features),
    )


@router.get(
    "/geojson/regions",
    response_model=GeoJSONFeatureCollection,
    summary="Get administrative regions as GeoJSON FeatureCollection",
    description="Retrieves administrative ward/zone boundaries."
)
async def get_regions_geojson(
    city_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> GeoJSONFeatureCollection:
    city_uuid = uuid.UUID(city_id) if city_id else None
    if city_uuid:
        regions, _ = await RegionRepository.list_by_city(db=db, city_id=city_uuid, limit=100)
    else:
        from sqlalchemy import select
        res = await db.execute(select(Region).limit(100))
        regions = list(res.scalars().all())

    features = []
    for r in regions:
        geom_geojson = geometry_to_geojson(r.geom_2d)
        if not geom_geojson:
            continue
        features.append(GeoJSONFeature(
            type="Feature",
            id=str(r.id),
            geometry=geom_geojson,
            properties={
                "id": str(r.id),
                "name": r.name,
                "code": r.code,
                "city_id": str(r.city_id),
            }
        ))

    return GeoJSONFeatureCollection(
        type="FeatureCollection",
        features=features,
        total_count=len(features),
    )


@router.get(
    "/geojson/infrastructure",
    response_model=GeoJSONFeatureCollection,
    summary="Get infrastructure corridors as GeoJSON FeatureCollection",
    description="Retrieves road, water, and utility corridors within the viewport."
)
async def get_infrastructure_geojson(
    bbox: str = Query(..., description="min_lon,min_lat,max_lon,max_lat in EPSG:4326"),
    infrastructure_type: Optional[str] = Query(None),
    limit: int = Query(500, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> GeoJSONFeatureCollection:
    parsed_bbox = parse_bbox(bbox)
    infras = await InfrastructureRepository.list_by_bbox(
        db=db,
        bbox=parsed_bbox,
        infra_type=infrastructure_type,
        limit=limit
    )

    features = []
    for i in infras:
        geom_geojson = geometry_to_geojson(i.geom_2d)
        if not geom_geojson:
            continue
        features.append(GeoJSONFeature(
            type="Feature",
            id=str(i.id),
            geometry=geom_geojson,
            properties={
                "id": str(i.id),
                "name": i.name,
                "infrastructure_type": i.infrastructure_type,
                "status": i.status,
            }
        ))

    return GeoJSONFeatureCollection(
        type="FeatureCollection",
        features=features,
        bbox=list(parsed_bbox),
        total_count=len(features),
    )


@router.get(
    "/search",
    response_model=List[PropertySearchResult],
    summary="Search parcels by ULPIN, survey number, or ID",
    description="Full-text property search returning matching parcels with bounding coordinates."
)
async def search_properties(
    q: str = Query(..., min_length=1, description="Search term (ULPIN, survey number, or parcel ID)"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> List[PropertySearchResult]:
    parcels = []
    for attempt in range(3):
        try:
            parcels = await ParcelRepository.search_parcels(db=db, query=q, limit=limit)
            break
        except Exception as e:
            if attempt == 2:
                # Log error and return empty list gracefully rather than hard 500
                from app.core.logging import get_logger
                logger = get_logger("bhusetu_3d")
                logger.warning(f"[SEARCH_PARCELS_EXCEPTION] Error during search after 3 attempts: {e}")
                return []
            import asyncio
            await asyncio.sleep(0.3)

    results = []
    for p in parcels:
        geom_dict = geometry_to_geojson(p.geom_2d)
        center, b_box = _compute_center_and_bounds(geom_dict)
        results.append(PropertySearchResult(
            id=str(p.id),
            ulpin_2d=p.ulpin_2d,
            survey_number=p.survey_number,
            land_use=p.land_use,
            recorded_area_sqm=float(p.recorded_area_sqm),
            city_name=p.city.name if p.city else "Municipal City",
            region_name=p.region.name if p.region else "Default Ward",
            buildings_count=len(p.buildings) if p.buildings else 0,
            center=center,
            bbox=b_box,
        ))
    return results


@router.get(
    "/filter-options",
    response_model=FilterOptionsResponse,
    summary="Get filter options for 2D Property Explorer",
    description="Returns list of available cities, regions, and distinct land use classifications."
)
async def get_filter_options(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> FilterOptionsResponse:
    cities, _ = await CityRepository.list_cities(db=db, limit=100)
    land_uses = await ParcelRepository.list_distinct_land_uses(db=db)

    from sqlalchemy import select
    res_reg = await db.execute(select(Region).limit(100))
    regions = list(res_reg.scalars().all())

    return FilterOptionsResponse(
        cities=[{"id": str(c.id), "name": c.name, "code": c.code} for c in cities],
        regions=[{"id": str(r.id), "name": r.name, "code": r.code, "city_id": str(r.city_id)} for r in regions],
        land_uses=land_uses,
    )


# ============================================================================
# 10. Spatial Hierarchy Outliner Tree Endpoint
# ============================================================================

@router.get(
    "/hierarchy/tree",
    response_model=SpatialHierarchyTreeResponse,
    summary="Get complete spatial hierarchy outliner tree",
    description="Assembles complete hierarchy tree: City -> Regions -> Parcels -> Buildings -> Floors -> Units -> Spatial Elements."
)
async def get_spatial_hierarchy_tree(
    city_id: Optional[str] = Query(None, description="Optional City UUID filter"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> SpatialHierarchyTreeResponse:
    city_uuid = None
    if city_id:
        try:
            city_uuid = uuid.UUID(city_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid UUID string for city_id: '{city_id}'."
            )
    return await PropertyService.get_spatial_hierarchy_tree(db, city_uuid)

