"""
BhuSetu 3D Spatial Building-to-Parcel Associator
Team: TANTRAKATHA | SIH 2026 (SIH26011)
Phase 6: AI Building Extraction + 3D Generation
"""
import uuid
from typing import Tuple, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from geoalchemy2.shape import to_shape, from_shape
from shapely.geometry.base import BaseGeometry
import shapely.geometry

from app.models.parcel import Parcel
from app.core.logging import logger


class ParcelAssociator:
    """
    Deterministically evaluates spatial containment and overlap between
    extracted building footprints and cadastral parcels.
    Statuses: ASSOCIATED (high overlap), AMBIGUOUS (crosses boundary), UNMATCHED (outside known parcels).
    """

    @classmethod
    async def associate_building(
        cls,
        db: AsyncSession,
        footprint_geom: BaseGeometry,
        min_overlap_ratio: float = 0.60
    ) -> Tuple[Optional[uuid.UUID], str, float]:
        """
        Finds candidate parcel for a given building footprint.
        
        Returns:
            (parcel_id, association_status, overlap_ratio)
            association_status: 'ASSOCIATED', 'AMBIGUOUS', 'UNMATCHED'
        """
        if footprint_geom is None or footprint_geom.is_empty:
            return None, "UNMATCHED", 0.0

        minx, miny, maxx, maxy = footprint_geom.bounds
        envelope = func.ST_MakeEnvelope(minx, miny, maxx, maxy, 4326)

        # Query parcels intersecting the building footprint bounding box
        query = (
            select(Parcel)
            .where(func.ST_Intersects(Parcel.geom_2d, envelope))
            .limit(10)
        )
        result = await db.execute(query)
        intersecting_parcels = list(result.scalars().all())

        if not intersecting_parcels:
            return None, "UNMATCHED", 0.0

        bldg_area = footprint_geom.area
        if bldg_area <= 0:
            return None, "UNMATCHED", 0.0

        overlap_matches = []
        for p in intersecting_parcels:
            p_shape = to_shape(p.geom_2d)
            if p_shape.intersects(footprint_geom):
                intersection = p_shape.intersection(footprint_geom)
                ratio = float(intersection.area / bldg_area)
                if ratio > 0.05:
                    overlap_matches.append((p.id, ratio))

        if not overlap_matches:
            return None, "UNMATCHED", 0.0

        # Sort by overlap ratio descending
        overlap_matches.sort(key=lambda x: x[1], reverse=True)
        top_parcel_id, top_ratio = overlap_matches[0]

        if top_ratio >= min_overlap_ratio:
            return top_parcel_id, "ASSOCIATED", round(top_ratio, 3)
        elif len(overlap_matches) > 1 or (0.20 <= top_ratio < min_overlap_ratio):
            return top_parcel_id, "AMBIGUOUS", round(top_ratio, 3)
        else:
            return None, "UNMATCHED", round(top_ratio, 3)
