"""
BhuSetu 3D — PostGIS Spatial Intelligence Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 3: PostGIS Spatial Hierarchy & Digital Twin Integration

Authoritative PostGIS spatial calculation engine. Computes metric geodesic areas,
point centroids, boundary containment, setbacks, and proximity queries directly in PostgreSQL.
"""
import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.building import Building
from app.models.parcel import Parcel
from app.repositories.property_repository import BuildingRepository, ParcelRepository
from app.schemas.spatial_intelligence import (
    CentroidPoint,
    SpatialSourceProvenance,
    NearbyBuildingItem,
    NearbyParcelItem,
    ParentParcelIntelligence,
    BuildingSpatialIntelligence,
    ParcelSpatialIntelligence,
    ViewportSpatialSummary,
)


class SpatialIntelligenceService:
    """Executes live PostGIS spatial operations for 3D digital-twin inspection."""

    @classmethod
    async def get_building_spatial_intelligence(
        cls, db: AsyncSession, identifier: str
    ) -> Optional[BuildingSpatialIntelligence]:
        building = await BuildingRepository.get_by_identifier(db, identifier)
        if not building:
            return None

        # Execute PostGIS calculations for building and its parent parcel
        query = text("""
            SELECT 
                b.id AS building_id,
                b.building_code,
                b.name,
                b.building_type,
                b.building_height,
                b.sanctioned_floors,
                b.detected_floors,
                (b.detected_floors > b.sanctioned_floors) AS has_conflict,
                ST_X(ST_Centroid(b.footprint_geom)) AS lon,
                ST_Y(ST_Centroid(b.footprint_geom)) AS lat,
                ST_Area(b.footprint_geom::geography) AS footprint_area_sqm,
                p.id AS parcel_id,
                p.ulpin_2d,
                p.survey_number,
                ST_Area(p.geom_2d::geography) AS parcel_area_sqm,
                ST_Within(b.footprint_geom, p.geom_2d) AS is_contained,
                ST_Distance(
                    ST_Boundary(b.footprint_geom)::geography, 
                    ST_Boundary(p.geom_2d)::geography
                ) AS setback_meters
            FROM buildings b
            LEFT JOIN parcels p ON b.parcel_id = p.id
            WHERE b.id = :bld_id
        """)

        result = await db.execute(query, {"bld_id": building.id})
        row = result.first()
        if not row:
            return None

        data = dict(row._mapping)

        # Query nearby buildings within 150m radius via PostGIS ST_DWithin
        nearby_query = text("""
            SELECT 
                other.id,
                other.building_code,
                other.name,
                other.building_type,
                ST_Distance(target.footprint_geom::geography, other.footprint_geom::geography) AS distance_meters
            FROM buildings target
            JOIN buildings other ON other.id != target.id
            WHERE target.id = :bld_id
              AND ST_DWithin(target.footprint_geom::geography, other.footprint_geom::geography, 150.0)
            ORDER BY distance_meters ASC
            LIMIT 6
        """)
        nearby_res = await db.execute(nearby_query, {"bld_id": building.id})
        nearby_buildings = [
            NearbyBuildingItem(
                id=str(r.id),
                building_code=r.building_code,
                name=r.name or r.building_code,
                building_type=r.building_type,
                distance_meters=round(float(r.distance_meters), 2),
            )
            for r in nearby_res
        ]

        parent_parcel = None
        if data.get("parcel_id"):
            is_contained = bool(data["is_contained"])
            parent_parcel = ParentParcelIntelligence(
                parcel_id=str(data["parcel_id"]),
                ulpin=data["ulpin_2d"],
                survey_number=data["survey_number"],
                parcel_area_sqm=round(float(data["parcel_area_sqm"] or 0.0), 2),
                is_contained=is_contained,
                setback_distance_meters=round(float(data["setback_meters"] or 0.0), 2),
                encroachment_status="COMPLIANT" if is_contained else "ENCROACHING",
            )

        return BuildingSpatialIntelligence(
            building_id=str(data["building_id"]),
            building_code=data["building_code"],
            name=data["name"] or data["building_code"],
            typology=data["building_type"],
            centroid=CentroidPoint(
                longitude=round(float(data["lon"]), 6),
                latitude=round(float(data["lat"]), 6),
            ),
            footprint_area_sqm=round(float(data["footprint_area_sqm"]), 2),
            building_height=round(float(data["building_height"]), 2),
            sanctioned_floors=int(data["sanctioned_floors"]),
            detected_floors=int(data["detected_floors"]),
            has_conflict=bool(data["has_conflict"]),
            parent_parcel=parent_parcel,
            nearby_buildings=nearby_buildings,
            spatial_source=SpatialSourceProvenance(
                provenance_status="ILLUSTRATIVE",
                source_type="DEMO_SYNTHETIC",
                confidence_score=0.95,
                crs="EPSG:4326 (WGS 84)",
                authority="BBMP / Survey of India (Digital Twin Prototype)",
                disclaimer="PostGIS spatial operations (ST_Within, ST_Area, ST_Distance, ST_DWithin) computed on digital-twin geometry.",
            ),
        )

    @classmethod
    async def get_parcel_spatial_intelligence(
        cls, db: AsyncSession, identifier: str
    ) -> Optional[ParcelSpatialIntelligence]:
        parcel = await ParcelRepository.get_by_identifier(db, identifier)
        if not parcel:
            return None

        # Execute PostGIS calculations for parcel
        query = text("""
            SELECT 
                p.id AS parcel_id,
                p.ulpin_2d,
                p.survey_number,
                p.land_use,
                p.recorded_area_sqm,
                ST_X(ST_Centroid(p.geom_2d)) AS lon,
                ST_Y(ST_Centroid(p.geom_2d)) AS lat,
                ST_Area(p.geom_2d::geography) AS computed_area_sqm
            FROM parcels p
            WHERE p.id = :prc_id
        """)

        result = await db.execute(query, {"prc_id": parcel.id})
        row = result.first()
        if not row:
            return None

        data = dict(row._mapping)
        computed_area = round(float(data["computed_area_sqm"]), 2)
        recorded_area = round(float(data["recorded_area_sqm"]), 2)
        discrepancy = round(abs(computed_area - recorded_area), 2)

        # Query child buildings
        bld_query = text("""
            SELECT building_code FROM buildings WHERE parcel_id = :prc_id ORDER BY building_code
        """)
        bld_res = await db.execute(bld_query, {"prc_id": parcel.id})
        building_codes = [r.building_code for r in bld_res]

        # Query nearby parcels within 150m radius via PostGIS ST_DWithin
        nearby_query = text("""
            SELECT 
                other.id,
                other.ulpin_2d,
                other.survey_number,
                other.land_use,
                ST_Distance(target.geom_2d::geography, other.geom_2d::geography) AS distance_meters
            FROM parcels target
            JOIN parcels other ON other.id != target.id
            WHERE target.id = :prc_id
              AND ST_DWithin(target.geom_2d::geography, other.geom_2d::geography, 150.0)
            ORDER BY distance_meters ASC
            LIMIT 5
        """)
        nearby_res = await db.execute(nearby_query, {"prc_id": parcel.id})
        nearby_parcels = [
            NearbyParcelItem(
                id=str(r.id),
                ulpin=r.ulpin_2d,
                survey_number=r.survey_number,
                land_use=r.land_use,
                distance_meters=round(float(r.distance_meters), 2),
            )
            for r in nearby_res
        ]

        return ParcelSpatialIntelligence(
            parcel_id=str(data["parcel_id"]),
            ulpin=data["ulpin_2d"],
            survey_number=data["survey_number"],
            land_use=data["land_use"],
            centroid=CentroidPoint(
                longitude=round(float(data["lon"]), 6),
                latitude=round(float(data["lat"]), 6),
            ),
            computed_area_sqm=computed_area,
            recorded_area_sqm=recorded_area,
            area_discrepancy_sqm=discrepancy,
            buildings_count=len(building_codes),
            building_codes=building_codes,
            nearby_parcels=nearby_parcels,
            spatial_source=SpatialSourceProvenance(
                provenance_status="ILLUSTRATIVE",
                source_type="DEMO_SYNTHETIC",
                confidence_score=0.95,
                crs="EPSG:4326 (WGS 84)",
                authority="BBMP / Survey of India (Digital Twin Prototype)",
                disclaimer="PostGIS spatial operations (ST_Centroid, ST_Area, ST_DWithin) computed on cadastral geometry.",
            ),
        )

    @classmethod
    async def get_viewport_summary(
        cls, db: AsyncSession, bbox: List[float]
    ) -> ViewportSpatialSummary:
        min_lon, min_lat, max_lon, max_lat = bbox

        p_query = text("""
            SELECT id, ulpin_2d, survey_number, land_use, recorded_area_sqm
            FROM parcels
            WHERE ST_Intersects(geom_2d, ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326))
            ORDER BY ulpin_2d
            LIMIT 100
        """)
        p_res = await db.execute(p_query, {
            "min_lon": min_lon, "min_lat": min_lat, "max_lon": max_lon, "max_lat": max_lat
        })
        parcels = [
            {
                "id": str(r.id),
                "ulpin": r.ulpin_2d,
                "survey_number": r.survey_number,
                "land_use": r.land_use,
                "recorded_area_sqm": float(r.recorded_area_sqm),
            }
            for r in p_res
        ]

        b_query = text("""
            SELECT id, building_code, name, building_type, building_height, detected_floors
            FROM buildings
            WHERE ST_Intersects(footprint_geom, ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326))
            ORDER BY building_code
            LIMIT 100
        """)
        b_res = await db.execute(b_query, {
            "min_lon": min_lon, "min_lat": min_lat, "max_lon": max_lon, "max_lat": max_lat
        })
        buildings = [
            {
                "id": str(r.id),
                "building_code": r.building_code,
                "name": r.name or r.building_code,
                "building_type": r.building_type,
                "building_height": float(r.building_height),
                "detected_floors": int(r.detected_floors),
            }
            for r in b_res
        ]

        return ViewportSpatialSummary(
            bbox=bbox,
            parcels_count=len(parcels),
            buildings_count=len(buildings),
            parcels=parcels,
            buildings=buildings,
            spatial_source=SpatialSourceProvenance(
                provenance_status="ILLUSTRATIVE",
                source_type="DEMO_SYNTHETIC",
                confidence_score=0.95,
                crs="EPSG:4326 (WGS 84)",
                authority="BBMP / Survey of India (Digital Twin Prototype)",
                disclaimer="Viewport spatial bounding box intersection computed via PostGIS ST_MakeEnvelope and ST_Intersects.",
            ),
        )
