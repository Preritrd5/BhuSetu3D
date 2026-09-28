"""
BhuSetu 3D Infrastructure Intelligence & Proximity Service
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 12: 4D Property History + Infrastructure Intelligence

Provides PostGIS conformal proximity analysis, topological relationship classification
(NEAR, SPATIALLY_INTERSECTS, ADJACENT, CONNECTED), and temporal consistency verification.
"""
import json
from datetime import datetime, date
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, and_, or_, func, text, cast
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geography

from app.models.infrastructure import Infrastructure
from app.models.parcel import Parcel
from app.models.building import Building
from app.schemas.temporal import (
    InfrastructureRelationshipType,
    NearbyInfrastructureItem,
    PropertyInfrastructureResponse,
    InfrastructureRelationshipHistoryItem,
)


class InfrastructureService:
    @staticmethod
    async def get_nearby_infrastructure(
        db: AsyncSession,
        property_id: UUID,
        property_type: str = "PARCEL",
        max_distance_meters: float = 100.0,
        observation_date: Optional[date] = None,
    ) -> PropertyInfrastructureResponse:
        """
        Executes conformal PostGIS proximity analysis between a property and municipal infrastructure
        corridors (roads, drainage, water, electricity).
        Enforces strict temporal consistency notice when historical infrastructure data is unavailable.
        """
        prop_upper = property_type.upper()

        # 1. Fetch target property geometry
        prop_geom = None
        if prop_upper == "PARCEL":
            p_stmt = select(Parcel.geom_2d).where(Parcel.id == property_id)
            p_res = await db.execute(p_stmt)
            prop_geom = p_res.scalar_one_or_none()
        elif prop_upper == "BUILDING":
            b_stmt = select(Building.footprint_geom).where(Building.id == property_id)
            b_res = await db.execute(b_stmt)
            prop_geom = b_res.scalar_one_or_none()

        if prop_geom is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Property {prop_upper} with ID '{property_id}' not found or lacks spatial geometry.",
            )

        # 2. Conformal metric proximity query using ST_DWithin and ST_Distance
        # ST_DWithin with geography ensures metric meters on WGS84
        distance_expr = func.ST_Distance(
            cast(prop_geom, Geography),
            cast(Infrastructure.geom_spatial, Geography)
        ).label("dist_m")

        intersects_expr = func.ST_Intersects(prop_geom, Infrastructure.geom_spatial).label("intersects")
        geojson_expr = func.ST_AsGeoJSON(Infrastructure.geom_spatial).label("geojson")

        stmt = (
            select(
                Infrastructure,
                distance_expr,
                intersects_expr,
                geojson_expr
            )
            .where(
                func.ST_DWithin(
                    cast(prop_geom, Geography),
                    cast(Infrastructure.geom_spatial, Geography),
                    max_distance_meters
                )
            )
            .order_by(distance_expr)
            .limit(50)
        )

        res = await db.execute(stmt)
        rows = res.all()

        nearby_items: List[NearbyInfrastructureItem] = []
        has_temporal_mismatch = False

        for infra, dist_m, is_intersecting, geojson_str in rows:
            dist_val = round(float(dist_m), 2)
            geom_dict = json.loads(geojson_str) if geojson_str else None

            # Classification rules:
            # - CONNECTED ONLY if explicit physical connection flag is true
            # - SPATIALLY_INTERSECTS if PostGIS ST_Intersects is true
            # - ADJACENT if distance <= 1.0m
            # - WITHIN if distance <= 15.0m
            # - NEAR if distance <= max_distance_meters
            net_conn = infra.network_connectivity or {}
            is_connected = bool(net_conn.get("is_physically_connected", False))

            if is_connected and is_intersecting:
                rel_type = InfrastructureRelationshipType.CONNECTED
            elif is_intersecting:
                rel_type = InfrastructureRelationshipType.SPATIALLY_INTERSECTS
            elif dist_val <= 1.0:
                rel_type = InfrastructureRelationshipType.ADJACENT
            elif dist_val <= 15.0:
                rel_type = InfrastructureRelationshipType.WITHIN
            else:
                rel_type = InfrastructureRelationshipType.NEAR

            # Check temporal epoch alignment
            if observation_date and infra.observation_date and infra.observation_date != observation_date:
                has_temporal_mismatch = True

            nearby_items.append(
                NearbyInfrastructureItem(
                    id=infra.id,
                    name=infra.name,
                    utility_category=infra.utility_category,
                    relationship_type=rel_type,
                    distance_meters=dist_val,
                    is_subsurface=infra.is_subsurface,
                    depth_meters=float(infra.depth_meters) if infra.depth_meters else 0.0,
                    is_connected=is_connected,
                    observation_date=infra.observation_date,
                    geom_geojson=geom_dict,
                    evidence_source_type=infra.evidence_source_type,
                )
            )

        # Mandatory temporal consistency notice (Requirement 63)
        temporal_notice = None
        is_aligned = True
        if observation_date and has_temporal_mismatch:
            is_aligned = False
            temporal_notice = (
                "Historical infrastructure data is unavailable for this date. "
                "Current infrastructure is shown for reference."
            )

        return PropertyInfrastructureResponse(
            property_id=property_id,
            property_type=prop_upper,
            observation_epoch=observation_date,
            nearby_infrastructure=nearby_items,
            is_historical_aligned=is_aligned,
            temporal_notice=temporal_notice,
        )

    @staticmethod
    async def get_infrastructure_nearby_properties(
        db: AsyncSession,
        infrastructure_id: UUID,
        max_distance_meters: float = 50.0,
    ) -> List[Dict[str, Any]]:
        """
        Reverse spatial proximity query: Identifies parcels and buildings situated along
        an infrastructure corridor (e.g., Road, Drainage, or Pipeline buffer).
        """
        i_stmt = select(Infrastructure).where(Infrastructure.id == infrastructure_id)
        i_res = await db.execute(i_stmt)
        infra = i_res.scalar_one_or_none()
        if not infra:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Infrastructure asset with ID '{infrastructure_id}' not found.",
            )

        # Query nearby parcels
        p_dist = func.ST_Distance(
            cast(infra.geom_spatial, Geography),
            cast(Parcel.geom_2d, Geography)
        ).label("dist_m")

        p_stmt = (
            select(Parcel, p_dist)
            .where(
                func.ST_DWithin(
                    cast(infra.geom_spatial, Geography),
                    cast(Parcel.geom_2d, Geography),
                    max_distance_meters
                )
            )
            .order_by(p_dist)
            .limit(25)
        )
        p_res = await db.execute(p_stmt)
        results = []

        for p, d in p_res.all():
            results.append({
                "entity_type": "PARCEL",
                "entity_id": str(p.id),
                "identifier": p.ulpin_2d or p.survey_number,
                "distance_meters": round(float(d), 2),
                "area_sqm": float(p.computed_area_sqm) if p.computed_area_sqm else None,
                "land_use": p.land_use,
            })

        return results
