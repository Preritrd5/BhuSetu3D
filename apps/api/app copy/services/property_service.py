"""
BhuSetu 3D Property Domain Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Integration + Property Data Model
"""
import uuid
from decimal import Decimal
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from fastapi import HTTPException, status

from app.models.city import City
from app.models.region import Region
from app.models.parcel import Parcel
from app.models.building import Building
from app.models.floor import Floor
from app.models.unit import Unit
from app.models.infrastructure import Infrastructure
from app.repositories.property_repository import (
    CityRepository,
    RegionRepository,
    ParcelRepository,
    BuildingRepository,
    FloorRepository,
    UnitRepository,
    InfrastructureRepository,
)
from app.schemas.property import (
    CitySummary,
    CityDetail,
    RegionSummary,
    RegionDetail,
    ParcelSummary,
    ParcelDetail,
    ParcelCreate,
    BuildingSummary,
    BuildingDetail,
    BuildingCreate,
    FloorDetail,
    FloorCreate,
    UnitSummary,
    UnitDetail,
    UnitCreate,
    InfrastructureSummary,
    InfrastructureDetail,
    EncroachmentCheckResponse,
)
from app.core.spatial import geometry_to_geojson, geojson_to_wkb
from app.core.logging import logger


class PropertyService:
    """Coordinates business rules, spatial serialization, and transactions for property hierarchies."""

    # =========================================================================
    # Serialization Mappers
    # =========================================================================

    @staticmethod
    def map_city_summary(city: City) -> CitySummary:
        return CitySummary(
            id=str(city.id),
            code=city.code,
            name=city.name,
            state=city.state,
            country=city.country,
            default_srid=city.default_srid,
        )

    @staticmethod
    def map_city_detail(city: City) -> CityDetail:
        return CityDetail(
            id=str(city.id),
            code=city.code,
            name=city.name,
            state=city.state,
            country=city.country,
            default_srid=city.default_srid,
            bounds_geojson=geometry_to_geojson(city.bounds_geom),
            regions_count=len(city.regions) if city.regions else 0,
            created_at=city.created_at,
            updated_at=city.updated_at,
        )

    @staticmethod
    def map_region_summary(region: Region) -> RegionSummary:
        return RegionSummary(
            id=str(region.id),
            city_id=str(region.city_id),
            code=region.code,
            name=region.name,
        )

    @staticmethod
    def map_region_detail(region: Region) -> RegionDetail:
        return RegionDetail(
            id=str(region.id),
            city_id=str(region.city_id),
            code=region.code,
            name=region.name,
            boundary_geojson=geometry_to_geojson(region.boundary_geom),
            created_at=region.created_at,
        )

    @staticmethod
    def map_unit_summary(unit: Unit) -> UnitSummary:
        return UnitSummary(
            id=str(unit.id),
            floor_id=str(unit.floor_id),
            building_id=str(unit.building_id),
            parcel_id=str(unit.parcel_id),
            ulpin_3d=unit.ulpin_3d,
            unit_number=unit.unit_number,
            unit_type=unit.unit_type,
            carpet_area_sqm=float(unit.carpet_area_sqm),
            verification_status=unit.verification_status,
        )

    @staticmethod
    def map_unit_detail(unit: Unit) -> UnitDetail:
        return UnitDetail(
            id=str(unit.id),
            floor_id=str(unit.floor_id),
            building_id=str(unit.building_id),
            parcel_id=str(unit.parcel_id),
            ulpin_3d=unit.ulpin_3d,
            unit_number=unit.unit_number,
            unit_type=unit.unit_type,
            carpet_area_sqm=float(unit.carpet_area_sqm),
            spatial_centroid_geojson=geometry_to_geojson(unit.spatial_centroid_z),
            geom_3d_geojson=geometry_to_geojson(unit.geom_3d),
            verification_status=unit.verification_status,
            created_at=unit.created_at,
            updated_at=unit.updated_at,
        )

    @staticmethod
    def map_floor_detail(floor: Floor) -> FloorDetail:
        return FloorDetail(
            id=str(floor.id),
            building_id=str(floor.building_id),
            floor_number=floor.floor_number,
            floor_code=floor.floor_code,
            base_elevation=float(floor.base_elevation),
            ceiling_elevation=float(floor.ceiling_elevation),
            floor_height=float(floor.floor_height),
            floor_area_sqm=float(floor.floor_area_sqm),
            geom_3d_geojson=geometry_to_geojson(floor.geom_3d),
            units=[PropertyService.map_unit_summary(u) for u in (floor.units or [])],
            created_at=floor.created_at,
        )

    @staticmethod
    def map_building_summary(building: Building) -> BuildingSummary:
        return BuildingSummary(
            id=str(building.id),
            parcel_id=str(building.parcel_id),
            building_code=building.building_code,
            name=building.name,
            building_type=building.building_type,
            ground_elevation=float(building.ground_elevation),
            building_height=float(building.building_height),
            detected_floors=building.detected_floors,
            sanctioned_floors=building.sanctioned_floors,
        )

    @staticmethod
    def map_building_detail(building: Building) -> BuildingDetail:
        return BuildingDetail(
            id=str(building.id),
            parcel_id=str(building.parcel_id),
            building_code=building.building_code,
            name=building.name,
            building_type=building.building_type,
            ground_elevation=float(building.ground_elevation),
            building_height=float(building.building_height),
            detected_floors=building.detected_floors,
            sanctioned_floors=building.sanctioned_floors,
            footprint_geojson=geometry_to_geojson(building.footprint_geom),
            geom_3d_geojson=geometry_to_geojson(building.geom_3d),
            floors=[
                PropertyService.map_floor_detail(f) for f in (building.floors or [])
            ],
            created_at=building.created_at,
            updated_at=building.updated_at,
        )

    @staticmethod
    def map_parcel_summary(parcel: Parcel) -> ParcelSummary:
        return ParcelSummary(
            id=str(parcel.id),
            city_id=str(parcel.city_id),
            region_id=str(parcel.region_id),
            ulpin_2d=parcel.ulpin_2d,
            survey_number=parcel.survey_number,
            recorded_area_sqm=float(parcel.recorded_area_sqm),
            computed_area_sqm=float(parcel.computed_area_sqm),
            land_use=parcel.land_use,
            elevation_base=float(parcel.elevation_base),
            buildings_count=len(parcel.buildings) if parcel.buildings else 0,
        )

    @staticmethod
    def map_parcel_detail(parcel: Parcel) -> ParcelDetail:
        infra_ids = [
            str(assoc.infrastructure_id)
            for assoc in (parcel.infrastructure_associations or [])
        ]
        return ParcelDetail(
            id=str(parcel.id),
            city_id=str(parcel.city_id),
            region_id=str(parcel.region_id),
            ulpin_2d=parcel.ulpin_2d,
            survey_number=parcel.survey_number,
            recorded_area_sqm=float(parcel.recorded_area_sqm),
            computed_area_sqm=float(parcel.computed_area_sqm),
            land_use=parcel.land_use,
            elevation_base=float(parcel.elevation_base),
            buildings_count=len(parcel.buildings) if parcel.buildings else 0,
            geom_2d_geojson=geometry_to_geojson(parcel.geom_2d),
            buildings=[
                PropertyService.map_building_summary(b)
                for b in (parcel.buildings or [])
            ],
            infrastructure_ids=infra_ids,
            created_at=parcel.created_at,
            updated_at=parcel.updated_at,
        )

    @staticmethod
    def map_infrastructure_summary(infra: Infrastructure) -> InfrastructureSummary:
        return InfrastructureSummary(
            id=str(infra.id),
            city_id=str(infra.city_id),
            name=infra.name,
            utility_category=infra.utility_category,
            is_subsurface=infra.is_subsurface,
            depth_meters=float(infra.depth_meters),
            evidence_source_type=infra.evidence_source_type,
        )

    @staticmethod
    def map_infrastructure_detail(infra: Infrastructure) -> InfrastructureDetail:
        intersecting_ids = [
            str(assoc.parcel_id)
            for assoc in (infra.parcel_associations or [])
        ]
        return InfrastructureDetail(
            id=str(infra.id),
            city_id=str(infra.city_id),
            name=infra.name,
            utility_category=infra.utility_category,
            is_subsurface=infra.is_subsurface,
            depth_meters=float(infra.depth_meters),
            evidence_source_type=infra.evidence_source_type,
            geom_spatial_geojson=geometry_to_geojson(infra.geom_spatial),
            intersecting_parcel_ids=intersecting_ids,
            created_at=infra.created_at,
        )

    # =========================================================================
    # Domain Business Logic & Operations
    # =========================================================================

    @staticmethod
    async def create_parcel(
        db: AsyncSession, data: ParcelCreate
    ) -> ParcelDetail:
        """
        Creates a new 2D Cadastral parcel with database transaction handling.
        Validates city, region, unique ULPIN, and geometry.
        """
        # Validate UUIDs
        try:
            city_uuid = uuid.UUID(data.city_id)
            region_uuid = uuid.UUID(data.region_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid UUID format for city_id or region_id.",
            )

        # Ensure city exists
        city = await CityRepository.get_by_id(db, city_uuid)
        if not city:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"City with id '{data.city_id}' does not exist.",
            )

        # Ensure region exists
        region = await RegionRepository.get_by_id(db, region_uuid)
        if not region:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Region with id '{data.region_id}' does not exist.",
            )

        # Check ULPIN uniqueness
        existing = await ParcelRepository.get_by_ulpin(db, data.ulpin_2d)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Parcel with 2D ULPIN '{data.ulpin_2d}' already exists.",
            )

        # Convert and validate geometry
        wkb_geom = geojson_to_wkb(data.geom_2d_geojson, srid=4326)

        computed_area = Decimal(str(data.computed_area_sqm)) if data.computed_area_sqm else Decimal(str(data.recorded_area_sqm))

        new_parcel = Parcel(
            id=uuid.uuid4(),
            city_id=city_uuid,
            region_id=region_uuid,
            ulpin_2d=data.ulpin_2d.strip(),
            survey_number=data.survey_number.strip(),
            recorded_area_sqm=Decimal(str(data.recorded_area_sqm)),
            computed_area_sqm=computed_area,
            land_use=data.land_use.strip(),
            geom_2d=wkb_geom,
            elevation_base=Decimal(str(data.elevation_base)),
        )

        try:
            async with db.begin_nested():
                await ParcelRepository.create_parcel(db, new_parcel)
            await db.commit()
            await db.refresh(new_parcel)
            return PropertyService.map_parcel_detail(new_parcel)
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating parcel: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to persist parcel record to database.",
            )

    @staticmethod
    async def evaluate_encroachment(
        db: AsyncSession, building_id: uuid.UUID, parcel_id: uuid.UUID
    ) -> EncroachmentCheckResponse:
        """
        Executes canonical Supabase PostGIS stored RPC function:
        evaluate_building_parcel_encroachment(building_id, parcel_id)
        """
        sql = text("""
            SELECT 
                has_encroachment, 
                encroachment_area_sqm, 
                ST_AsGeoJSON(encroachment_geom) as encroachment_geojson_str, 
                severity
            FROM public.evaluate_building_parcel_encroachment(:building_id, :parcel_id)
        """)
        try:
            result = await db.execute(sql, {"building_id": building_id, "parcel_id": parcel_id})
            row = result.first()
            if not row:
                return EncroachmentCheckResponse(
                    has_encroachment=False,
                    encroachment_area_sqm=0.0,
                    encroachment_geojson=None,
                    severity="NONE"
                )

            import json
            encroachment_geo = None
            if row.encroachment_geojson_str:
                encroachment_geo = json.loads(row.encroachment_geojson_str)

            return EncroachmentCheckResponse(
                has_encroachment=bool(row.has_encroachment),
                encroachment_area_sqm=float(row.encroachment_area_sqm or 0.0),
                encroachment_geojson=encroachment_geo,
                severity=str(row.severity)
            )
        except Exception as e:
            logger.warning(f"Error evaluating encroachment via PostGIS RPC: {e}")
            return EncroachmentCheckResponse(
                has_encroachment=False,
                encroachment_area_sqm=0.0,
                encroachment_geojson=None,
                severity="NONE"
            )
